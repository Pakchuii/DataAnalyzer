<script setup>
import { store, actions } from '@/core/store.js'

const closeModal = () => {
    store.showCleanReportModal = false;
};

const applyCleaning = () => {
    actions.applyDataCleaning();
    closeModal();
};

const restoreData = () => {
    actions.restoreData();
    closeModal();
};
</script>

<template>
  <div v-if="store.showCleanReportModal" class="modal-overlay" style="z-index: 3200;" @click.self="closeModal">
    <div class="glass-card-premium clean-report-container-premium">
      
      <div class="modal-header-premium">
        <h2 class="report-title-premium">✨ 智能清洗诊断战报</h2>
        <button @click="closeModal" class="close-btn-premium">✕</button>
      </div>

      <!-- 核心指标卡片区 -->
      <div class="metrics-grid-premium section-spacing">
        <div class="metric-card-premium border-blue">
          <div class="card-icon-premium">🛡️</div>
          <div class="card-label-premium">扫描样本总数</div>
          <div class="card-value-premium color-blue">{{ store.cleanResult?.total_rows || 0 }} <span class="unit-premium">条</span></div>
        </div>
        <div class="metric-card-premium border-orange">
          <div class="card-icon-premium">🕳️</div>
          <div class="card-label-premium">修复缺失空项</div>
          <div class="card-value-premium color-orange">{{ store.cleanResult?.total_missing || 0 }} <span class="unit-premium">处</span></div>
        </div>
        <div class="metric-card-premium border-red">
          <div class="card-icon-premium">✂️</div>
          <div class="card-label-premium">拦截异常数值</div>
          <div class="card-value-premium color-red">{{ store.cleanResult?.total_outliers || 0 }} <span class="unit-premium">处</span></div>
        </div>
      </div>

      <!-- 数据质量评估文案 -->
      <div v-if="store.cleanResult?.total_missing === 0 && store.cleanResult?.total_outliers === 0" class="quality-alert-premium success-bg-premium section-spacing">
        <h3 class="success-text-premium">🎉 数据质量极佳，无需任何手术！</h3>
        <p class="quality-desc-premium">系统地毯式扫描后，未在数值特征中检测到缺失项或极端异常值，您的数据集非常健康。</p>
      </div>

      <!-- 处理清单详情区 -->
      <div v-else class="diagnostic-details-premium section-spacing">
        <h4 class="details-subtitle-premium">🛠️ 系统底层处理清单：</h4>
        <div class="log-scroll-area-premium">
          <ul class="trace-list-premium">
            <template v-if="store.cleanResult?.total_missing > 0">
              <li v-for="(count, col) in store.cleanResult.missing_details" :key="'m'+col" class="trace-item-premium">
                <span class="type-tag-premium fill-tag">[填补空值]</span>
                <span class="col-name-premium">特征列 <b>{{ col }}</b></span>
                <span class="result-text-premium">成功插补 {{ count }} 项 (均值插补)</span>
              </li>
            </template>
            <template v-if="store.cleanResult?.total_outliers > 0">
              <li v-for="(count, col) in store.cleanResult.outliers_details" :key="'o'+col" class="trace-item-premium">
                <span class="type-tag-premium prune-tag">[裁剪异常]</span>
                <span class="col-name-premium">特征列 <b>{{ col }}</b></span>
                <span class="result-text-premium">成功拦截 {{ count }} 项 <span class="method-tag">({{ store.cleanResult.cleaning_methods[col] || '自适应边界限幅' }})</span></span>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <div class="modal-footer-premium-centered mt-4">
        <button @click="applyCleaning" class="glass-btn-premium primary-btn-green-premium">
          <span class="btn-check">✓</span> 阅毕，开始探索数据
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
}
.glass-card-premium {
  background: var(--premium-glass-bg);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  border: 1px solid var(--premium-border-color);
  box-shadow: var(--premium-card-shadow);
  color: var(--premium-text-main);
}
.clean-report-container-premium {
  width: 800px; max-width: 90vw; padding: 40px; border-radius: 20px;
  position: relative; animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.report-title-premium {
  margin: 0; font-size: 1.6rem; color: #52c41a; font-weight: 800;
  border-bottom: 1px dashed var(--premium-border-color); padding-bottom: 20px;
}
.metrics-grid-premium {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.metric-card-premium {
  padding: 25px; text-align: center; border-radius: 12px; 
  background: var(--premium-glass-inner);
}
.card-icon-premium { font-size: 3.2rem; margin-bottom: 18px; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12)); }
.card-label-premium { font-size: 0.85rem; color: var(--premium-text-muted); font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
.card-value-premium { font-size: 3rem; font-weight: 700; }
.section-spacing { margin-top: 50px; }
.unit-premium { font-size: 1.1rem; font-weight: 500; margin-left: 10px; opacity: 0.6; }

.border-blue { border-top: 4px solid #409eff; }
.border-orange { border-top: 4px solid #fa8c16; }
.border-red { border-top: 4px solid #f5222d; }
.color-blue { color: #409eff; }
.color-orange { color: #fa8c16; }
.color-red { color: #f5222d; }

.diagnostic-details-premium { 
  background: var(--premium-glass-inner); padding: 25px; border-radius: 12px;
}
.details-subtitle-premium { margin-top: 0; margin-bottom: 15px; color: var(--premium-text-main); opacity: 0.8; }
.log-scroll-area-premium { max-height: 220px; overflow-y: auto; }
.trace-list-premium { list-style: none; padding: 0; margin: 0; }
.trace-item-premium {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid var(--premium-border-color);
}
.type-tag-premium { font-weight: 800; margin-right: 12px; font-size: 0.95rem; }
.type-tag-premium.fill-tag { color: #fa8c16; }
.type-tag-premium.prune-tag { color: #f5222d; }
.col-name-premium { flex: 1; color: var(--premium-text-main); }
.result-text-premium { color: var(--premium-text-muted); text-align: right; font-size: 0.9rem; }
.method-tag { font-weight: bold; color: #fa8c16; margin-left: 5px; }

.modal-footer-premium-centered { display: flex; justify-content: center; width: 100%; margin-top: 20px; }

.glass-btn-premium {
  border: none; border-radius: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); padding: 14px 25px; font-size: 1.05rem;
  min-width: 180px; letter-spacing: 0.5px;
}
.primary-btn-green-premium {
  background: #52c41a; color: white;
  box-shadow: 0 4px 15px rgba(82, 196, 26, 0.4);
}
.primary-btn-green-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(82, 196, 26, 0.5); }
.btn-check { margin-right: 10px; border: 2px solid white; border-radius: 3px; padding: 0 4px; font-size: 0.9rem; }

.close-btn-premium {
  position: absolute; top: 25px; right: 25px; background: none; border: none; font-size: 1.5rem; color: var(--premium-text-muted); cursor: pointer;
}

.success-bg-premium {
  background: rgba(82, 196, 26, 0.05); border: 1px dashed rgba(82, 196, 26, 0.4);
  padding: 30px; text-align: center; border-radius: 12px;
}
.success-text-premium { color: #52c41a; margin-top: 0; }
.quality-desc-premium { color: var(--premium-text-main); opacity: 0.8; }

@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
