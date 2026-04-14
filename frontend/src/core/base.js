/**
 * 【核心模块：系统全局状态生命周期总线】
 * 负责跨域组件通信日志队列、UI 主题物理探针等底层核心调度工作。
 */
export function setupBase(store, actions) {
    return {
        addLog(msg, type = 'info') {
            const time = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌ [致命错误 ERROR]' : type === 'success' ? '✅ [状态达成 SUCCESS]' : '⚡ [底层系统 SYSTEM]';
            store.logs.push(`[${time}] ${prefix} ${msg}`);
            if (store.logs.length > 50) store.logs.shift();
        },

        initTheme() {
            const hour = new Date().getHours();
            if (hour >= 18 || hour < 6) {
                store.isDarkMode = true; document.body.classList.add('dark-mode'); actions.addLog("视觉神经检测到夜间环境，已自动装载【护眼夜间深色模式】", "info");
            } else {
                store.isDarkMode = false; document.body.classList.remove('dark-mode'); actions.addLog("视觉神经检测到光照增强，已自动挂载【高对比度白天模式】", "info");
            }
        },

        showDialog(options) {
            store.dialog.title = options.title || '系统拦截提示';
            store.dialog.message = options.message || '空指令';
            store.dialog.type = options.type || 'alert';
            store.dialog.onConfirm = () => { if (options.onConfirm) options.onConfirm(); store.dialog.show = false; };
            store.dialog.show = true;
        },

        confirmExitToMainMenu() {
            actions.resetSystemState();
            store.showExitConfirm = false;
            store.currentModule = 'portal';
            actions.addLog("已强制卸载当前活动工作区，平滑返回系统枢纽空间", "info");
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
