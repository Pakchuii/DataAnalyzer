// frontend/src/store.js
import { reactive } from 'vue'

// ==========================================
// 【架构设计：单一数据源 (Single Source of Truth)】
// 采用 Vue3 reactive 构建全局响应式状态树。将零散的组件内部状态抽离，
// 彻底解决多层级组件间 props 钻取 (Prop Drilling) 的跨组件通信难题。
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

// 【架构设计：动作派发总线 (Action Dispatcher)】
// 定义空壳 actions 对象，强制规范“视图只负责渲染，逻辑交由 actions 处理”的单向数据流原则。
export const actions = {};

// 引入所有被拆分的底层业务模块
import { setupBase } from './store/base.js'
import { setupSettings } from './store/settings.js'
import { setupFile } from './store/file.js'
import { setupProcess } from './store/process.js'
import { setupAnalysis } from './store/analysis.js'
import { setupIntel } from './store/intel.js'
import { setupExporter } from './store/exporter.js'

// 【黑科技：基于对象的动态混入 (Mixin) 挂载机制】
// 将拆分在 7 个不同 JS 文件中的底层业务逻辑，动态聚合并注入到全局 actions 中，
// 极大提升了代码的可维护性与模块的独立测试性。
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