<script setup>
import { store } from '@/core/store.js'

const closeModal = () => {
    store.showSampleInsufficientModal = false;
};
</script>

<template>
  <div class="modal-overlay" style="z-index: 20000;" @click.self="closeModal">
    <div class="glass-card-premium modal-content-premium">
      <div class="warning-large-icon">⚠️</div>
      <h2 class="warning-title-premium">机器学习训练受阻</h2>
      <p class="warning-desc-premium">
        由于您选定的特征变量和目标变量存在大量缺失值，或数据量过小，导致过滤后的有效训练样本量不足 <b class="highlight-b">(需至少 5 个样本)</b>。
      </p>
      <div class="tip-box-premium">
        <p class="tip-text-premium">💡 建议：尝试执行【智能清洗】后再进行建模</p>
      </div>
      <button @click="closeModal" class="glass-btn-premium warning-btn-premium">返回并调整变量</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
}

.glass-card-premium.warning-modal {
  width: 500px;
  background: var(--premium-glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--premium-border-color);
  box-shadow: var(--premium-card-shadow);
  color: var(--premium-text-main);
}

.modal-content-premium {
  max-width: 480px; width: 92%; padding: 45px; text-align: center; border-radius: 24px;
  animation: slideUp 0.3s ease-out;
}

.warning-large-icon { font-size: 4.5rem; margin-bottom: 25px; filter: drop-shadow(0 0 10px rgba(250, 140, 22, 0.3)); }
.warning-title-premium { color: #fa8c16; margin-top: 0; font-size: 1.6rem; font-weight: 800; }
.warning-desc-premium { color: var(--premium-text-main); line-height: 1.8; opacity: 0.9; font-size: 1.05rem; }
.highlight-b { color: #fa8c16; }

.tip-box-premium {
  margin: 30px 0; padding: 18px; border-radius: 12px;
  background: rgba(250, 140, 22, 0.08); border: 1px dashed rgba(250, 140, 22, 0.4);
}
.tip-text-premium { margin: 0; font-size: 0.95rem; color: #fa8c16; font-weight: bold; }

.glass-btn-premium {
  width: 100%; height: 50px; border-radius: 12px; border: none; cursor: pointer;
  font-weight: bold; font-size: 1.1rem; transition: all 0.3s;
}
.warning-btn-premium {
  background: #fa8c16; color: white;
  box-shadow: 0 4px 15px rgba(250, 140, 22, 0.3);
}
.warning-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(250, 140, 22, 0.4); }

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
