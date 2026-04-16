<script setup>
import { actions } from '@/core/store.js'
</script>

<template>
  <div class="mod-export-wrapper">
    <h4 style="color: #ff4d4f; display: flex; align-items: center; gap: 5px;">
      <span style="font-size: 1.2rem;">📸</span> PDF数据报截图：
    </h4>
    <button @click="actions.exportPDF" class="glass-btn pdf-export-btn">⬇️ 一键导出高清 PDF 数据报</button>
  </div>
</template>
