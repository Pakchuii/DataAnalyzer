import api from '@/core/api.js'

export function setupSummary(store, actions) {
    return {
        async runAiSummary() {
            if (store.showAiSummary) { store.showAiSummary = false; return; }
            if (!store.fileInfo) return;
            actions.addLog("正在启动 AI 数据解读引擎...", "info");
            try {
                const res = await api.post('/api/analyze/summary', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.aiSummaryText = res.data.data;
                    store.showAiSummary = true;
                    actions.addLog("✅ AI 解读报告生成完成", "success");
                }
            } catch (err) { actions.addLog(`❌ AI 解读失败: ${err.message}`, "error"); }
        }
    };
}
