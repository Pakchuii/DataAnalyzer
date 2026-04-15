<script setup>
import { store, actions } from '@/core/store.js'
import { watch, nextTick } from 'vue'

// 稳定性重置：回归老版本 watch 触发逻辑，配合 setTimeout 确保 DOM 真正就绪
watch(() => store.showAdvanced, async (val) => {
  if (val) {
    await nextTick();
    setTimeout(() => { actions.renderAdvancedCharts(); }, 300);
  }
});

const exportNormality = () => actions.exportToCSV(["variable", "statistic", "p_value", "is_normal"], store.advancedResult.normality, "正态性检验结果");
</script>

<template>
  <!-- 🔬 关联分析模块 (回归老版本 DataScreen.vue 稳定布局) -->
  <div v-if="store.showAdvanced && store.advancedResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#fa541c;">📈 高阶关联分析与正态性检验</h3>
      <button @click="exportNormality" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
    </div>
    
    <div class="sub-panel">
      <div class="sub-header"><h4>🧪 Shapiro-Wilk 正态性检验诊断</h4></div>
      <div class="table-responsive">
        <table class="glass-table">
          <thead><tr><th>变量</th><th>W 统计量</th><th>P 值</th><th>结论</th></tr></thead>
          <tbody>
            <tr v-for="res in store.advancedResult.normality" :key="res.variable">
              <td class="var-name">{{ res.variable }}</td><td>{{ res.statistic }}</td><td>{{ res.p_value }}</td>
              <td :class="res.is_normal ? 'success-text' : 'danger-text'">{{ res.is_normal ? '✅ 符合正态' : '❌ 非正态' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 还原老版本直排布局与 ID 查找模式 -->
    <div class="chart-grid mt-3">
      <div id="heatmap-container" class="chart-box glass-inner" style="height: 400px;"></div>
      <div id="scatter-container" class="chart-box glass-inner" style="height: 400px;"></div>
    </div>
  </div>
</template>

<style scoped>
.sub-panel { margin-top: 15px; }
.sub-header { margin-bottom: 10px; }
.mt-3 { margin-top: 15px; }
.chart-grid { display: flex; gap: 20px; }
.chart-box { flex: 1; min-height: 400px; padding: 10px; background: rgba(255, 255, 255, 0.04); border-radius: 12px; }
/* 确保表格不会溢出 */
.table-responsive { overflow-x: auto; max-height: 400px; }
</style>
