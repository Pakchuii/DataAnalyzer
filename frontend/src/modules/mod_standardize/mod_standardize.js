import api from '@/core/api.js'

export function setupStandardize(store, actions) {
    return {
        async triggerStandardization() {
            if (!store.fileInfo) return;
            actions.addLog("正在执行 Z-score 标准化...");
            try {
                const res = await api.post('/api/standardize', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.currentDataFile = res.data.data.standardized_filename;
                    store.isStandardized = true;
                    actions.addLog("标准化处理完毕，数据已中心化。", "success");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                }
            } catch (err) {
                actions.addLog(`标准化失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        undoStandardization() {
            actions.showDialog({
                type: 'confirm', title: '↩️ 撤销操作', message: '确定要撤销标准化并恢复原始数据吗？',
                onConfirm: () => {
                    store.currentDataFile = store.cleanResult ? store.cleanResult.cleaned_filename : store.fileInfo.filename;
                    store.isStandardized = false;
                    actions.addLog("已撤销标准化");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                }
            });
        }
    };
}
