// frontend/src/store.js
import { reactive } from 'vue'

// ==========================================
// 全局状态管理 (Store) - 变量原封不动！
// ==========================================
export const store = reactive({
    isEntered: false, currentModule: 'portal',isDarkMode: false,
    showUploadModal: false, uploadedFileName: '', isDragging: false,
    fileInfo: null, currentDataFile: '', selectedGroupVar: '', selectedVars: [],
    showPreview: false, showStats: false, showCharts: false, showAdvanced: false,
    showTTest: false, showVisControl: false, cleanResult: null, isStandardized: false,
    previewData: null, statsResult: null, ttestResult: null, chartsData: [],
    visActiveVars: [], advancedResult: null,
    dialog: { show: false, title: '', message: '', type: 'alert', onConfirm: null },
    showManualModal: false, manualGrid: [],
    showAiSummary: false, aiSummaryText: [], showRadar: false, radarIdCol: '',
    radarOptions: [], selectedRadarTarget: '', radarResult: null,
    mlTargetVar: '', mlFeatureVars: [], mlResult: null, showML: false, predictData: null,
    isMasked: false, preMaskedFile: '',
    showLogs: false, logs: [],
    showSettings: false, bgType: 'default', bgUrl: '', windowTint: '', glassOpacity: 0.65,
    showExitConfirm: false, showCleanReportModal: false,
});

export const actions = {}; // 核心：空壳对象

// 引入所有被拆分的模块
import { setupBase } from './store/base.js'
import { setupSettings } from './store/settings.js'
import { setupFile } from './store/file.js'
import { setupProcess } from './store/process.js'
import { setupAnalysis } from './store/analysis.js'
import { setupIntel } from './store/intel.js'
import { setupExporter } from './store/exporter.js'

// 【黑科技】：把七个部门的所有动作，全部挂载到 actions 身上！
// 组件里依然是 actions.addLog(), 完美向下兼容！
Object.assign(
    actions,
    setupBase(store, actions),
    setupSettings(store, actions),
    setupFile(store, actions),
    setupProcess(store, actions),
    setupAnalysis(store, actions),
    setupIntel(store, actions),
    setupExporter(store, actions)
);