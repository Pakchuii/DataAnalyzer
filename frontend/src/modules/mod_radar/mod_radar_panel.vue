<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <div v-if="store.showRadar && store.radarResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#e6a23c;">🕸️ 个体能力定位雷达图</h3>
    </div>
    <div id="radar-container" class="chart-box" style="height: 500px;"></div>
  </div>
</template>
