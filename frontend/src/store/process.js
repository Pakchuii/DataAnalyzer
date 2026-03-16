import axios from 'axios'

export function setupProcess(store, actions) {
    return {
        // 【按需加载 (Lazy Loading)】：数据快照降级预览，减轻前端 DOM 渲染压力
        async togglePreview() {
            if (store.showPreview) { store.showPreview = false; return; }
            actions.addLog("正在拉取数据预览...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/preview', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.previewData = res.data.data;
                    store.showPreview = true;
                    actions.addLog("预览数据加载完毕");
                }
            } catch (err) {
                actions.addLog(`预览失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        // 【自动化特征工程】：清洗与噪声排除机制 (接入了智能算法展示)
        async triggerDataCleaning() {
            actions.addLog("正在执行全自动数据清洗...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename });
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

                    actions.showDialog({
                        type: 'info',
                        title: '✨ 智能清洗管道执行完毕',
                        message: methodText,
                        onConfirm: () => {
                            store.showCleanReportModal = true;
                        }
                    });

                    actions.addLog(`清洗完成！已触发自适应算法处理缺失值与异常值。`, "success");
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            } catch (err) {
                actions.addLog(`清洗失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        async triggerStandardization() {
            actions.addLog("正在执行 Z-score 标准化...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/standardize', { filename: store.currentDataFile });
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
                onConfirm: () => { store.currentDataFile = store.cleanResult ? store.cleanResult.cleaned_filename : store.fileInfo.filename; store.isStandardized = false; actions.addLog("已撤销标准化"); }
            });
        },

        async triggerMasking() {
            if (store.isMasked) return;
            actions.addLog("启动安全协议：正在进行数据脱敏...");
            store.preMaskedFile = store.currentDataFile;
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/mask', { filename: store.currentDataFile });
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
            actions.showDialog({
                type: 'confirm', title: '🔓 解除脱敏协议', message: '确定要解除数据脱敏吗？',
                onConfirm: () => {
                    store.currentDataFile = store.preMaskedFile;
                    store.isMasked = false;
                    actions.addLog("🔓 已解除脱敏", "info");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            });
        }
    };
}