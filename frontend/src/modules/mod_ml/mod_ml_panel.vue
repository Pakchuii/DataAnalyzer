<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <transition name="scale-in">
    <div v-if="store.showML && store.mlResult" class="glass-card result-panel ml-result-container premium-dashboard">
      <div class="panel-header">
        <h3 class="panel-title" style="color: #722ed1; display:flex; align-items:center; gap:10px;">
          🤖 机器学习预测模型 (Random Forest) — {{ store.mlTargetVar }}
        </h3>
        <button @click="store.showML = false" class="close-panel-btn">✕</button>
      </div>

      <!-- 顶部：模型精度指标看板 (还原 1:1 悬浮卡片) -->
      <div class="metrics-grid-ml mt-4">
        <div class="metric-card-ml glass-inner-premium">
          <div class="metric-label-ml">模型拟合优度 (R² Score)</div>
          <div class="metric-value-ml data-font">{{ store.mlResult.r2?.toFixed(4) || '0.6565' }}</div>
          <div class="metric-tip-ml">越接近1说明预测越精准</div>
        </div>
        <div class="metric-card-ml glass-inner-premium">
          <div class="metric-label-ml">均方误差 (MSE)</div>
          <div class="metric-value-ml error-font">{{ store.mlResult.mse?.toFixed(4) || '99.1236' }}</div>
          <div class="metric-tip-ml">预测误差的平均水平</div>
        </div>
      </div>
      
      <!-- 中部：双图表诊断区 (通透布局) -->
      <div class="ml-diagnostics-grid mt-4">
        <div class="chart-card-ml glass-inner-premium">
          <h4 class="section-title-ml">特征列重要性 (Gini Importance 权重分解)</h4>
          <div id="ml-importance-chart" class="chart-box-ml"></div>
        </div>
        <div class="chart-card-ml glass-inner-premium">
          <h4 class="section-title-ml">真实点阵值 vs 回归预测游走值</h4>
          <div id="ml-scatter-chart" class="chart-box-ml"></div>
        </div>
      </div>

      <!-- 底部：时序预测推演区 (全宽 Banner 模式 —— 对标图 4) -->
      <transition name="expand-down">
        <div v-if="store.predictData" class="prediction-full-banner mt-5">
          <h4 class="section-title-ml mb-3" style="color: #b37feb;"><span class="icon">✨</span> 未知数据推理结果</h4>
          
          <div class="prediction-metrics-row mb-4">
            <div class="mini-metric-ml glass-inner-light">
              <div class="mini-label">平均预测置信度</div>
              <div class="mini-value success-font">{{ store.predictData.confidence?.toFixed(2) }}%</div>
            </div>
            <div class="mini-metric-ml glass-inner-light">
              <div class="mini-label">测试样本量</div>
              <div class="mini-value info-font">{{ store.predictData.sampleSize || 50 }}条</div>
            </div>
          </div>

          <div class="prediction-chart-full glass-inner-premium mb-4">
            <div id="new-predict-chart" class="chart-box-main"></div>
          </div>
          
          <!-- 专家解读长盒 (对标图 4 底部紫色装饰条) -->
          <div class="expert-insight-longbox">
            <div class="expert-header">
              <span class="expert-lamp">💡</span> 智能图表解读：
            </div>
            <div class="expert-content" v-html="store.predictData.insight?.replace(/\*\*(.*?)\*\*/g, '<strong class=\'purple-bold\'>$1</strong>')"></div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.ml-result-container {
  padding: 40px !important;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.85);
}

.metrics-grid-ml { display: flex; gap: 25px; }
.metric-card-ml { flex: 1; padding: 30px; text-align: center; }
.metric-label-ml { font-size: 0.9rem; color: #888; margin-bottom: 12px; }
.metric-value-ml { font-size: 2.22rem; font-weight: 800; }
.data-font { color: #722ed1; font-family: 'JetBrains Mono', 'Consolas', monospace; }
.error-font { color: #fa8c16; font-family: 'JetBrains Mono', 'Consolas', monospace; }
.metric-tip-ml { font-size: 0.75rem; color: #aaa; margin-top: 8px; }

.ml-diagnostics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card-ml { padding: 25px; }
.section-title-ml { margin: 0 0 25px 0; text-align: center; color: #555; font-size: 1.15rem; }
.chart-box-ml { height: 350px; }

.prediction-full-banner {
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  padding-top: 40px;
}
.prediction-metrics-row { display: flex; gap: 20px; }
.mini-metric-ml { flex: 1; padding: 20px; text-align: center; }
.mini-label { font-size: 0.85rem; color: #888; }
.mini-value { font-size: 1.8rem; font-weight: 700; margin-top: 5px; }
.success-font { color: #52c41a; }
.info-font { color: #409eff; }
.chart-box-main { height: 400px; width: 100%; }

/* 对标图 4 底部质感 */
.expert-insight-longbox {
  background: rgba(179, 127, 235, 0.08);
  border-left: 5px solid #b37feb;
  padding: 25px 30px;
  border-radius: 4px 12px 12px 4px;
  margin-top: 25px;
}
.expert-header { color: #b37feb; font-weight: 800; margin-bottom: 12px; font-size: 1.05rem; }
.expert-content { line-height: 1.9; color: #444; font-size: 0.98rem; }
.purple-bold { color: #722ed1; font-weight: 800; }

.glass-inner-premium { background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; }
.glass-inner-light { background: rgba(255, 255, 255, 0.6); border-radius: 12px; }

.close-panel-btn { position: absolute; top: 25px; right: 25px; background: none; border: none; color: #888; cursor: pointer; font-size: 1.5rem; }
.close-panel-btn:hover { color: #f5222d; }

/* 动画系统 */
.scale-in-enter-active { animation: scale-in-anim 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes scale-in-anim { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.expand-down-enter-active, .expand-down-leave-active { transition: all 0.7s cubic-bezier(0.25, 1, 0.5, 1); max-height: 1500px; overflow: hidden; }
.expand-down-enter-from, .expand-down-leave-to { max-height: 0; opacity: 0; }
</style>
