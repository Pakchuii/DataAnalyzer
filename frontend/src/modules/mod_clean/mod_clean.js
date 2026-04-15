import api from '@/core/api.js'

export function setupClean(store, actions) {
    return {
        // 【自动化特征工程】：清洗与噪声排除机制 (接入了智能算法展示)
        async triggerDataCleaning() {
            if (!store.fileInfo) return;
            actions.addLog("正在执行全自动数据清洗...");
            try {
                const res = await api.post('/api/clean', { filename: store.fileInfo.filename });
                if (res.data.status === 'success') {
                    store.cleanResult = res.data.data;
                    store.currentDataFile = res.data.data.cleaned_filename;
                    store.showPreview = false;

                    // 🚀 核心升级：提取后端传回的智能算法分配名单
                    const { cleaning_methods, total_outliers } = res.data.data;
                    let methodText = `共探测并修复了 ${total_outliers} 个极值异常。\n\n[系统探针已动态分配清洗引擎]:\n`;
                    for (const [col, method] of Object.entries(cleaning_methods)) {
                        methodText += `• ${col} ➔ ${method}\n`;
                    }

                    actions.openAlert(
                        '✨ 智能清洗管道执行完毕',
                        methodText,
                        () => {
                            store.showCleanReportModal = true;
                        }
                    );

                    actions.addLog(`清洗完成！已触发自适应算法处理缺失值与异常值。`, "success");
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            } catch (err) {
                actions.addLog(`清洗失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        // 【应用方案】：正式挂载清洗后的数据集
        applyDataCleaning() {
            if (!store.cleanResult) return;
            actions.addLog("清洗方案已正式应用至当前工作流。", "success");
            // 已在 trigger 时设置了 currentDataFile，此处主要是逻辑闭环
        },

        // 【撤回方案】：物理回滚至原始数据集
        restoreData() {
            if (!store.fileInfo) return;
            store.currentDataFile = store.fileInfo.filename;
            store.cleanResult = null;
            actions.addLog("已撤回清洗操作，数据集已回滚至原始状态。", "info");
        }
    };
}
