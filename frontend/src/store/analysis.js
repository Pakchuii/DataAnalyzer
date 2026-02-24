import axios from 'axios'
import * as echarts from 'echarts'

export function setupAnalysis(store, actions) {
    return {
        async runDescriptiveStats() {
            if (store.showStats) { store.showStats = false; return; }
            if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' });
            actions.addLog("正在进行描述性统计计算...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/descriptive', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') { store.statsResult = res.data.data; store.showStats = true; actions.addLog("描述统计计算完成！", "success"); }
            } catch (err) {}
        },
        async runTTest() {
            if (store.showTTest) { store.showTTest = false; return; }
            if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少必要变量！' });
            actions.addLog(`正在执行独立样本 t 检验...`);
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/ttest', { filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars });
                if (res.data.status === 'success') { store.ttestResult = res.data.data; store.showTTest = true; actions.addLog("t 检验矩阵完成！", "success"); }
                else { actions.showDialog({ title: '计算失败', message: res.data.message }); }
            } catch (err) {}
        },
        async runAdvancedAnalysis() {
            if (store.showAdvanced) { store.showAdvanced = false; return; }
            if (store.selectedVars.length < 2) return actions.showDialog({ title: '提示', message: '至少勾选 2 个变量！' });
            actions.addLog("正在执行高级关联运算...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/advanced', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') {
                    store.advancedResult = res.data.data; store.showAdvanced = true; actions.addLog("矩阵计算完成！", "success");
                    setTimeout(() => {
                        const heatDom = document.getElementById('heatmap-container');
                        if (heatDom && res.data.data.correlation_matrix.length > 0) {
                            let chart = echarts.getInstanceByDom(heatDom) || echarts.init(heatDom); chart.clear();
                            chart.setOption({
                                title: { text: '相关性热力图', left: 'center' }, tooltip: { position: 'top', formatter: (p) => `${res.data.data.variables[p.value[0]]} vs ${res.data.data.variables[p.value[1]]}: ${p.value[2]}` },
                                grid: { height: '60%', top: '15%' }, xAxis: { type: 'category', data: res.data.data.variables, axisLabel: { rotate: 30 } }, yAxis: { type: 'category', data: res.data.data.variables },
                                visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } },
                                series: [{ type: 'heatmap', data: res.data.data.correlation_matrix, label: { show: true } }]
                            });
                        }
                        const scatDom = document.getElementById('scatter-container');
                        if (scatDom && res.data.data.scatter_data.length > 0) {
                            let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom); chart.clear();
                            chart.setOption({
                                title: { text: `散点图`, left: 'center' }, xAxis: { name: res.data.data.scatter_vars[0], type: 'value', scale: true }, yAxis: { name: res.data.data.scatter_vars[1], type: 'value', scale: true },
                                tooltip: { trigger: 'item' }, series: [{ symbolSize: 12, data: res.data.data.scatter_data, type: 'scatter', itemStyle: { color: '#ee6666' } }]
                            });
                        }
                    }, 300);
                }
            } catch (error) {}
        },
        async generateCharts() {
            if (store.showCharts) { store.showCharts = false; store.showVisControl = false; return; }
            if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' });
            actions.addLog("提取图表特征点...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/visualize/distribution', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') { store.chartsData = res.data.data; store.visActiveVars = [...store.selectedVars]; store.showCharts = true; store.showVisControl = true; }
            } catch (error) {}
        },
       renderCharts() {
            const initChart = (domId, options) => {
                const dom = document.getElementById(domId);
                if (dom) { let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear(); chart.setOption({...options, animation: true}); }
            };

            // 统一的赛博黑玻璃 Tooltip 样式
            const glassTooltip = {
                trigger: 'item',
                backgroundColor: 'rgba(20, 20, 25, 0.85)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 13 },
                backdropFilter: 'blur(4px)'
            };

            store.chartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => {
                // 直方图 (加上了 tooltip)
                initChart(`hist-${item.variable}`, {
                    title: { text: `${item.variable} - 分布`, left: 'center' },
                    tooltip: { ...glassTooltip, formatter: '{b} <br/> 频数: <b>{c}</b>' },
                    xAxis: { type: 'category', data: item.histogram.categories },
                    yAxis: { type: 'value' },
                    series: [{ data: item.histogram.series, type: 'bar', itemStyle: {color: '#5470c6'} }]
                });

                // 箱线图 (加上了 tooltip)
                initChart(`box-${item.variable}`, {
                    title: { text: `${item.variable} - 箱线图`, left: 'center' },
                    tooltip: { ...glassTooltip, formatter: (p) => `${p.name}<br/>最大值: ${p.data[5]}<br/>3/4分位: ${p.data[4]}<br/>中位数: ${p.data[3]}<br/>1/4分位: ${p.data[2]}<br/>最小值: ${p.data[1]}` },
                    xAxis: { type: 'category', data: [item.variable] },
                    yAxis: { type: 'value', scale: true },
                    series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: {color: '#fac858'} }]
                });
            });
            actions.addLog("ECharts 引擎渲染完成 (Tooltip 悬浮已激活)！", "success");
        }
    };
}