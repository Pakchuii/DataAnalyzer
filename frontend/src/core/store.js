// core/store.js
// ==========================================
// 【架构设计：单一数据源 (Single Source of Truth)】
// 采用 Vue3 reactive 构建全局响应式状态树。
// 模块化重构后，状态仍集中管理，但 actions 由各模块独立贡献。
// ==========================================
import { reactive } from 'vue'

export const store = reactive({
    // ===== 全局基础状态 =====
    isEntered: false, currentModule: 'portal', isDarkMode: false,
    showUploadModal: false, uploadedFileName: '', isDragging: false,
    dialog: { show: false, title: '', message: '', type: 'alert', onConfirm: null },
    showLogs: false, logs: [],
    showSettings: false, bgType: 'default', bgUrl: '', windowTint: '', glassOpacity: 0.65,

    // ===== 数据层状态 =====
    fileInfo: null, currentDataFile: '', selectedGroupVar: '', selectedVars: [],

    // ===== 功能面板显隐 =====
    showPreview: false, showStats: false, showCharts: false, showAdvanced: false,
    showTTest: false, showVisControl: false, showAiSummary: false, showRadar: false,
    showML: false, showExitConfirm: false, showCleanReportModal: false,
    showManualModal: false,

    // ===== 各模块数据 =====
    cleanResult: null, isStandardized: false,
    previewData: null, statsResult: null, ttestResult: null,
    chartsData: [], visActiveVars: [], advancedResult: null,
    manualGrid: [],
    aiSummaryText: [],
    radarIdCol: '', radarOptions: [], selectedRadarTarget: '', radarResult: null,
    mlTargetVar: '', mlFeatureVars: [], mlResult: null, predictData: null,
    isMasked: false, preMaskedFile: '',
})

// 【架构设计：动作派发总线 (Action Dispatcher)】
export const actions = {}

// 引入核心模块
import { setupBase } from '@/core/base.js'
import { setupSettings } from '@/core/settings.js'

// 引入功能模块 — 每个模块自包含，可独立拆卸
import { setupFile } from '@/modules/mod_upload/store.js'
import { setupProcess } from '@/modules/mod_preview/store.js'
import { setupClean } from '@/modules/mod_clean/store.js'
import { setupStandardize } from '@/modules/mod_standardize/store.js'
import { setupSecurity } from '@/modules/mod_security/store.js'
import { setupStats } from '@/modules/mod_stats/store.js'
import { setupVisualize } from '@/modules/mod_visualize/store.js'
import { setupCorrelation } from '@/modules/mod_correlation/store.js'
import { setupTTest } from '@/modules/mod_ttest/store.js'
import { setupSummary } from '@/modules/mod_summary/store.js'
import { setupRadar } from '@/modules/mod_radar/store.js'
import { setupML } from '@/modules/mod_ml/store.js'
import { setupExporter } from '@/modules/mod_export/store.js'

// 【动态混入 (Mixin) 挂载机制】
// 将拆分在各独立模块中的业务逻辑，动态聚合并注入到全局 actions 中
Object.assign(
    actions,
    setupBase(store, actions),
    setupSettings(store, actions),
    setupFile(store, actions),
    setupProcess(store, actions),
    setupClean(store, actions),
    setupStandardize(store, actions),
    setupSecurity(store, actions),
    setupStats(store, actions),
    setupVisualize(store, actions),
    setupCorrelation(store, actions),
    setupTTest(store, actions),
    setupSummary(store, actions),
    setupRadar(store, actions),
    setupML(store, actions),
    setupExporter(store, actions)
)
