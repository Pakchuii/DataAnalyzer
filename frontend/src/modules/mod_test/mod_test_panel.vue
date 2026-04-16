<script setup>
/**
 * 【全栈样板表现层】
 * 演示如何利用系统标准 CSS 类名构建高审美的玻璃态面板。
 * 同时也展示了如何绑定全局 Store 数据与 Action。
 */
import { store, actions } from '@/core/store.js'
</script>

<template>
  <div class="glass-card result-panel mod-test-container">
    <div class="panel-header">
      <h3 class="panel-title" style="color: #409eff; display: flex; align-items: center; gap: 10px;">
        🔍 全栈示范积木：数据透视镜
      </h3>
    </div>

    <div class="panel-body">
      <p style="color: #888; font-size: 0.9rem; margin-bottom: 20px;">
        这是一块用于演示的实战积木。它通过向后端发送请求，实时探测物理文件的内部列结构。
      </p>

      <!-- 操作区 -->
      <div style="margin-bottom: 25px;">
        <button 
          @click="actions.probeDataStructure" 
          class="glass-btn primary-btn"
          :disabled="store.testLoading"
          style="width: 100%; border-radius: 12px; height: 45px;"
        >
          {{ store.testLoading ? '⏳ 后端正在计算中...' : '🚀 开始全栈透视探测' }}
        </button>
      </div>

      <!-- 结果展示区 -->
      <div v-if="store.testResult" class="test-result-content">
        <div class="stats-summary-row">
            <div class="mini-card">
                <span class="label">数据行数</span>
                <span class="val">{{ store.testResult.total_rows }}</span>
            </div>
            <div class="mini-card">
                <span class="label">数据列数</span>
                <span class="val">{{ store.testResult.total_cols }}</span>
            </div>
        </div>

        <h4 style="margin: 20px 0 10px 0; font-size: 0.9rem; opacity: 0.7;">字段类型深度探测：</h4>
        <div class="column-list">
          <div v-for="col in store.testResult.columns_summary" :key="col.name" class="col-item">
            <span class="col-name">{{ col.name }}</span>
            <span class="col-type" :class="col.type === '数值型' ? 'type-num' : 'type-str'">
              {{ col.type }}
            </span>
            <span class="col-null">缺失: {{ col.null_count }}</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-placeholder">
        尚未开始探测。请确保已注入模拟数据并点击上方按钮。
      </div>
    </div>
  </div>
</template>

<style scoped>
.mod-test-container {
  max-width: 600px;
  margin: 0 auto;
}
.test-result-content {
  animation: slideUp 0.5s ease-out;
}
.stats-summary-row {
    display: flex; gap: 15px; margin-bottom: 20px;
}
.mini-card {
    flex: 1; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
}
.mini-card .label { display: block; font-size: 0.75rem; color: #aaa; margin-bottom: 5px; }
.mini-card .val { font-size: 1.5rem; font-weight: bold; color: #409eff; }

.column-list {
  display: flex; flex-direction: column; gap: 8px;
}
.col-item {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 8px;
  font-size: 0.85rem;
}
.col-name { font-weight: bold; flex: 1; }
.col-type {
  padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin: 0 15px;
}
.type-num { background: rgba(82, 196, 26, 0.1); color: #52c41a; }
.type-str { background: rgba(250, 173, 20, 0.1); color: #faad14; }
.col-null { color: #888; font-size: 0.75rem; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
