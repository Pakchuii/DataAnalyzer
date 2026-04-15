<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <div v-if="store.showPreview && store.previewData" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#13c2c2;">👁️ 数据预览 (前15行)</h3>
    </div>
    <div class="table-responsive">
      <table class="glass-table">
        <thead>
          <tr><th v-for="col in store.previewData.columns" :key="col">{{ col }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in store.previewData.rows" :key="i">
            <td v-for="col in store.previewData.columns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
