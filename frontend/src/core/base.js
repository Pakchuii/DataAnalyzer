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

        openAlert(title, message) {
            store.dialog.show = false;
            setTimeout(() => {
                store.dialog = { ...store.dialog, show: true, type: 'alert', title, message, onConfirm: () => { store.dialog.show = false; } };
            }, 50);
        },

        openConfirm(title, message, onConfirm) {
            store.dialog.show = false;
            setTimeout(() => {
                store.dialog = { ...store.dialog, show: true, type: 'confirm', title, message, onConfirm: () => { store.dialog.show = false; if (onConfirm) onConfirm(); } };
            }, 50);
        },

        openPrompt(title, message, placeholder, onConfirm) {
            store.dialog.show = false;
            setTimeout(() => {
                store.dialog = { ...store.dialog, show: true, type: 'prompt', title, message, placeholder, inputValue: '', onConfirm: () => {
                    const val = store.dialog.inputValue ? store.dialog.inputValue.trim() : '';
                    const actualVal = val || (placeholder ? placeholder.replace('例如：', '').trim() : '');
                    store.dialog.show = false;
                    if (onConfirm && actualVal) onConfirm(actualVal);
                }};
            }, 50);
        },

        openChoice(title, message, btn1Text, btn2Text, cb1, cb2, cbCancel = null) {
            store.dialog.show = false;
            setTimeout(() => {
                store.dialog = {
                    ...store.dialog, show: true, type: 'choice', title, message, btn1Text, btn2Text,
                    cb1: () => { store.dialog.show = false; if (cb1) setTimeout(cb1, 50); },
                    cb2: () => { store.dialog.show = false; if (cb2) setTimeout(cb2, 50); },
                    cbCancel: () => { store.dialog.show = false; if (cbCancel) setTimeout(cbCancel, 50); }
                };
            }, 50);
        },

        requestExitToPortal() {
            if (actions.checkHasActiveData()) {
                actions.openChoice(
                    "🚨 确认要返回枢纽吗？",
                    "当前计算的所有临时缓存和分析结果将被永久释放，该操作不可撤销。<br><br>确认要清空内存并返回吗？",
                    "确认卸载空间",
                    "留在当前模块",
                    () => {
                        actions.resetSystemState();
                        store.currentModule = 'portal';
                        actions.addLog("已强制终止所有计算进程并抹除内存记录，安全返回枢纽空间。", "success");
                    },
                    () => {} // 取消则停留在原地
                );
            } else {
                store.currentModule = 'portal';
                actions.addLog("安全退出至时空枢纽。", "info");
            }
        },

        checkHasActiveData() {
            // 综合研判：任何非空的状态均视为活跃数据
            return (
                store.previewData || 
                store.uploadedFileName || 
                store.mlResult || 
                store.statsResult || 
                store.ttestResult || 
                store.advancedResult || 
                (store.manualGrid && store.manualGrid.length > 0) ||
                store.radarResult ||
                store.showTemplatePanel
            );
        },

        requestSystemSwitch(targetModule) {
            if (store.currentModule === targetModule) {
                store.showSystemShelf = false;
                return;
            }

            if (actions.checkHasActiveData()) {
                actions.openChoice(
                    "🚨 跨系统切换警告",
                    `您当前正处于 <b>${store.currentModule === 'analysis' ? '智能分析中台' : store.currentModule === 'management' ? '数据管理引擎' : '业务积木场'}</b>。<br><br>切换系统将触发核心重置，<span style="color:#f5222d; font-weight:bold;">所有未保存的数据和分析结果将被物理清空</span>。<br><br>确认要继续吗？`,
                    "确认清空并切换",
                    "取消操作",
                    () => {
                        actions.resetSystemState();
                        store.currentModule = targetModule;
                        store.showSystemShelf = false;
                        actions.addLog(`系统内核已重置，已切换至：${targetModule}`, "info");
                    },
                    () => { store.showSystemShelf = false; }
                );
            } else {
                store.currentModule = targetModule;
                store.showSystemShelf = false;
                actions.addLog(`跳跃切换至模块：${targetModule}`, "info");
            }
        },

        resetSystemState() {
            // 物理层级的数据清除，确保不留任何余温
            store.fileInfo = null; 
            store.currentDataFile = '';
            store.uploadedFileName = '';
            store.previewData = null;
            
            store.cleanResult = null; 
            store.isStandardized = false;
            store.statsResult = null;
            store.ttestResult = null;
            store.selectedGroupVar = ''; 
            store.selectedVars = [];
            
            store.chartsData = []; 
            store.visActiveVars = [];
            store.advancedResult = null;
            
            store.manualGrid = [];
            store.aiSummaryText = [];
            
            store.radarIdCol = ''; 
            store.radarOptions = []; 
            store.selectedRadarTarget = '';
            store.radarResult = null;
            
            store.isMasked = false;
            store.preMaskedFile = '';
            
            store.mlTargetVar = '';
            store.mlFeatureVars = []; 
            store.mlResult = null; 
            store.predictData = null;
            
            // 关闭所有浮层面板
            store.showPreview = false; 
            store.showStats = false; 
            store.showCharts = false;
            store.showAdvanced = false; 
            store.showTTest = false; 
            store.showVisControl = false;
            store.showAiSummary = false; 
            store.showRadar = false;
            store.showML = false;
            store.showCleanReportModal = false;
            store.showManualModal = false;
            store.showUploadModal = false;
            
            // 历史堆栈在组件内部，无需此处处理（切换系统会销毁组件或通过 watcher 清理）
        }
    };
}
