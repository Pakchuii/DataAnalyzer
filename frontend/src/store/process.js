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
                // 【探照灯错误捕获】：将后端具体报错暴露在面板日志中
                actions.addLog(`预览失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        // 【自动化特征工程】：清洗与噪声排除机制
        async triggerDataCleaning() {
            actions.addLog("正在执行全自动数据清洗...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename });
                if (res.data.status === 'success') {
                    store.cleanResult = res.data.data;
                    store.currentDataFile = res.data.data.cleaned_filename;
                    store.showPreview = false;

                    // 🚀 核心状态更新：打开清洗战报大弹窗
                    store.showCleanReportModal = true;
                    actions.addLog(`清洗完成！已处理缺失值与异常值，并生成独立快照文件。`, "success");

                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            } catch (err) {
                actions.addLog(`清洗失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },

        // 【数据标准化】：Z-Score 特征缩放算法调用
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

        // 状态撤回机制：取消标准化
        undoStandardization() {
            actions.showDialog({
                type: 'confirm', title: '↩️ 撤销操作', message: '确定要撤销标准化并恢复原始数据吗？',
                onConfirm: () => { store.currentDataFile = store.cleanResult ? store.cleanResult.cleaned_filename : store.fileInfo.filename; store.isStandardized = false; actions.addLog("已撤销标准化"); }
            });
        },

        // 【数据合规与隐私保护】：调用不可逆脱敏算法
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

        // 权限管理：解除脱敏
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