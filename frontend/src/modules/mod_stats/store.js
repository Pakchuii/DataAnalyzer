import api from '@/core/api.js'

export function setupStats(store, actions) {
    return {
        async runDescriptiveStats() {
            if (store.showStats) { store.showStats = false; return; }
            if (!store.fileInfo || store.selectedVars.length === 0) return;
            actions.addLog("正在对选中变量执行描述性统计...", "info");
            try {
                const res = await api.post('/api/analyze/descriptive', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.statsResult = res.data.data;
                    store.showStats = true;
                    actions.addLog("✅ 描述统计完成", "success");
                }
            } catch (err) { actions.addLog(`❌ 统计失败: ${err.message}`, "error"); }
        }
    };
}
