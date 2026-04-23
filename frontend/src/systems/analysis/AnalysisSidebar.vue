<script setup>
/**
 * 【子系统编排层：智能分析中台 — 侧边栏】
 * 完全剥离业务UI，拼装各个独立的“积木”组件
 */
import { store, actions } from '@/core/store.js'

import ModUpload from '@/modules/mod_upload/mod_upload.vue'
import ModPreview from '@/modules/mod_preview/mod_preview.vue'
import ModClean from '@/modules/mod_clean/mod_clean.vue'
import ModSecurity from '@/modules/mod_security/mod_security.vue'
import ModStandardize from '@/modules/mod_standardize/mod_standardize.vue'
import ModDataIo from '@/modules/mod_data_io/mod_data_io.vue'
import ModFilter from '@/modules/mod_filter/mod_filter.vue'
import ModTtest from '@/modules/mod_ttest/mod_ttest.vue'
import ModTtestBtn from '@/modules/mod_ttest/mod_ttest_btn.vue'
import ModStats from '@/modules/mod_stats/mod_stats.vue'
import ModVisualize from '@/modules/mod_visualize/mod_visualize.vue'
import ModCorrelation from '@/modules/mod_correlation/mod_correlation.vue'
import ModMl from '@/modules/mod_ml/mod_ml.vue'
import ModSummary from '@/modules/mod_summary/mod_summary.vue'
import ModRadar from '@/modules/mod_radar/mod_radar.vue'
import ModExit from '@/modules/mod_exit/ModExit.vue'
import ModExport from '@/modules/mod_export/mod_export.vue'
</script>

<template>
  <aside class="sidebar glass-card">
    <h2 class="sidebar-title">⚙️ 控制台</h2>

    <ModExit />

    <ModUpload />

    <div v-if="store.fileInfo" class="config-panel">

      <div class="action-grid mt-3">
        <ModPreview />
        <ModClean />
      </div>

      <div v-if="store.cleanResult" class="steps-container mt-3">

        <ModSecurity />
        <ModStandardize />

        <div class="divider"></div>

        <ModDataIo />
        <div style="margin-top: 8px;"></div>
        <ModFilter />
        <ModTtest />

        <div class="divider"></div>

        <div class="action-grid">
          <ModStats />
          <ModVisualize />
          <ModCorrelation />
          <ModTtestBtn />
        </div>

        <div class="divider" style="margin-top: 25px;"></div>

        <ModMl />

        <div class="divider" style="margin-top: 25px;"></div>

        <ModSummary />
        <ModRadar />

        <div class="divider" style="margin-top: 25px;"></div>

        <ModExport />

      </div>
    </div>

    <div style="flex-grow: 1;"></div>

    <button @click="actions.triggerCleanup" class="glass-btn cleanup-btn mt-3">🧹 一键清理系统缓存</button>
    <button @click="store.showLogs = !store.showLogs" class="glass-btn log-toggle-btn mt-3">
      {{ store.showLogs ? '📟 收起系统操作日志' : '📟 展开系统操作日志' }}
    </button>
  </aside>
</template>

<style scoped>
.sidebar { position: relative; transition: all 0.3s; }
</style>

