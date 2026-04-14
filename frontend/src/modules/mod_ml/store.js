import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupML(store, actions) {
    return {
        async runMachineLearning() {
            if (store.showML) { store.showML = false; store.predictData = null; return; }
            if (!store.fileInfo || !store.mlTargetVar || store.mlFeatureVars.length === 0) return;
            actions.addLog("正在训练随机森林模型...", "info");
            try {
                const res = await api.post('/api/predict', {
                    filename: store.currentDataFile, target_col: store.mlTargetVar, feature_cols: store.mlFeatureVars
                });
                if (res.data.status === 'success') {
                    store.mlResult = res.data.data;
                    store.showML = true;
                    setTimeout(() => { actions.renderMLCharts(); }, 200);
                    actions.addLog("✅ 模型训练完成", "success");
                }
            } catch (err) { actions.addLog(`❌ 模型训练失败: ${err.message}`, "error"); }
        },

        renderMLCharts() {
            const impDom = document.getElementById('ml-importance-chart');
            if (impDom && store.mlResult) {
                const chart = echarts.init(impDom);
                chart.setOption({
                    title: { text: '特征重要性排名', left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis' },
                    xAxis: { type: 'category', data: store.mlResult.features, axisLabel: { rotate: 30 } },
                    yAxis: { type: 'value', name: '重要性 (%)' },
                    series: [{ type: 'bar', data: store.mlResult.importances, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#b37feb' }, { offset: 1, color: '#722ed1' }]) } }]
                });
            }
            const scatterDom = document.getElementById('ml-scatter-chart');
            if (scatterDom && store.mlResult) {
                const chart = echarts.init(scatterDom);
                chart.setOption({
                    title: { text: '预测值 vs 真实值', left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'item', formatter: p => `真实: ${p.value[0]}<br>预测: ${p.value[1]}` },
                    xAxis: { name: '真实值' }, yAxis: { name: '预测值' },
                    series: [
                        { type: 'scatter', data: store.mlResult.scatter, symbolSize: 8, itemStyle: { color: '#722ed1' } },
                        { type: 'line', data: store.mlResult.scatter.length > 0 ? [[store.mlResult.scatter[0][0], store.mlResult.scatter[0][0]], [store.mlResult.scatter[store.mlResult.scatter.length-1][0], store.mlResult.scatter[store.mlResult.scatter.length-1][0]]] : [], lineStyle: { color: '#e6a23c', type: 'dashed' }, symbol: 'none' }
                    ]
                });
            }
        },

        async runNewPrediction() {
            if (!store.mlResult) return;
            actions.addLog("正在进行未知数据推理...", "info");
            try {
                const res = await api.post('/api/predict_new', {
                    filename: store.currentDataFile, target_col: store.mlTargetVar, feature_cols: store.mlFeatureVars
                });
                if (res.data.status === 'success') {
                    store.predictData = res.data.data;
                    const insight = `该模型在 **${res.data.data.sampleSize}** 条测试数据上的平均预测置信度为 **${res.data.data.confidence}%**。`;
                    store.predictData.insight = insight;
                    setTimeout(() => { actions.renderPredictChart(); }, 200);
                    actions.addLog("✅ 推理完成", "success");
                }
            } catch (err) { actions.addLog(`❌ 推理失败: ${err.message}`, "error"); }
        },

        renderPredictChart() {
            const dom = document.getElementById('new-predict-chart');
            if (!dom || !store.predictData) return;
            const chart = echarts.init(dom);
            chart.setOption({
                tooltip: { trigger: 'axis' },
                legend: { data: ['真实值', '预测值'], bottom: 5 },
                xAxis: { type: 'category', data: store.predictData.labels, axisLabel: { rotate: 30, fontSize: 9 } },
                yAxis: { type: 'value' },
                series: [
                    { name: '真实值', type: 'line', data: store.predictData.realValues, smooth: true, lineStyle: { color: '#1890ff' }, itemStyle: { color: '#1890ff' } },
                    { name: '预测值', type: 'line', data: store.predictData.predictedValues, smooth: true, lineStyle: { color: '#722ed1', type: 'dashed' }, itemStyle: { color: '#722ed1' } }
                ]
            });
        }
    };
}
