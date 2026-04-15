<script setup>
import { store, actions } from '@/core/store.js'

const exportTTest = () => actions.exportToCSV(["variable", "group1_name", "group1_mean", "group2_name", "group2_mean", "t_value", "p_value", "significant"], store.ttestResult, "T检验结果");
</script>

<template>
  <div v-if="store.showTTest && store.ttestResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#ff7875;">⚖️ 独立样本 t 检验 (分组: {{ store.selectedGroupVar }})</h3>
      <button @click="exportTTest" class="glass-btn secondary-btn export-btn" :disabled="store.ttestResult.length === 0">⬇️ 导出 CSV</button>
    </div>
    <div v-if="store.ttestResult.length === 0" style="text-align: center; padding: 40px 20px; color: #f5222d; background: rgba(245,34,45,0.05); border-radius: 8px; border: 1px dashed rgba(245,34,45,0.3);">
      <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
      <h4 style="margin: 0 0 5px 0; color: #f5222d;">样本量过少，无法执行 T 检验</h4>
      <p style="font-size: 0.9rem; margin: 0; opacity: 0.8;">您当前的数据存在某一组只有一个样本的情况。</p>
    </div>
    <div v-else class="table-responsive">
      <table class="glass-table">
        <thead>
          <tr>
            <th>分析变量</th><th>组1均值</th><th>组2均值</th>
            <th><span class="help-tip" data-tip="t 值：衡量两组数据均值差异的程度。绝对值越大，说明两组差异越明显。">t 值</span></th>
            <th><span class="help-tip" data-tip="P 值：统计学中的概率值。通常 P < 0.05 即代表两组数据存在显著性差异。">P 值</span></th>
            <th>结论</th>
            <th><span class="help-tip" data-tip="底层系统自动调度的统计算法引擎">统计学引擎探针</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in store.ttestResult" :key="index">
            <td class="var-name">{{ res.variable }}</td><td>{{ res.group1_mean }}</td><td>{{ res.group2_mean }}</td>
            <td>{{ res.t_value }}</td><td>{{ res.p_value }}</td>
            <td :class="res.significant ? 'danger-text' : 'success-text'">{{ res.significant ? '🔥 显著 (p<0.05)' : '➖ 不显著' }}</td>
            <td><span :class="['algorithm-probe-tag', res.note.includes('Bootstrap') ? 'probe-warning' : 'probe-success']">{{ res.note }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
