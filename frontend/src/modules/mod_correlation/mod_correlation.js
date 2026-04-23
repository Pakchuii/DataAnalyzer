import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupCorrelation(store, actions) {
    return {
        // 调度模块三：高级线性关联矩阵解析
        async runAdvancedAnalysis() {
            if (store.showAdvanced) { store.showAdvanced = false; return; }
            if (store.selectedVars.length < 2) return actions.openAlert('提示', '构建协方差矩阵至少需要勾选 2 个维度变量！');
            
            // 极速模式：如果数据已经缓存，直接开启并重绘，不再重复调用 API
            if (store.advancedResult && store.advancedResult.variables.length === store.selectedVars.length && store.selectedVars.every(v => store.advancedResult.variables.includes(v))) {
                store.showAdvanced = true;
                actions.addLog("检测到已存在关联结果，为您直接开启视图...", "success");
                setTimeout(() => { actions.renderAdvancedCharts(); }, 150);
                return;
            }

            actions.addLog("正在执行高级关联深度运算...");
            try {
                const res = await api.post('/api/analyze/advanced', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.advancedResult = res.data.data;
                    store.showAdvanced = true;
                    actions.addLog("关联映射计算完成，正准备渲染层！", "success");
                    setTimeout(() => { actions.renderAdvancedCharts(); }, 300);
                }
            } catch (err) { actions.addLog(`❌ 关联分析失败: ${err.message}`, "error"); }
        },

        renderAdvancedCharts(heatEl = null, scatEl = null) {
            const data = store.advancedResult;
            if (!data) return;

            // 统一的赛博黑玻璃 Tooltip 悬浮样式组件库
            const glassTooltip = {
                trigger: 'item',
                backgroundColor: 'rgba(20, 20, 25, 0.85)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 13 },
                backdropFilter: 'blur(calc(var(--glass-blur) * 0.3))'
            };

            const heatDom = heatEl || document.getElementById('heatmap-container');
            if (heatDom && data.correlation_matrix.length > 0) {
                let chart = echarts.getInstanceByDom(heatDom);
                if (chart) chart.dispose(); 
                chart = echarts.init(heatDom);
                chart.setOption({
                    title: { text: '多维相关性热力图', left: 'center' },
                    tooltip: { position: 'top', ...glassTooltip, formatter: (p) => `${data.variables[p.value[0]]} 关联度 ${data.variables[p.value[1]]}: 核心值为 ${p.value[2]}` },
                    grid: { height: '60%', top: '15%' },
                    xAxis: { type: 'category', data: data.variables, axisLabel: { rotate: 30 } },
                    yAxis: { type: 'category', data: data.variables },
                    visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } },
                    series: [{ type: 'heatmap', data: data.correlation_matrix, label: { show: true } }]
                });
            }

            const scatDom = scatEl || document.getElementById('scatter-container');
            if (scatDom && data.scatter_data.length > 0) {
                let chart = echarts.getInstanceByDom(scatDom);
                if (chart) chart.dispose();
                chart = echarts.init(scatDom);
                chart.setOption({
                    title: { text: `离散特征散点图`, left: 'center' },
                    xAxis: { name: data.scatter_vars[0], type: 'value', scale: true },
                    yAxis: { name: data.scatter_vars[1], type: 'value', scale: true },
                    tooltip: { ...glassTooltip, trigger: 'item' },
                    series: [{ symbolSize: 12, data: data.scatter_data, type: 'scatter', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#b37feb' }, { offset: 1, color: '#722ed1' }]) } }]
                });
            }
        }
    };
}
