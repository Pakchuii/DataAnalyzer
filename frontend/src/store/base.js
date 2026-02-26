/**
 * 【架构设计：系统全局状态生命周期总线 (Global Lifecycle Bus)】
 * 负责跨域组件通信日志队列、UI 主题物理探针等底层核心调度工作。
 */
export function setupBase(store, actions) {
    return {
        // 【可观测性追踪模块】：系统控制台日志写入管道，限制缓存队列防止 OOM
        addLog(msg, type = 'info') {
            const time = new Date().toLocaleTimeString();
            const prefix = type === 'error' ? '❌ [致命错误 ERROR]' : type === 'success' ? '✅ [状态达成 SUCCESS]' : '⚡ [底层系统 SYSTEM]';
            store.logs.push(`[${time}] ${prefix} ${msg}`);
            if (store.logs.length > 50) store.logs.shift();
        },

        // 【UI 引擎自动适配模块】：根据本地设备时区触发暗黑/白日主题劫持
        initTheme() {
            const hour = new Date().getHours();
            if (hour >= 18 || hour < 6) {
                store.isDarkMode = true; document.body.classList.add('dark-mode'); actions.addLog("视觉神经检测到夜间环境，已自动装载【护眼夜间深色模式】", "info");
            } else {
                store.isDarkMode = false; document.body.classList.remove('dark-mode'); actions.addLog("视觉神经检测到光照增强，已自动挂载【高对比度白天模式】", "info");
            }
        },

        // 【解耦分发器】：全站通用确认拦截框挂载中心
        showDialog(options) {
            store.dialog.title = options.title || '系统拦截提示';
            store.dialog.message = options.message || '空指令';
            store.dialog.type = options.type || 'alert';
            store.dialog.onConfirm = () => { if (options.onConfirm) options.onConfirm(); store.dialog.show = false; };
            store.dialog.show = true;
        },

        // 【路由降级处理】：核心系统退出并触发资源回收
        confirmExitToMainMenu() {
            actions.resetSystemState();
            store.showExitConfirm = false;
            store.currentModule = 'portal'; // 控制路由指针退回模块选取大厅
            actions.addLog("已强制卸载当前活动工作区，平滑返回系统枢纽空间", "info");
        },

        // 【内存隔离墙】：一键销毁 Vue 全局响应式对象的内存驻留，彻底防止脏数据跨场景污染
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