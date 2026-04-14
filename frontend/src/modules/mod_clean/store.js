import api from '@/core/api.js'

export function setupClean(store, actions) {
    return {
        async triggerDataCleaning() {
            if (!store.fileInfo) return;
            actions.addLog("正在启动三阶清洗引擎，依次运行 Dixon/3σ/IQR...", "info");
            try {
                const res = await api.post('/api/clean', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.cleanResult = res.data.data;
                    store.currentDataFile = res.data.data.cleaned_filename;
                    store.showCleanReportModal = true;
                    actions.addLog("✅ 清洗完成", "success");
                }
            } catch (err) { actions.addLog(`❌ 清洗失败: ${err.message}`, "error"); }
        }
    };
}
