import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupCorrelation(store, actions) {
    return {
        async runAdvancedAnalysis() {
            if (store.showAdvanced) { store.showAdvanced = false; return; }
            if (!store.fileInfo || store.selectedVars.length < 2) return;
            actions.addLog("正在执行关联分析...", "info");
            try {
                const res = await api.post('/api/analyze/advanced', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.advancedResult = res.data.data;
                    store.showAdvanced = true;
                    setTimeout(() => { actions.renderAdvancedCharts(); }, 200);
                    actions.addLog("✅ 关联分析完成", "success");
                }
            } catch (err) { actions.addLog(`❌ 关联分析失败: ${err.message}`, "error"); }
        },

        renderAdvancedCharts() {
            const data = store.advancedResult;
            const heatmapDom = document.getElementById('heatmap-container');
            if (heatmapDom) {
                const chart = echarts.init(heatmapDom);
                const vars = data.variables;
                chart.setOption({
                    title: { text: 'Pearson 相关系数热力图', left: 'center', textStyle: { fontSize: 14, color: '#555' } },
                    tooltip: { formatter: p => `${vars[p.value[0]]} × ${vars[p.value[1]]}: ${p.value[2]}` },
                    xAxis: { type: 'category', data: vars, axisLabel: { rotate: 30, fontSize: 10 } },
                    yAxis: { type: 'category', data: vars },
                    visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 5, inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] } },
                    series: [{ type: 'heatmap', data: data.correlation_matrix, label: { show: true, formatter: p => p.value[2] } }]
                });
            }
            const scatterDom = document.getElementById('scatter-container');
            if (scatterDom) {
                const chart = echarts.init(scatterDom);
                chart.setOption({
                    title: { text: `${data.scatter_vars[0]} vs ${data.scatter_vars[1]}`, left: 'center', textStyle: { fontSize: 14, color: '#555' } },
                    tooltip: { trigger: 'item', formatter: p => `${data.scatter_vars[0]}: ${p.value[0]}<br>${data.scatter_vars[1]}: ${p.value[1]}` },
                    xAxis: { name: data.scatter_vars[0] }, yAxis: { name: data.scatter_vars[1] },
                    series: [{ type: 'scatter', data: data.scatter_data, symbolSize: 8, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#b37feb' }, { offset: 1, color: '#722ed1' }]) } }]
                });
            }
        }
    };
}
