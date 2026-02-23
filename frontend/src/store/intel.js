import axios from 'axios'
import * as echarts from 'echarts'

export function setupIntel(store, actions) {
    return {
        async runAiSummary() {
            if (store.showAiSummary) { store.showAiSummary = false; return; }
            actions.addLog("正在分析全局数据...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/summary', { filename: store.currentDataFile });
                if (res.data.status === 'success') { store.aiSummaryText = res.data.data; store.showAiSummary = true; actions.addLog("解读报告生成", "success"); }
            } catch (err) { actions.showDialog({ title: '❌ 分析失败', message: err.response?.data?.message }); }
        },
        async fetchRadarOptions() {
            if (!store.radarIdCol) return;
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/get_options', { filename: store.currentDataFile, column: store.radarIdCol });
                if (res.data.status === 'success') { store.radarOptions = res.data.data; store.selectedRadarTarget = ''; }
            } catch(err) {}
        },
        async runRadarChart() {
            if (store.showRadar) { store.showRadar = false; return; }
            if (!store.radarIdCol || !store.selectedRadarTarget) return actions.showDialog({title:'提示', message:'请选择身份！'});
            actions.addLog(`计算雷达多维数据...`);
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/visualize/radar', { filename: store.currentDataFile, id_col: store.radarIdCol, target_val: store.selectedRadarTarget });
                if (res.data.status === 'success') {
                    store.radarResult = res.data.data; store.showRadar = true; actions.addLog(`雷达图渲染`, "success");
                    setTimeout(() => {
                       const dom = document.getElementById('radar-container');
                       if (dom) {
                           let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                           chart.setOption({
                               title: { text: `${store.radarResult.target_name} vs 群体`, left: 'center' }, tooltip: { trigger: 'item' }, legend: { bottom: 0, data: ['群体平均', store.radarResult.target_name] },
                               radar: { indicator: store.radarResult.indicators, radius: '65%' },
                               series: [{ type: 'radar', data: [ { value: store.radarResult.avg_data, name: '群体平均', areaStyle: {} }, { value: store.radarResult.target_data, name: store.radarResult.target_name, areaStyle: {}, lineStyle: {width: 3} } ] }]
                           });
                       }
                    }, 300);
                }
            } catch (err) {}
        },
        async runMachineLearning() {
            if (store.showML) { store.showML = false; return; }
            if (!store.mlTargetVar || store.mlFeatureVars.length === 0) return actions.showDialog({ title: '提示', message: '请选择变量！' });
            actions.addLog("启动随机森林模型...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/predict', { filename: store.currentDataFile, target_col: store.mlTargetVar, feature_cols: store.mlFeatureVars });
                if (res.data.status === 'success') {
                    store.mlResult = res.data.data; store.showML = true; actions.addLog(`模型训练完毕！`, "success");
                    setTimeout(() => {
                        const impDom = document.getElementById('ml-importance-chart');
                        if (impDom) {
                            let chart = echarts.getInstanceByDom(impDom) || echarts.init(impDom);
                            chart.setOption({ title: { text: '特征重要性', left: 'center' }, xAxis: { type: 'category', data: store.mlResult.features }, yAxis: { type: 'value' }, series: [{ data: store.mlResult.importances, type: 'bar' }] });
                        }
                        const scatDom = document.getElementById('ml-scatter-chart');
                        if (scatDom) {
                            let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom);
                            chart.setOption({ title: { text: '真实值 vs 预测值', left: 'center' }, xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [{ type: 'scatter', data: store.mlResult.scatter }] });
                        }
                    }, 300);
                }
            } catch (err) { actions.showDialog({ title: '训练失败', message: err.response?.data?.message }); }
        }
    };
}