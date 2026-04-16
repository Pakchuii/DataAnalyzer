<script setup>
import { store, actions } from '@/core/store.js'

const categories = [
  {
    title: '📥 数据输入与预览',
    modules: [
      { id: 'mod_upload', name: '本地上传' },
      { id: 'mod_data_io', name: '数据 IO 引擎' },
      { id: 'mod_preview', name: '数据网格预览' },
      { id: 'mod_export', name: '多维结果导出' }
    ]
  },
  {
    title: '🧼 数据治理与脱敏',
    modules: [
      { id: 'mod_clean', name: '自动清洗引擎' },
      { id: 'mod_standardize', name: '深度标准化' },
      { id: 'mod_security', name: '敏感信息脱敏' }
    ]
  },
  {
    title: '📈 分析与可视化',
    modules: [
      { id: 'mod_stats', name: '基础统计描述' },
      { id: 'mod_visualize', name: '可视化核心引擎' },
      { id: 'mod_correlation', name: '进效分析矩阵' },
      { id: 'mod_radar', name: '雷达特征扫描' },
      { id: 'mod_ttest', name: '科学统计检验' }
    ]
  },
  {
    title: '🤖 智能决策与 AI',
    modules: [
      { id: 'mod_ml', name: '回归分析引擎' },
      { id: 'mod_summary', name: 'AI 叙述性摘要' }
    ]
  },
  {
    title: '🛠️ 开发者实战示范',
    modules: [
      { id: 'mod_test', name: '全栈示范：数据透视镜' }
    ]
  }
];

const setModule = (modId) => {
  store.activeTestModule = modId;
  
  // 🧪 [实验室特权]：自动激活相关模块的显示开关，确保组件内部 v-if 能够通过
  if (modId === 'mod_ml') { store.showML = true; }
  if (modId === 'mod_visualize') { store.showCharts = true; store.showVisControl = true; }
  if (modId === 'mod_stats') { store.showStats = true; }
  if (modId === 'mod_ttest') { store.showTTest = true; }
  if (modId === 'mod_summary') { store.showAiSummary = true; }
  if (modId === 'mod_preview') { store.showPreview = true; }
  if (modId === 'mod_radar') { store.showRadar = true; }
  if (modId === 'mod_clean') { store.showCleanReportModal = true; }
};

const injectDemoData = () => {
  // 1. 模拟注入原始数据集状态
  store.fileInfo = {
    columns: ['ID', '组别', '指标A', '指标B', '类别', '时间'],
    row_count: 100
  };
  store.currentDataFile = 'demo_sample.csv';
  store.uploadedFileName = '演示数据集 (Lab_Demo.csv)';
  store.selectedVars = ['指标A', '指标B'];
  store.visActiveVars = ['指标A', '指标B'];

  // 2. 深度模拟分析结果 (Deep Mock Results)
  // 让组件无需经过后端真实计算也能瞬间显示出精美的演示界面
  
  // 模拟机器学习回归结果
  store.mlResult = {
    r2: 0.9234,
    mse: 15.678,
    importance: [
      { feature: '指标A', importance: 0.65 },
      { feature: '指标B', importance: 0.25 },
      { feature: '类别', importance: 0.10 }
    ]
  };
  store.mlTargetVar = '指标A';
  store.predictData = {
    confidence: 96.5,
    sampleSize: 50,
    insight: "基于当下趋势，指标A呈现**显著上升**态势。建议在下一周期重点关注指标B的扰动因子。"
  };

  // 模拟可视化图表数据
  store.chartsData = [
    { type: 'hist', varName: '指标A' },
    { type: 'box', varName: '指标A' }
  ];

  // 模拟 AI 智能摘要内容
  store.aiSummary = "✨ **核心洞察**：数据集显示出极强的**线性相关性**。指标A与指标B在 Type1 类别下呈现同步波动。系统判定当前数据质量为【优】，建议立即进入机器学习预测阶段。";

  // 模拟清洗报告
  store.cleanReport = {
    removed_outliers: 5,
    filled_missing: 12,
    log: ["Dixon's Q 发现 2 个离群点", "均值填充了 5 个缺失值", "3-Sigma 准则剔除了 3 个异常波动"]
  };

  actions.addLog("🧪 实验室：全量深度模拟数据已注入！您可以立即测试所有分析模块。", "success");
};
</script>

<template>
  <div class="glass-card tester-sidebar">
    <div class="lab-header">
      <h3 class="lab-title">🧪 组件全能实验室</h3>
      <p class="lab-subtitle">实时预览并测试原子积木块</p>
      <button @click="injectDemoData" class="glass-btn primary-btn inject-btn">
        💉 注入模拟数据
      </button>
    </div>

    <div class="sidebar-scroll-area" style="flex:1; overflow:auto; padding-right: 5px;">
      <div v-for="cat in categories" :key="cat.title" class="category-group">
        <div class="category-title">{{ cat.title }}</div>
        <button 
          v-for="mod in cat.modules" 
          :key="mod.id"
          class="tester-nav-item"
          :class="{ active: store.activeTestModule === mod.id }"
          @click="setModule(mod.id)"
        >
          <span class="mod-dot"></span>
          {{ mod.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/systems/tester/tester.css';

.sidebar-scroll-area::-webkit-scrollbar { width: 4px; }
.sidebar-scroll-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

.lab-header {
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lab-title {
  margin: 0;
  color: #409eff;
  font-size: 1.25rem;
  letter-spacing: 0.5px;
}

.lab-subtitle {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}

.inject-btn {
  margin-top: 5px;
  font-size: 0.8rem;
  padding: 8px 12px;
  border-radius: 10px;
  width: 100%;
  justify-content: center;
}

.mod-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #409eff;
}
.tester-nav-item.active .mod-dot {
  background: white;
}
</style>
