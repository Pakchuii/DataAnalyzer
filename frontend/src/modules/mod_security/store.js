import api from '@/core/api.js'

export function setupSecurity(store, actions) {
    return {
        async triggerMasking() {
            if (!store.fileInfo) return;
            store.preMaskedFile = store.currentDataFile;
            actions.addLog("正在启动 PII 隐私脱敏探针...", "info");
            try {
                const res = await api.post('/api/mask', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.currentDataFile = res.data.data.masked_filename;
                    store.isMasked = true;
                    actions.addLog(`✅ 脱敏完成，影响列: ${res.data.data.masked_cols.join(', ')}`, "success");
                }
            } catch (err) { actions.addLog(`❌ 脱敏失败: ${err.message}`, "error"); }
        },
        undoMasking() {
            if (store.preMaskedFile) {
                store.currentDataFile = store.preMaskedFile;
                store.isMasked = false;
                actions.addLog("🔓 已解除隐私脱敏", "info");
            }
        }
    };
}
