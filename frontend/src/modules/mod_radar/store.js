import api from '@/core/api.js'
import * as echarts from 'echarts'

export function setupRadar(store, actions) {
    return {
        async fetchRadarOptions() {
            if (!store.radarIdCol) return;
            try {
                const res = await api.post('/api/get_options', {
                    filename: store.currentDataFile, column: store.radarIdCol
                });
                if (res.data.status === 'success') {
                    store.radarOptions = res.data.data;
                    store.selectedRadarTarget = '';
                }
            } catch (err) { actions.addLog(`❌ 获取雷达选项失败: ${err.message}`, "error"); }
        },

        async runRadarChart() {
            if (store.showRadar) { store.showRadar = false; return; }
            if (!store.selectedRadarTarget) return;
            actions.addLog("正在构建多维雷达定位图...", "info");
            try {
                const res = await api.post('/api/visualize/radar', {
                    filename: store.currentDataFile, id_col: store.radarIdCol, target_val: store.selectedRadarTarget
                });
                if (res.data.status === 'success') {
                    store.radarResult = res.data.data;
                    store.showRadar = true;
                    setTimeout(() => { actions.renderRadarChart(); }, 200);
                    actions.addLog("✅ 雷达图生成成功", "success");
                }
            } catch (err) { actions.addLog(`❌ 雷达图生成失败: ${err.message}`, "error"); }
        },

        renderRadarChart() {
            const dom = document.getElementById('radar-container');
            if (!dom || !store.radarResult) return;
            const chart = echarts.init(dom);
            chart.setOption({
                legend: { data: [store.radarResult.target_name, '群体均值'], bottom: 10 },
                radar: { indicator: store.radarResult.indicators, radius: '65%', splitArea: { areaStyle: { color: ['rgba(114, 46, 209, 0.02)', 'rgba(114, 46, 209, 0.05)'] } } },
                series: [{ type: 'radar', data: [
                    { value: store.radarResult.target_data, name: store.radarResult.target_name, areaStyle: { color: 'rgba(230, 162, 60, 0.3)' }, lineStyle: { color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } },
                    { value: store.radarResult.avg_data, name: '群体均值', areaStyle: { color: 'rgba(64, 158, 255, 0.15)' }, lineStyle: { color: '#409eff', type: 'dashed' }, itemStyle: { color: '#409eff' } }
                ]}]
            });
        }
    };
}
