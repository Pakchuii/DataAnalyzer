import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupVisualize(store, actions) {
    return {
        async generateCharts() {
            if (store.showCharts) { store.showCharts = false; return; }
            if (!store.fileInfo || store.selectedVars.length === 0) return;
            actions.addLog("正在生成多维分布图谱...", "info");
            try {
                const res = await api.post('/api/visualize/distribution', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.chartsData = res.data.data;
                    store.visActiveVars = store.selectedVars.slice();
                    store.showCharts = true;
                    setTimeout(() => { actions.renderCharts(); }, 200);
                    actions.addLog("✅ 可视化图谱已生成", "success");
                }
            } catch (err) { actions.addLog(`❌ 图表生成失败: ${err.message}`, "error"); }
        },

        renderCharts() {
            store.chartsData.forEach(item => {
                if (!store.visActiveVars.includes(item.variable)) return;

                const histDom = document.getElementById('hist-' + item.variable);
                const boxDom = document.getElementById('box-' + item.variable);
                if (histDom) {
                    const histChart = echarts.init(histDom);
                    histChart.setOption({
                        title: { text: `${item.variable} 直方分布`, left: 'center', textStyle: { fontSize: 14, color: '#555' } },
                        tooltip: { trigger: 'axis' },
                        xAxis: { type: 'category', data: item.histogram.categories, axisLabel: { rotate: 30, fontSize: 10 } },
                        yAxis: { type: 'value' },
                        series: [{ type: 'bar', data: item.histogram.series, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#69c0ff' }, { offset: 1, color: '#096dd9' }]) } }]
                    });
                }
                if (boxDom) {
                    const boxChart = echarts.init(boxDom);
                    boxChart.setOption({
                        title: { text: `${item.variable} 箱线图`, left: 'center', textStyle: { fontSize: 14, color: '#555' } },
                        tooltip: { trigger: 'item' },
                        xAxis: { type: 'category', data: [item.variable] },
                        yAxis: { type: 'value' },
                        series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: { color: '#e6f7ff', borderColor: '#1890ff' } }]
                    });
                }
            });
        }
    };
}
