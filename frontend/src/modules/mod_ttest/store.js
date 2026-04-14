import api from '@/core/api.js'

export function setupTTest(store, actions) {
    return {
        async runTTest() {
            if (store.showTTest) { store.showTTest = false; return; }
            if (!store.fileInfo || !store.selectedGroupVar) return;
            actions.addLog(`正在执行 t 检验 (分组: ${store.selectedGroupVar})...`, "info");
            try {
                const res = await api.post('/api/analyze/ttest', {
                    filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.ttestResult = res.data.data;
                    store.showTTest = true;
                    actions.addLog("✅ t 检验完成", "success");
                }
            } catch (err) { actions.addLog(`❌ t 检验失败: ${err.message}`, "error"); }
        }
    };
}
