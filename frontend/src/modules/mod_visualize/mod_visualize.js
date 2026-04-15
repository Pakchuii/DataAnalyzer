import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupVisualize(store, actions) {
    return {
        async generateCharts() {
            if (store.showCharts) { store.showCharts = false; store.showVisControl = false; return; }
            if (store.selectedVars.length === 0) return actions.openAlert({ title: '提示', message: '请勾选需要投影的特征图表！' });
            actions.addLog("提取图表几何特征点...");
            try {
                const res = await api.post('/api/visualize/distribution', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.chartsData = res.data.data;
                    store.visActiveVars = [...store.selectedVars];
                    store.showCharts = true;
                    store.showVisControl = true;
                }
            } catch (err) { actions.addLog(`❌ 图表生成失败: ${err.message}`, "error"); }
        },

        // 【工厂模式设计】：可视化图表批量生产装配线
        renderCharts() {
            const initChart = (domId, options) => {
                const dom = document.getElementById(domId);
                // 【前端防爆机制】：采用单例模式保障节点更新，启用暗色主题适配
                if (dom) { 
                    let chart = echarts.getInstanceByDom(dom) || echarts.init(dom, store.isDarkMode ? 'dark' : null); 
                    chart.clear(); 
                    chart.setOption({
                        ...options, 
                        backgroundColor: 'transparent',
                        animation: true
                    }); 
                }
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
                    series: [{ data: item.histogram.series, type: 'bar', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#69c0ff' }, { offset: 1, color: '#096dd9' }]) } }]
                });

                // 装载：五数概括箱线图
                initChart(`box-${item.variable}`, {
                    title: { text: `${item.variable} - 箱线图`, left: 'center' },
                    tooltip: { ...glassTooltip, formatter: (p) => `${p.name}<br/>上边缘最大值: ${p.data[5]}<br/>上四分位数 (75%): ${p.data[4]}<br/>中位数核心: ${p.data[3]}<br/>下四分位数 (25%): ${p.data[2]}<br/>下边缘极值: ${p.data[1]}` },
                    xAxis: { type: 'category', data: [item.variable] },
                    yAxis: { type: 'value', scale: true },
                    series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: { color: '#e6f7ff', borderColor: '#1890ff' } }]
                });
            });
            actions.addLog("底层 ECharts 引擎渲染挂载完成 (全局玻璃悬浮探测器已激活)！", "success");
        }
    };
}
