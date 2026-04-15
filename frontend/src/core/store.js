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
    showAppDesktop: false,
    showSlotSwitcher: false,
    pinnedSystemId: localStorage.getItem('pinnedSystemId') || 'template',
    dialog: {
        show: false,
        type: 'alert', // alert, confirm, prompt, choice
        title: '',
        message: '',
        inputValue: '',
        placeholder: '',
        btn1Text: '确认',
        btn2Text: '取消',
        onConfirm: null, // 用于 alert/confirm/prompt
        cb1: null, // 用于 choice
        cb2: null, // 用于 choice
        cbCancel: null
    },
    showLogs: false, logs: [],
    showSystemShelf: false,
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
    // ===== 演示模板各模块数据 =====
    showTemplatePanel: false, templateData: null,
})

// 【架构设计：动作派发总线 (Action Dispatcher)】
export const actions = {}

// 引入核心模块
import { setupBase } from '@/core/base.js'
import { setupSettings } from '@/core/settings.js'

// 引入功能模块 — 每个模块自包含，可独立拆卸
import { setupFile } from '@/modules/mod_upload/mod_upload.js'
import { setupProcess } from '@/modules/mod_preview/mod_preview.js'
import { setupDataIO } from '@/modules/mod_data_io/mod_data_io.js'
import { setupClean } from '@/modules/mod_clean/mod_clean.js'
import { setupStandardize } from '@/modules/mod_standardize/mod_standardize.js'
import { setupSecurity } from '@/modules/mod_security/mod_security.js'
import { setupStats } from '@/modules/mod_stats/mod_stats.js'
import { setupVisualize } from '@/modules/mod_visualize/mod_visualize.js'
import { setupCorrelation } from '@/modules/mod_correlation/mod_correlation.js'
import { setupTTest } from '@/modules/mod_ttest/mod_ttest.js'
import { setupSummary } from '@/modules/mod_summary/mod_summary.js'
import { setupRadar } from '@/modules/mod_radar/mod_radar.js'
import { setupML } from '@/modules/mod_ml/mod_ml.js'
import { setupExporter } from '@/modules/mod_export/mod_export.js'
import { setupTemplate } from '@/modules/mod_template/mod_template.js'

// 【动态混入 (Mixin) 挂载机制】
// 将拆分在各独立模块中的业务逻辑，动态聚合并注入到全局 actions 中
Object.assign(
    actions,
    setupBase(store, actions),
    setupSettings(store, actions),
    setupFile(store, actions),
    setupProcess(store, actions),
    setupDataIO(store, actions),
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
    setupExporter(store, actions),
    setupTemplate(store, actions)
)
