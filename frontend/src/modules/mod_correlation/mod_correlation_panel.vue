<script setup>
import { store, actions } from '@/core/store.js'

const exportNormality = () => actions.exportToCSV(["variable", "statistic", "p_value", "is_normal"], store.advancedResult.normality, "正态性检验结果");
</script>

<template>
  <div v-if="store.showAdvanced && store.advancedResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#fa541c;">📈 高阶关联分析与正态性检验</h3>
    </div>
    
    <div class="sub-panel">
      <div class="sub-header">
        <h4>🧪 Shapiro-Wilk 正态性检验诊断</h4>
        <button @click="exportNormality" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
      </div>
      <div class="table-responsive">
        <table class="glass-table">
          <thead><tr><th>变量</th><th>W 统计量</th><th>P 值</th><th>结论</th></tr></thead>
          <tbody>
            <tr v-for="res in store.advancedResult.normality" :key="res.variable">
              <td>{{ res.variable }}</td><td>{{ res.statistic }}</td><td>{{ res.p_value }}</td>
              <td :class="res.is_normal ? 'success-text' : 'danger-text'">{{ res.is_normal ? '✅ 符合正态分布' : '❌ 非正态分布' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-panel" style="margin-top: 30px;">
      <div class="sub-header"><h4>🔥 Pearson 特征相关性热力矩阵</h4></div>
      <div id="heatmap-container" class="chart-box" style="height: 500px;"></div>
    </div>

    <div class="sub-panel" style="margin-top: 30px;">
      <div class="sub-header"><h4>📍 特征交互散点分布图 (Scatter Matrix Preview)</h4></div>
      <div id="scatter-container" class="chart-box" style="height: 500px;"></div>
    </div>
  </div>
</template>
