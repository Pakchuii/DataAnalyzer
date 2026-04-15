import api from '@/core/api.js'

export function setupSecurity(store, actions) {
    return {
        async triggerMasking() {
            if (!store.fileInfo) return;
            if (store.isMasked) return;
            actions.addLog("启动安全协议：正在进行数据脱敏...");
            store.preMaskedFile = store.currentDataFile;
            try {
                const res = await api.post('/api/mask', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.currentDataFile = res.data.data.masked_filename;
                    store.isMasked = true;
                    actions.addLog(`🔒 脱敏完成！`, "success");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            } catch (err) {
                actions.addLog(`脱敏失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        undoMasking() {
            actions.openConfirm(
                '🔓 解除脱敏协议',
                '确定要解除数据脱敏吗？',
                () => {
                    store.currentDataFile = store.preMaskedFile;
                    store.isMasked = false;
                    actions.addLog("🔓 已解除脱敏", "info");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            );
        }
    };
}
