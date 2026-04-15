import api from '@/core/api.js'

export function setupTTest(store, actions) {
    return {
        // 调度模块二：独立样本推断性假说检验
        async runTTest() {
            if (store.showTTest) { store.showTTest = false; return; }
            if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少执行方差分析的必要结构变量！请同时勾选数值变量并选择分组变量。' });
            actions.addLog(`正在执行独立样本 t 检验核心推断...`);
            try {
                const res = await api.post('/api/analyze/ttest', {
                    filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.ttestResult = res.data.data;
                    store.showTTest = true;
                    actions.addLog("t 检验矩阵判定完成！", "success");
                } else {
                    actions.openAlert('分析逻辑崩溃', res.data.message);
                }
            } catch (err) { actions.addLog(`❌ t 检验失败: ${err.message}`, "error"); }
        }
    };
}
