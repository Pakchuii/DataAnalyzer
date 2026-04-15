<script setup>
/**
 * 【子系统编排层：智能分析中台 — 数据大屏】
 * 编排各模块的展示面板组件
 */
import { store, actions } from '@/core/store.js'
import { watch, ref } from 'vue'

// 导入积木化面板组件
import ModSummaryPanel from '@/modules/mod_summary/mod_summary_panel.vue'
import ModRadarPanel from '@/modules/mod_radar/mod_radar_panel.vue'
import ModPreviewPanel from '@/modules/mod_preview/mod_preview_panel.vue'
import ModStatsPanel from '@/modules/mod_stats/mod_stats_panel.vue'
import ModTTestPanel from '@/modules/mod_ttest/mod_ttest_panel.vue'
import ModVisualizePanel from '@/modules/mod_visualize/mod_visualize_panel.vue'
import ModCorrelationPanel from '@/modules/mod_correlation/mod_correlation_panel.vue'
import ModMLPanel from '@/modules/mod_ml/mod_ml_panel.vue'

// 追踪面板开启顺序：最新开启的放在前面（index = 0）
const panelHistory = ref([]);

const updateHistory = (panelId, isVisible) => {
  if (isVisible) {
    if (!panelHistory.value.includes(panelId)) {
      // 头部插入，使得新窗口在最上方
      panelHistory.value.unshift(panelId);
    }
  } else {
    panelHistory.value = panelHistory.value.filter(id => id !== panelId);
  }
};

watch(() => store.showAiSummary, (v) => updateHistory('ai', v), { immediate: true });
watch(() => store.showRadar, (v) => updateHistory('radar', v), { immediate: true });
watch(() => store.showPreview, (v) => updateHistory('preview', v), { immediate: true });
watch(() => store.showStats, (v) => updateHistory('stats', v), { immediate: true });
watch(() => store.showTTest, (v) => updateHistory('ttest', v), { immediate: true });
watch(() => store.showCharts, (v) => updateHistory('charts', v), { immediate: true });
watch(() => store.showAdvanced, (v) => updateHistory('advanced', v), { immediate: true });
watch(() => store.showML, (v) => updateHistory('ml', v), { immediate: true });

// 【补全：图表重绘总线监测】
// 监听活跃变量池的变化，强制触发 ECharts 引擎的局部重配与挂载
watch(() => store.visActiveVars, async () => {
  if (store.showCharts) {
    await nextTick();
    setTimeout(() => { 
        if (actions.renderCharts) actions.renderCharts(); 
    }, 150);
  }
}, { deep: true });

const getOrder = (panelId) => {
  const index = panelHistory.value.indexOf(panelId);
  return index === -1 ? 999 : index;
};
</script>

<template>
  <transition-group name="panel-list" tag="main" class="content-area" id="pdf-report-area">

    <!-- 欢迎界面/空状态 -->
    <div v-if="!store.showPreview && !store.showStats && !store.showCharts && !store.showAdvanced && !store.showTTest && !store.showAiSummary && !store.showRadar && !store.showML" 
         key="empty" class="empty-state">
      <div class="glass-card welcome-container">
        <h2 class="welcome-title">✨ 欢迎使用智能数据分析中台</h2>
        <p class="welcome-desc">请从左侧控制台选择您需要激活的分析模块</p>
        <div class="system-status">
          <span class="status-dot"></span>
          系统内核已就绪，当前计算精度：Double Precision
        </div>
      </div>
    </div>



    <!-- 模块化面板拼装 -->
    <ModSummaryPanel key="ai" :style="{ order: getOrder('ai') }" />
    <ModRadarPanel key="radar" :style="{ order: getOrder('radar') }" />
    <ModPreviewPanel key="preview" :style="{ order: getOrder('preview') }" />
    <ModStatsPanel key="stats" :style="{ order: getOrder('stats') }" />
    <ModTTestPanel key="ttest" :style="{ order: getOrder('ttest') }" />
    <ModVisualizePanel key="charts" :style="{ order: getOrder('charts') }" />
    <ModCorrelationPanel key="advanced" :style="{ order: getOrder('advanced') }" />
    <ModMLPanel key="ml" :style="{ order: getOrder('ml') }" />

  </transition-group>


</template>

<style scoped>
@import '@/systems/analysis/analysis.css';

/* 面板列表动画 */
.panel-list-enter-active,
.panel-list-leave-active,
.panel-list-move {
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.panel-list-enter-from {
  opacity: 0;
  transform: translateY(-50px) scale(0.95);
}

.panel-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.panel-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
