<script setup>
import { store, actions } from '@/core/store.js'
import { ref } from 'vue'

const missingStrategy = ref('mean')
const outlierStrategy = ref('auto')

const closeModal = () => {
  store.showCleanDiagnoseModal = false;
}

const executeClean = () => {
  actions.executeCleanWithStrategy(missingStrategy.value, outlierStrategy.value)
}

const missingOptions = [
  { value: 'mean', label: '用均值填充', desc: '将缺失位置替换为该列的算术平均值（推荐）', icon: '📊' },
  { value: 'median', label: '用中位数填充', desc: '抗极端值干扰能力更强', icon: '📐' },
  { value: 'zero', label: '用 0 填充', desc: '适合本身含有自然零值的数据', icon: '0️⃣' },
  { value: 'drop', label: '删除含缺失值的记录', desc: '会减少样本数量，慎用', icon: '🗑️' },
  { value: 'none', label: '不处理缺失值', desc: '保留原始数据不做任何变更', icon: '⏸️' }
]

const outlierOptions = [
  { value: 'auto', label: '智能自适应清洗', desc: '系统自动路由 Dixon\'s Q / 3σ / IQR 算法（推荐）', icon: '🤖' },
  { value: 'none', label: '不处理异常值', desc: '保留所有原始数值不做裁剪', icon: '⏸️' }
]
</script>

<template>
  <div v-if="store.showCleanDiagnoseModal && store.cleanDiagnoseResult" class="modal-overlay" @click.self="closeModal">
    <div class="diagnose-container glass-card-premium">

      <!-- 标题区 -->
      <div class="diagnose-header">
        <h2 class="diagnose-title">🔍 数据质量诊断报告</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <!-- 诊断指标概览 -->
      <div class="diagnose-metrics">
        <div class="diagnose-metric-card">
          <div class="metric-icon">📋</div>
          <div class="metric-info">
            <span class="metric-num">{{ store.cleanDiagnoseResult.total_rows }}</span>
            <span class="metric-desc">样本总行数</span>
          </div>
        </div>
        <div class="diagnose-metric-card" :class="{ 'has-issue': store.cleanDiagnoseResult.total_missing > 0 }">
          <div class="metric-icon">🕳️</div>
          <div class="metric-info">
            <span class="metric-num">{{ store.cleanDiagnoseResult.total_missing }}</span>
            <span class="metric-desc">缺失值数量</span>
          </div>
        </div>
        <div class="diagnose-metric-card" :class="{ 'has-issue': store.cleanDiagnoseResult.total_outliers > 0 }">
          <div class="metric-icon">⚠️</div>
          <div class="metric-info">
            <span class="metric-num">{{ store.cleanDiagnoseResult.total_outliers }}</span>
            <span class="metric-desc">异常值数量</span>
          </div>
        </div>
      </div>

      <!-- 问题明细 -->
      <div class="diagnose-details" v-if="Object.keys(store.cleanDiagnoseResult.missing_details).length > 0 || Object.keys(store.cleanDiagnoseResult.outliers_details).length > 0">
        <div class="detail-scroll">
          <div v-for="(count, col) in store.cleanDiagnoseResult.missing_details" :key="'m'+col" class="detail-row">
            <span class="detail-tag missing-tag">缺失</span>
            <span class="detail-col">{{ col }}</span>
            <span class="detail-count">{{ count }} 处</span>
          </div>
          <div v-for="(count, col) in store.cleanDiagnoseResult.outliers_details" :key="'o'+col" class="detail-row">
            <span class="detail-tag outlier-tag">异常</span>
            <span class="detail-col">{{ col }}</span>
            <span class="detail-count">{{ count }} 处 <span class="detail-method">({{ store.cleanDiagnoseResult.cleaning_methods[col] }})</span></span>
          </div>
        </div>
      </div>

      <!-- 策略选择区 -->
      <div class="strategy-section">
        <!-- 缺失值策略 -->
        <div class="strategy-group" v-if="store.cleanDiagnoseResult.total_missing > 0">
          <h4 class="strategy-title">🧩 缺失值处理策略</h4>
          <div class="strategy-options">
            <label
              v-for="opt in missingOptions" :key="opt.value"
              class="strategy-option" :class="{ selected: missingStrategy === opt.value }">
              <input type="radio" :value="opt.value" v-model="missingStrategy" class="strategy-radio"/>
              <div class="option-content">
                <span class="option-icon">{{ opt.icon }}</span>
                <div class="option-text">
                  <span class="option-label">{{ opt.label }}</span>
                  <span class="option-desc">{{ opt.desc }}</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 异常值策略 -->
        <div class="strategy-group" v-if="store.cleanDiagnoseResult.total_outliers > 0">
          <h4 class="strategy-title">✂️ 异常值处理策略</h4>
          <div class="strategy-options">
            <label
              v-for="opt in outlierOptions" :key="opt.value"
              class="strategy-option" :class="{ selected: outlierStrategy === opt.value }">
              <input type="radio" :value="opt.value" v-model="outlierStrategy" class="strategy-radio"/>
              <div class="option-content">
                <span class="option-icon">{{ opt.icon }}</span>
                <div class="option-text">
                  <span class="option-label">{{ opt.label }}</span>
                  <span class="option-desc">{{ opt.desc }}</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="diagnose-footer">
        <button @click="closeModal" class="glass-btn-premium cancel-btn-premium">取消</button>
        <button @click="executeClean" class="glass-btn-premium confirm-btn-premium">
          ✨ 执行清洗
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(var(--glass-blur));
  display: flex; align-items: center; justify-content: center;
  z-index: 3200;
}
.glass-card-premium {
  background: var(--premium-glass-bg);
  backdrop-filter: blur(var(--glass-blur)); -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--premium-border-color);
  box-shadow: var(--premium-card-shadow);
  color: var(--premium-text-main);
}
.diagnose-container {
  width: 720px; max-width: 92vw; max-height: 88vh;
  padding: 36px; border-radius: 20px;
  position: relative;
  animation: diagnoseSlideUp 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow-y: auto;
}
@keyframes diagnoseSlideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* 标题 */
.diagnose-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--premium-border-color);
}
.diagnose-title {
  margin: 0; font-size: 1.45rem; font-weight: 800;
  background: linear-gradient(135deg, #fa8c16, #f5222d);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.close-btn {
  background: none; border: none; font-size: 1.5rem;
  color: var(--premium-text-muted); cursor: pointer;
  transition: color 0.2s;
}
.close-btn:hover { color: #f5222d; }

/* 诊断指标 */
.diagnose-metrics {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.diagnose-metric-card {
  display: flex; align-items: center; gap: 14px;
  padding: 18px; border-radius: 14px;
  background: var(--premium-glass-inner);
  border: 1px solid var(--glass-border, rgba(0,0,0,0.05));
  transition: all 0.3s;
}
.diagnose-metric-card.has-issue {
  border-color: rgba(250, 140, 22, 0.4);
  background: rgba(250, 140, 22, 0.04);
}
.metric-icon { font-size: 2rem; }
.metric-info { display: flex; flex-direction: column; }
.metric-num { font-size: 1.6rem; font-weight: 800; color: var(--text-color, #333); font-family: 'SF Mono', monospace; }
.metric-desc { font-size: 0.78rem; color: var(--premium-text-muted); font-weight: 600; margin-top: 2px; }

/* 明细 */
.diagnose-details {
  margin-bottom: 24px;
  background: var(--premium-glass-inner); border-radius: 12px;
  padding: 16px;
}
.detail-scroll { max-height: 150px; overflow-y: auto; }
.detail-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--glass-border, rgba(0,0,0,0.04));
  font-size: 0.88rem;
}
.detail-row:last-child { border-bottom: none; }
.detail-tag {
  padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800;
}
.missing-tag { background: rgba(250, 140, 22, 0.12); color: #fa8c16; }
.outlier-tag { background: rgba(245, 34, 45, 0.12); color: #f5222d; }
.detail-col { flex: 1; font-weight: 700; color: var(--text-color, #333); }
.detail-count { color: var(--premium-text-muted); font-size: 0.85rem; }
.detail-method { color: #fa8c16; font-weight: 600; }

/* 策略选择 */
.strategy-section { margin-bottom: 28px; }
.strategy-group { margin-bottom: 22px; }
.strategy-title { margin: 0 0 14px 0; font-size: 1rem; color: var(--text-color, #333); }
.strategy-options { display: flex; flex-direction: column; gap: 8px; }
.strategy-option {
  display: flex; align-items: center;
  padding: 12px 16px; border-radius: 12px;
  background: var(--premium-glass-inner);
  border: 2px solid transparent;
  cursor: pointer; transition: all 0.25s;
}
.strategy-option:hover { border-color: rgba(19, 194, 194, 0.25); }
.strategy-option.selected {
  border-color: #13c2c2;
  background: rgba(19, 194, 194, 0.06);
}
.strategy-radio { display: none; }
.option-content { display: flex; align-items: center; gap: 12px; }
.option-icon { font-size: 1.3rem; }
.option-text { display: flex; flex-direction: column; }
.option-label { font-weight: 700; font-size: 0.92rem; color: var(--text-color, #333); }
.option-desc { font-size: 0.78rem; color: var(--premium-text-muted); margin-top: 2px; }

/* 操作按钮 */
.diagnose-footer {
  display: flex; justify-content: flex-end; gap: 14px;
  padding-top: 18px;
  border-top: 1px solid var(--glass-border, rgba(0,0,0,0.06));
}
.glass-btn-premium {
  border: none; border-radius: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 12px 28px; font-size: 0.95rem;
}
.cancel-btn-premium {
  background: var(--premium-glass-inner);
  color: var(--premium-text-muted);
  border: 1px solid var(--glass-border, rgba(0,0,0,0.1));
}
.cancel-btn-premium:hover { background: rgba(0,0,0,0.06); }
.confirm-btn-premium {
  background: linear-gradient(135deg, #13c2c2, #096dd9);
  color: white;
  box-shadow: 0 4px 15px rgba(19, 194, 194, 0.35);
}
.confirm-btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(19, 194, 194, 0.45);
}
</style>
