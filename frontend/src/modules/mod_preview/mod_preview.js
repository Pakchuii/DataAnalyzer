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
        },

        async fetchPreviewStats() {
            if (!store.fileInfo) return;
            actions.addLog("正在拉取全量字段统计概览...", "info");
            try {
                const res = await api.post('/api/preview/statistics', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.previewStatsData = res.data.data;
                    actions.addLog("✅ 字段统计概览已就绪", "success");
                }
            } catch (err) { actions.addLog(`❌ 统计概览拉取失败: ${err.message}`, "error"); }
        }
    };
}
