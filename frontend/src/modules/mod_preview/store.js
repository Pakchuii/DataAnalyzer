import api from '@/core/api.js'

export function setupProcess(store, actions) {
    return {
        async togglePreview() {
            if (store.showPreview) { store.showPreview = false; return; }
            if (!store.fileInfo) return;
            actions.addLog("正在拉取数据预览切片...", "info");
            try {
                const res = await api.post('/api/preview', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.previewData = res.data.data;
                    store.showPreview = true;
                    actions.addLog("✅ 数据预览已就绪", "success");
                }
            } catch (err) { actions.addLog(`❌ 预览失败: ${err.message}`, "error"); }
        }
    };
}
