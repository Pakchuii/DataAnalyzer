<script setup>
import { store, actions } from '@/core/store.js'

const exportStats = () => actions.exportToCSV(["variable", "count", "mean", "median", "std", "min", "max"], store.statsResult, "描述性统计结果");
</script>

<template>
  <div v-if="store.showStats && store.statsResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title">🧮 描述性统计结果</h3>
      <button @click="exportStats" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
    </div>
    <div class="table-responsive">
      <table class="glass-table">
        <thead><tr><th>变量</th><th>均值</th><th>中位数</th><th>标准差</th><th>最小</th><th>最大</th></tr></thead>
        <tbody>
          <tr v-for="row in store.statsResult" :key="row.variable">
            <td class="var-name">{{ row.variable }}</td><td>{{ row.mean }}</td><td>{{ row.median }}</td><td>{{ row.std }}</td><td>{{ row.min }}</td><td>{{ row.max }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
