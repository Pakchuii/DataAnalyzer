import axios from 'axios'
import * as echarts from 'echarts'

/**
 * 【算法调度控制层：异步任务分发与 ECharts 实例管线】
 * 封装了与 Python 算法微服务交互的 Axios 网络请求层，以及复杂图表的 DOM 挂载生命周期逻辑。
 */
export function setupAnalysis(store, actions) {
    return {
        // 调度模块一：描述性宏观统计
        async runDescriptiveStats() {
            if (store.showStats) { store.showStats = false; return; }
            if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选需要进行基础统计的数值变量！' });
            actions.addLog("正在向分析中台投递描述性统计计算指令...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/descriptive', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') { store.statsResult = res.data.data; store.showStats = true; actions.addLog("基础描述统计测度计算完成！", "success"); }
            } catch (err) {}
        },

        // 调度模块二：独立样本推断性假说检验
        async runTTest() {
            if (store.showTTest) { store.showTTest = false; return; }
            if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少执行方差分析的必要结构变量！' });
            actions.addLog(`正在执行独立样本 t 检验核心推断...`);
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/ttest', { filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars });
                if (res.data.status === 'success') { store.ttestResult = res.data.data; store.showTTest = true; actions.addLog("t 检验矩阵判定完成！", "success"); }
                else { actions.showDialog({ title: '计算失败', message: res.data.message }); }
            } catch (err) {}
        },

        // 调度模块三：高级线性关联矩阵解析
        async runAdvancedAnalysis() {
            if (store.showAdvanced) { store.showAdvanced = false; return; }
            if (store.selectedVars.length < 2) return actions.showDialog({ title: '提示', message: '构建协方差矩阵至少需要勾选 2 个维度变量！' });
            actions.addLog("正在执行高级关联深度运算...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/advanced', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') {
                    store.advancedResult = res.data.data; store.showAdvanced = true; actions.addLog("关联映射计算完成，正准备渲染层！", "success");

                    // 【渲染时序防御】：等待 Vue 虚拟 DOM 实装后再调用 ECharts API 挂载 Canvas 节点
                    setTimeout(() => {
                        const heatDom = document.getElementById('heatmap-container');
                        if (heatDom && res.data.data.correlation_matrix.length > 0) {
                            let chart = echarts.getInstanceByDom(heatDom) || echarts.init(heatDom); chart.clear();
                            chart.setOption({
                                title: { text: '多维相关性热力图', left: 'center' }, tooltip: { position: 'top', formatter: (p) => `${res.data.data.variables[p.value[0]]} 关联度 ${res.data.data.variables[p.value[1]]}: 核心值为 ${p.value[2]}` },
                                grid: { height: '60%', top: '15%' }, xAxis: { type: 'category', data: res.data.data.variables, axisLabel: { rotate: 30 } }, yAxis: { type: 'category', data: res.data.data.variables },
                                visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } },
                                series: [{ type: 'heatmap', data: res.data.data.correlation_matrix, label: { show: true } }]
                            });
                        }
                        const scatDom = document.getElementById('scatter-container');
                        if (scatDom && res.data.data.scatter_data.length > 0) {
                            let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom); chart.clear();
                            chart.setOption({
                                title: { text: `离散特征散点图`, left: 'center' }, xAxis: { name: res.data.data.scatter_vars[0], type: 'value', scale: true }, yAxis: { name: res.data.data.scatter_vars[1], type: 'value', scale: true },
                                tooltip: { trigger: 'item' }, series: [{ symbolSize: 12, data: res.data.data.scatter_data, type: 'scatter', itemStyle: { color: '#ee6666' } }]
                            });
                        }
                    }, 300);
                }
            } catch (error) {}
        },

        async generateCharts() {
            if (store.showCharts) { store.showCharts = false; store.showVisControl = false; return; }
            if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选需要投影的特征图表！' });
            actions.addLog("提取图表几何特征点...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/visualize/distribution', { filename: store.currentDataFile, columns: store.selectedVars });
                if (res.data.status === 'success') { store.chartsData = res.data.data; store.visActiveVars = [...store.selectedVars]; store.showCharts = true; store.showVisControl = true; }
            } catch (error) {}
        },

       // 【工厂模式设计】：可视化图表批量生产装配线
       renderCharts() {
            const initChart = (domId, options) => {
                const dom = document.getElementById(domId);
                // 【前端防爆机制】：采用单例模式保障节点更新，防止 SPA (单页应用) 常见的 ECharts 内存泄漏问题。
                if (dom) { let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear(); chart.setOption({...options, animation: true}); }
            };

            // 统一的赛博黑玻璃 Tooltip 悬浮样式组件库
            const glassTooltip = {
                trigger: 'item',
                backgroundColor: 'rgba(20, 20, 25, 0.85)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 13 },
                backdropFilter: 'blur(4px)'
            };

            // 遍历活跃节点实施局部渲染降级
            store.chartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => {
                // 装载：高斯分布直方图
                initChart(`hist-${item.variable}`, {
                    title: { text: `${item.variable} - 分布`, left: 'center' },
                    tooltip: { ...glassTooltip, formatter: '{b} <br/> 频数: <b>{c}</b>' },
                    xAxis: { type: 'category', data: item.histogram.categories },
                    yAxis: { type: 'value' },
                    series: [{ data: item.histogram.series, type: 'bar', itemStyle: {color: '#5470c6'} }]
                });

                // 装载：五数概括箱线图
                initChart(`box-${item.variable}`, {
                    title: { text: `${item.variable} - 箱线图`, left: 'center' },
                    tooltip: { ...glassTooltip, formatter: (p) => `${p.name}<br/>上边缘最大值: ${p.data[5]}<br/>上四分位数 (75%): ${p.data[4]}<br/>中位数核心: ${p.data[3]}<br/>下四分位数 (25%): ${p.data[2]}<br/>下边缘极值: ${p.data[1]}` },
                    xAxis: { type: 'category', data: [item.variable] },
                    yAxis: { type: 'value', scale: true },
                    series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: {color: '#fac858'} }]
                });
            });
            actions.addLog("底层 ECharts 引擎渲染挂载完成 (全局玻璃悬浮探测器已激活)！", "success");
        }
    };
}