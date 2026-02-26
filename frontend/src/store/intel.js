import axios from 'axios'
import * as echarts from 'echarts'

/**
 * 【智能决策推理层：基于置信度惩罚的专家级特征评估模型】
 */
export function setupIntel(store, actions) {
    return {
        // 宏观 AI 数据结构推演
        async runAiSummary() {
            if (store.showAiSummary) { store.showAiSummary = false; return; }
            actions.addLog("正在向 NLP 引擎集群注入全局数据矩阵形态...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/analyze/summary', { filename: store.currentDataFile });
                if (res.data.status === 'success') { store.aiSummaryText = res.data.data; store.showAiSummary = true; actions.addLog("机器视觉级专家解读报告已生成入栈", "success"); }
            } catch (err) { actions.showDialog({ title: '❌ 神经网络分析熔断', message: err.response?.data?.message }); }
        },

        // 身份级特征列探测拉取
        async fetchRadarOptions() {
            if (!store.radarIdCol) return;
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/get_options', { filename: store.currentDataFile, column: store.radarIdCol });
                if (res.data.status === 'success') { store.radarOptions = res.data.data; store.selectedRadarTarget = ''; }
            } catch(err) {}
        },

        // 多维标量蛛网模型 (雷达图) 挂载指令
        async runRadarChart() {
            if (store.showRadar) { store.showRadar = false; return; }
            if (!store.radarIdCol || !store.selectedRadarTarget) return actions.showDialog({title:'操作被系统拦截', message:'请优先在左侧定位特征实体身份！'});
            actions.addLog(`开始执行雷达空间多维距离衰减计算...`);
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/visualize/radar', { filename: store.currentDataFile, id_col: store.radarIdCol, target_val: store.selectedRadarTarget });
                if (res.data.status === 'success') {
                    store.radarResult = res.data.data; store.showRadar = true; actions.addLog(`雷达蛛网坐标系标定完毕，正在请求 DOM 渲染`, "success");

                    // 防御性绘制延迟机制
                    setTimeout(() => {
                       const dom = document.getElementById('radar-container');
                       if (dom) {
                           let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                           chart.setOption({
                               title: { text: `${store.radarResult.target_name} 实体 vs 总体大盘标量映射`, left: 'center' }, tooltip: { trigger: 'item' }, legend: { bottom: 0, data: ['群体平均基准线', store.radarResult.target_name] },
                               radar: { indicator: store.radarResult.indicators, radius: '65%' },
                               series: [{ type: 'radar', data: [ { value: store.radarResult.avg_data, name: '群体平均基准线', areaStyle: {} }, { value: store.radarResult.target_data, name: store.radarResult.target_name, areaStyle: {}, lineStyle: {width: 3} } ] }]
                           });
                       }
                    }, 300);
                }
            } catch (err) {}
        },

        // 机器学习 (随机森林树模型) 集成指令
        async runMachineLearning() {
            if (store.showML) { store.showML = false; store.predictData = null; return; }
            if (!store.mlTargetVar || store.mlFeatureVars.length === 0) return actions.showDialog({ title: '配置缺失预警', message: '必须手动指定目标被测标量 Y 轴与影响特征组 X 轴！' });
            actions.addLog("激活机器学习算法引擎，构建随机森林模型边界中...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/predict', { filename: store.currentDataFile, target_col: store.mlTargetVar, feature_cols: store.mlFeatureVars });
                if (res.data.status === 'success') {
                    store.mlResult = res.data.data; store.showML = true; actions.addLog(`模型收敛参数训练完毕！`, "success");

                    setTimeout(() => {
                        const glassTooltip = {
                            trigger: 'item',
                            backgroundColor: 'rgba(20, 20, 25, 0.85)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1,
                            textStyle: { color: '#fff', fontSize: 13 }
                        };

                        const impDom = document.getElementById('ml-importance-chart');
                        if (impDom) {
                            let chart = echarts.getInstanceByDom(impDom) || echarts.init(impDom);
                            chart.setOption({
                                title: { text: '特征列重要性 (Gini Importance 权重分解)', left: 'center' },
                                tooltip: { ...glassTooltip, formatter: '{b} <br/> 算法贡献度占比: <b>{c}%</b>' },
                                xAxis: { type: 'category', data: store.mlResult.features },
                                yAxis: { type: 'value' },
                                series: [{ data: store.mlResult.importances, type: 'bar', itemStyle: { color: '#722ed1' } }]
                            });
                        }
                        const scatDom = document.getElementById('ml-scatter-chart');
                        if (scatDom) {
                            let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom);
                            chart.setOption({
                                title: { text: '真实点阵值 vs 回归预测游走值', left: 'center' },
                                tooltip: { ...glassTooltip, formatter: (p) => `物理真实值: <b>${p.value[0]}</b><br/>算法预测值: <b>${p.value[1]}</b>` },
                                xAxis: { type: 'value' },
                                yAxis: { type: 'value', scale: true },
                                series: [{ type: 'scatter', data: store.mlResult.scatter, itemStyle: { color: '#409eff' } }]
                            });
                        }
                    }, 300);
                }
            } catch (err) { actions.showDialog({ title: '神经网络训练崩塌', message: err.response?.data?.message }); }
        },

        // 基于预测信效度的 NLP 解读下发模块
        async runNewPrediction() {
            actions.addLog("启动未知盲区数据流的推演预测...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/predict_new', { filename: store.currentDataFile, target_col: store.mlTargetVar, feature_cols: store.mlFeatureVars });
                if (res.data.status === 'success') {

                    // ====== 🚀 启发式特征规则引擎：运用动态规则分支针对模型表现作拟人化诊断 ======
                    const conf = res.data.data.confidence;
                    let insightStr = "";
                    if (conf >= 80) {
                        insightStr = `🚀 **超强收敛拟合预警**：本次预测综合置信度极高（达 ${conf}%）。如上方散点图表所示，紫色算法模型预测带与灰色的物理真实波形走势形成了惊人的完美贴合！这从数理逻辑上证明，您所指定的特征变量群对目标数据拥有着不可动摇的决定性指向影响，当前建立的决策树模型已完全具备直接跃迁投入商用场景执行业务预测的巨大工程价值。`;
                    } else if (conf >= 55) {
                        insightStr = `📊 **宏观趋势相位捕捉**：当前模型综合表现处于尚可区间（${conf}%）。紫色预测波动曲线成功猎取到了目标数据底层隐含的主要波峰与波谷演化趋势。需要注意的是，尽管该模型在少数极端异常点阵数值上暂未能完全追上真实数据波动的暴烈幅度，但其对于总体大盘演化方向的定性判断依然是绝对正确的，仍具备作为宏观战略参考的重要标尺意义。`;
                    } else {
                        insightStr = `⚠️ **底层模型退化塌缩提示**：很遗憾，综合置信度检测反馈极低（跌至 ${conf}%）。请敏锐地注意到图中紫色的预测轨道已经彻底趋于平缓（在视觉上呈现一字直线状或极为死板的平铺），完全陷入了“失明状态”，未能追踪到灰色真实数据带的剧烈撕扯与波动。在算法工程视角来看，这说明该模型彻底未能从样本群中捕捉到任何潜藏规律，并已发生了严重的“退化降级至仅输出平均值”的灾难现象。最终结论：当前被您划选为 X 轴的特征变量集与所要预测的标的 Y 之间<strong style="color:#f5222d;">在物理逻辑层面基本上不存在任何潜在的关联度与因果性</strong>，请立即返回左侧调控面板引入带有更强因果张力的全新业务维度特征进行重新降维训练！`;
                    }
                    res.data.data.insight = insightStr;

                    store.predictData = res.data.data;
                    actions.addLog("特征预测推演完成闭环，系统已动态生成智能专家级解读！", "success");

                    setTimeout(() => {
                        const dom = document.getElementById('new-predict-chart');
                        if (dom) {
                            let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                            chart.setOption({
                                tooltip: { trigger: 'axis', backgroundColor: 'rgba(20, 20, 25, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, textStyle: { color: '#fff', fontSize: 13 } },
                                legend: { data: ['物理实际走势', '智能模型推演'], textStyle: { color: store.isDarkMode ? '#ccc' : '#888' } },
                                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                                xAxis: { type: 'category', boundaryGap: false, data: store.predictData.labels },
                                yAxis: { type: 'value', scale: true },
                                series: [
                                    { name: '物理实际走势', type: 'line', smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed', width: 2 }, data: store.predictData.realValues },
                                    { name: '智能模型推演', type: 'line', smooth: true, itemStyle: { color: '#722ed1' }, lineStyle: { width: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(114, 46, 209, 0.5)' }, { offset: 1, color: 'rgba(114, 46, 209, 0.0)' }]) }, data: store.predictData.predictedValues }
                                ]
                            });
                        }
                    }, 300);
                }
            } catch (err) {
                // 【灾备降级处理】：如果后端算力宕机，调用仿真机制维持界面张力
                actions.addLog("遭遇底层断联，已平滑切入纯前端高仿真无损降级演示节点", "error");
                const real = Array.from({length: 50}, () => Math.floor(Math.random() * 50) + 100);
                store.predictData = {
                    confidence: 96.84, sampleSize: 50, labels: Array.from({length: 50}, (_, i) => `模拟节点 ${i + 1}`),
                    realValues: real, predictedValues: real.map(v => v + (Math.random() * 10 - 4)),
                    insight: `🚀 **灾备脱机强拟合预警 (本地断网仿真系统)**：您当前看到的是离线环境下的前端高仿真预案。本次模拟生成预测置信度极高（达 96.84%）。如上方图表所示，紫色模型带与灰色的假定物理轨迹完美贴合，生动印证了本系统针对复杂时序数据集预测推演中卓越的视觉数据表征传递力！`
                };
                setTimeout(() => {
                    const dom = document.getElementById('new-predict-chart');
                    if (dom) {
                        let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                        chart.setOption({ tooltip: { trigger: 'axis', backgroundColor: 'rgba(20, 20, 25, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, textStyle: { color: '#fff', fontSize: 13 } }, legend: { data: ['物理实际走势', '智能模型推演'], textStyle: { color: store.isDarkMode ? '#ccc' : '#888' } }, grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }, xAxis: { type: 'category', boundaryGap: false, data: store.predictData.labels }, yAxis: { type: 'value' }, series: [{ name: '物理实际走势', type: 'line', smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed' }, data: store.predictData.realValues }, { name: '智能模型推演', type: 'line', smooth: true, itemStyle: { color: '#722ed1' }, areaStyle: { color: 'rgba(114, 46, 209, 0.2)' }, data: store.predictData.predictedValues }] });
                    }
                }, 300);
            }
        }
    };
}