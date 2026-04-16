<script setup>
import { computed, defineAsyncComponent, markRaw } from 'vue'
import { store } from '@/core/store.js'

// 📂 异步导入所有业务面板组件，实现真正的按需加载
const panelMap = {
  // 数据输入与预览
  'mod_upload': defineAsyncComponent(() => import('@/modules/mod_upload/mod_upload.vue')),
  'mod_preview': defineAsyncComponent(() => import('@/modules/mod_preview/mod_preview_editor.vue')),
  'mod_data_io': defineAsyncComponent(() => import('@/modules/mod_data_io/mod_data_io_view.vue')),
  'mod_export': defineAsyncComponent(() => import('@/modules/mod_export/mod_export.vue')),

  // 数据治理与脱敏
  'mod_clean': defineAsyncComponent(() => import('@/modules/mod_clean/mod_clean_report.vue')),
  'mod_standardize': defineAsyncComponent(() => import('@/modules/mod_standardize/mod_standardize.vue')),
  'mod_security': defineAsyncComponent(() => import('@/modules/mod_security/mod_security.vue')),

  // 分析与可视化
  'mod_stats': defineAsyncComponent(() => import('@/modules/mod_stats/mod_stats_panel.vue')),
  'mod_visualize': defineAsyncComponent(() => import('@/modules/mod_visualize/mod_visualize_panel.vue')),
  'mod_correlation': defineAsyncComponent(() => import('@/modules/mod_correlation/mod_correlation_panel.vue')),
  'mod_radar': defineAsyncComponent(() => import('@/modules/mod_radar/mod_radar_panel.vue')),
  'mod_ttest': defineAsyncComponent(() => import('@/modules/mod_ttest/mod_ttest_panel.vue')),

  // 智能决策与 AI
  'mod_ml': defineAsyncComponent(() => import('@/modules/mod_ml/mod_ml_panel.vue')),
  'mod_summary': defineAsyncComponent(() => import('@/modules/mod_summary/mod_summary.vue')),
  'mod_test': defineAsyncComponent(() => import('@/modules/mod_test/mod_test_panel.vue'))
};

const activePanel = computed(() => {
  return panelMap[store.activeTestModule] || null;
});

const moduleTitle = computed(() => {
  const titles = {
    'mod_upload': '本地上传中心',
    'mod_preview': '数据网格编辑器',
    'mod_data_io': '数据 IO 引擎',
    'mod_export': '多维结果导出',
    'mod_clean': '自动清洗报告',
    'mod_standardize': '深度标准化',
    'mod_security': '敏感信息脱敏',
    'mod_stats': '基础统计描述',
    'mod_visualize': '可视化核心引擎',
    'mod_correlation': '进效分析矩阵',
    'mod_radar': '雷达特征扫描',
    'mod_ttest': '科学统计检验',
    'mod_ml': '回归分析引擎',
    'mod_summary': 'AI 叙述性摘要',
    'mod_test': '全栈示范：数据透视镜'
  };
  return titles[store.activeTestModule] || '未知模块';
});
</script>

<template>
  <div class="tester-screen">
    <div class="glass-card sandbox-container">
      <div class="sandbox-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size: 1.5rem;">🏗️</span>
          <div>
            <h3 style="margin:0;">模块沙盒：{{ moduleTitle }}</h3>
            <p style="margin:0; font-size: 0.8rem; color: #888;">
              正在运行模块 ID: <code style="color: #409eff;">{{ store.activeTestModule }}</code>
            </p>
          </div>
        </div>
        <div class="status-indicator">
          <span class="pulse-dot"></span> 实时沙盒
        </div>
      </div>

      <div class="sandbox-content">
        <!-- 📂 加固渲染：增加一层稳固的根容器，防止某些模块 v-if 导致 transition 报错 -->
        <transition name="scale-fade" mode="out-in">
          <div :key="store.activeTestModule" class="module-sandbox-wrapper">
            <component :is="activePanel" />
          </div>
        </transition>
      </div>

      <!-- 实时日志监视面板 -->
      <div class="debug-logs" v-if="store.logs.length > 0">
        <div style="font-weight:bold; margin-bottom: 5px; color: #999;">⚡ 系统操作日志监视器 (全局)</div>
        <div v-for="(log, idx) in store.logs.slice(-5)" :key="idx" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/systems/tester/tester.css';

.scale-fade-enter-active, .scale-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.scale-fade-enter-from { opacity: 0; transform: scale(0.98); }
.scale-fade-leave-to { opacity: 0; transform: scale(1.02); }

.pulse-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #67c23a;
  box-shadow: 0 0 10px rgba(103, 194, 58, 0.5);
  animation: pulse 1.5s infinite;
  margin-right: 5px;
}
@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

.log-entry {
  padding: 2px 0; border-bottom: 1px solid rgba(0,0,0,0.03);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
