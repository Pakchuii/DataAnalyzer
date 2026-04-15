import api from '@/core/api.js'

export function setupStats(store, actions) {
    return {
        // 调度模块一：描述性宏观统计
        async runDescriptiveStats() {
            if (store.showStats) { store.showStats = false; return; }
            if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选需要进行基础统计的数值变量！' });
            actions.addLog("正在向分析中台投递描述性统计计算指令...");
            try {
                const res = await api.post('/api/analyze/descriptive', {
                    filename: store.currentDataFile, columns: store.selectedVars
                });
                if (res.data.status === 'success') {
                    store.statsResult = res.data.data;
                    store.showStats = true;
                    actions.addLog("基础描述统计测度计算完成！", "success");
                }
            } catch (err) { actions.addLog(`❌ 统计失败: ${err.message}`, "error"); }
        }
    };
}
