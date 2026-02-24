import axios from 'axios'

export function setupProcess(store, actions) {
    return {
        async togglePreview() {
            if (store.showPreview) { store.showPreview = false; return; }
            actions.addLog("正在拉取数据预览...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/preview', { filename: store.currentDataFile });
                if (res.data.status === 'success') { store.previewData = res.data.data; store.showPreview = true; actions.addLog("预览数据加载完毕"); }
            } catch (err) {
                // 【探照灯】：捕获后端的具体报错，显示在面板里
                actions.addLog(`预览失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },
        async triggerDataCleaning() {
            actions.addLog("正在执行全自动数据清洗...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename });
                if (res.data.status === 'success') {
                    store.cleanResult = res.data.data;
                    store.currentDataFile = res.data.data.cleaned_filename;
                    store.showPreview = false;

                    // 🚀 核心新增：打开清洗战报大弹窗！
                    store.showCleanReportModal = true;

                    actions.addLog(`清洗完成: 生成新文件 ${store.currentDataFile}`, "success");
                }
            } catch (err) {
                actions.addLog(`清洗执行失败: ${err.response?.data?.message || err.message}`, "error");
            }
        },
        async triggerStandardization() {
            actions.showDialog({
                type: 'confirm', title: '⚙️ 确认标准化', message: '确定要执行 Z-score 吗？',
                onConfirm: async () => {
                    actions.addLog("开始执行 Z-score 标准化计算...");
                    try {
                        const res = await axios.post('http://127.0.0.1:5000/api/standardize', { filename: store.cleanResult.cleaned_filename });
                        if (res.data.status === 'success') {
                            store.currentDataFile = res.data.data.std_filename;
                            store.isStandardized = true;
                            store.showPreview = false;
                            actions.addLog("标准化完成！", "success");
                        }
                    } catch (err) {
                        actions.addLog(`标准化失败: ${err.response?.data?.message || err.message}`, "error");
                    }
                }
            });
        },
        undoStandardization() {
            actions.showDialog({
                type: 'confirm', title: '↩️ 撤回标准化', message: '确定要撤回吗？',
                onConfirm: () => { store.currentDataFile = store.cleanResult.cleaned_filename; store.isStandardized = false; store.showStats = false; store.showCharts = false; store.showAdvanced = false; store.showTTest = false; actions.addLog("已撤销标准化"); }
            });
        },
        async triggerMasking() {
            if (store.isMasked) return;
            actions.addLog("启动安全协议：正在进行数据脱敏...");
            store.preMaskedFile = store.currentDataFile;
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/mask', { filename: store.currentDataFile });
                if (res.data.status === 'success') {
                    store.currentDataFile = res.data.data.masked_filename; store.isMasked = true;
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
                    store.currentDataFile = store.preMaskedFile; store.isMasked = false; actions.addLog("🔓 已解除脱敏", "info");
                    if (store.showPreview) { store.showPreview = false; setTimeout(() => actions.togglePreview(), 200); }
                    if (store.radarIdCol) { actions.fetchRadarOptions(); }
                }
            });
        }
    };
}