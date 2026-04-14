import api from '@/core/api.js'

export function setupStandardize(store, actions) {
    return {
        async triggerStandardization() {
            if (!store.fileInfo) return;
            store.preMaskedFile = store.currentDataFile;
            actions.addLog("正在进行 Z-Score 标准化...", "info");
            try {
                const res = await api.post('/api/standardize', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.currentDataFile = res.data.data.standardized_filename;
                    store.isStandardized = true;
                    actions.addLog("✅ Z-Score 标准化完成", "success");
                } else {
                    actions.addLog(`❌ 标准化失败: ${res.data.message}`, "error");
                }
            } catch (err) { actions.addLog(`❌ 标准化异常: ${err.message}`, "error"); }
        },
        undoStandardization() {
            if (store.preMaskedFile) {
                store.currentDataFile = store.preMaskedFile;
                store.isStandardized = false;
                actions.addLog("↩️ 已撤回标准化操作", "info");
            }
        }
    };
}
