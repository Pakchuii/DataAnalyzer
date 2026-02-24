export function setupBase(store, actions) {
    return {
        addLog(msg, type = 'info') {
            const time = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌ [ERROR]' : type === 'success' ? '✅ [SUCCESS]' : '⚡ [SYSTEM]';
            store.logs.push(`[${time}] ${prefix} ${msg}`);
            if (store.logs.length > 50) store.logs.shift();
        },
        initTheme() {
            const hour = new Date().getHours();
            if (hour >= 18 || hour < 6) {
                store.isDarkMode = true; document.body.classList.add('dark-mode'); actions.addLog("已自动切换至【夜间模式】", "info");
            } else {
                store.isDarkMode = false; document.body.classList.remove('dark-mode'); actions.addLog("已自动切换至【白天模式】", "info");
            }
        },
        showDialog(options) {
            store.dialog.title = options.title || '提示';
            store.dialog.message = options.message || '';
            store.dialog.type = options.type || 'alert';
            store.dialog.onConfirm = () => { if (options.onConfirm) options.onConfirm(); store.dialog.show = false; };
            store.dialog.show = true;
        },
        confirmExitToMainMenu() {
            actions.resetSystemState();
            store.showExitConfirm = false;
            store.currentModule = 'portal'; // 退回到模块选择枢纽
            actions.addLog("已安全退出当前工作区，返回系统枢纽", "info");
        },
        resetSystemState() {
            store.fileInfo = null; store.cleanResult = null; store.statsResult = null;
            store.chartsData = []; store.advancedResult = null; store.isStandardized = false;
            store.ttestResult = null; store.selectedGroupVar = ''; store.previewData = null;
            store.showPreview = false; store.showStats = false; store.showCharts = false;
            store.showAdvanced = false; store.showTTest = false; store.showVisControl = false;
            store.showAiSummary = false; store.aiSummaryText = []; store.showRadar = false;
            store.radarIdCol = ''; store.radarOptions = []; store.selectedRadarTarget = '';
            store.radarResult = null; store.isMasked = false; store.mlTargetVar = '';
            store.mlFeatureVars = []; store.mlResult = null; store.showML = false;
            store.showCleanReportModal = false;
        }
    };
}