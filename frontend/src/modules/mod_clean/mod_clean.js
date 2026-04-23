import api from '@/core/api.js'

export function setupClean(store, actions) {
    return {
        // 【升级】：点击清洗按钮 → 先执行只读诊断扫描
        async triggerDataCleaning() {
            if (!store.fileInfo) return;
            actions.addLog("正在执行数据质量诊断扫描...");
            try {
                const res = await api.post('/api/clean/diagnose', { filename: store.fileInfo.filename });
                if (res.data.status === 'success') {
                    const result = res.data.data;
                    if (result.total_missing === 0 && result.total_outliers === 0) {
                        // 数据完全干净，直接标记为已清洗（透传），解锁后续分析模块
                        store.cleanResult = {
                            ...result,
                            cleaned_filename: store.fileInfo.filename,
                            cleaning_methods: {}
                        };
                        actions.openAlert(
                            '🎉 数据质量极佳',
                            '系统地毯式扫描后，未在数值特征中检测到缺失项或极端异常值。\n您的数据集非常健康，已直接解锁全部分析功能！'
                        );
                        actions.addLog("诊断完成：数据质量极佳，已直接解锁分析模块。", "success");
                    } else {
                        // 有问题 → 弹出诊断确认弹窗
                        store.cleanDiagnoseResult = result;
                        store.showCleanDiagnoseModal = true;
                        actions.addLog(`诊断完成：发现 ${result.total_missing} 处缺失值、${result.total_outliers} 处异常值。等待用户确认策略...`, "info");
                    }
                }
            } catch (err) {
                actions.addLog(`诊断失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        // 【正式执行】：根据用户选定的策略执行清洗
        async executeCleanWithStrategy(missingStrategy, outlierStrategy) {
            if (!store.fileInfo) return;
            store.showCleanDiagnoseModal = false;
            actions.addLog(`正在执行清洗（缺失值策略: ${missingStrategy}, 异常值策略: ${outlierStrategy}）...`);
            try {
                const res = await api.post('/api/clean', {
                    filename: store.fileInfo.filename,
                    missing_strategy: missingStrategy,
                    outlier_strategy: outlierStrategy
                });
                if (res.data.status === 'success') {
                    store.cleanResult = res.data.data;
                    store.currentDataFile = res.data.data.cleaned_filename;
                    store.showPreview = false;

                    // 提取后端传回的智能算法分配名单
                    const { cleaning_methods, total_outliers, applied_missing_strategy } = res.data.data;
                    const strategyNames = {
                        mean: '均值填充', median: '中位数填充',
                        zero: '零值填充', drop: '删除记录', none: '保留原样'
                    };
                    let methodText = `缺失值策略: ${strategyNames[applied_missing_strategy] || applied_missing_strategy}\n`;
                    methodText += `共探测并修复了 ${total_outliers} 个极值异常。\n\n[系统探针已动态分配清洗引擎]:\n`;
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

                    actions.addLog(`清洗完成！`, "success");
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
