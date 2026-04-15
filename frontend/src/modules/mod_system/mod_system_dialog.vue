<script setup>
import { store } from '@/core/store.js'

const confirmModal = () => {
    if (store.dialog.onConfirm) store.dialog.onConfirm();
};
</script>

<template>
  <transition name="fade">
    <div v-if="store.dialog.show" class="modal-overlay global-modal-root" style="z-index: 9999;">
      <div class="glass-card-premium modal-container-premium">
        
        <div class="modal-header-premium">
          <h3 class="modal-title-premium" :class="store.dialog.type === 'confirm' ? 'theme-orange' : 'theme-blue'">
            <span class="icon-sparkle">
              <span v-if="['warning', '退出', '预警', '冲突', '撤销', '解除'].some(k => store.dialog.title.includes(k)) || store.dialog.type === 'confirm'">⚠️</span>
              <span v-else>✨</span>
            </span>
            {{ store.dialog.title }}
          </h3>
        </div>

        <div class="modal-body-premium">
          <p class="modal-message-premium" v-html="store.dialog.message"></p>
          
          <input 
            v-if="store.dialog.type === 'prompt'" 
            v-model="store.dialog.inputValue" 
            :placeholder="store.dialog.placeholder" 
            class="modal-input-premium"
            @keyup.enter="confirmModal" 
          />
        </div>

        <div v-if="store.dialog.type === 'choice'" class="choice-group-premium">
          <button @click="store.dialog.cb1" class="glass-btn-premium danger-btn-premium">{{ store.dialog.btn1Text }}</button>
          <button @click="store.dialog.cb2" class="glass-btn-premium secondary-btn-premium">{{ store.dialog.btn2Text }}</button>
        </div>

        <div v-else class="action-footer-premium">
          <button v-if="store.dialog.type !== 'alert'" @click="store.dialog.show = false" class="glass-btn-premium secondary-btn-premium footer-btn">取消</button>
          <button @click="confirmModal" class="glass-btn-premium primary-btn-premium footer-btn">确定</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
}

.glass-card-premium {
  background: var(--premium-glass-bg);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  border: 1px solid var(--premium-border-color);
  box-shadow: var(--premium-card-shadow);
  color: var(--premium-text-main);
}

.modal-container-premium {
  width: 480px; max-width: 90vw; padding: 40px; border-radius: 24px;
  text-align: center; animation: slideUp 0.3s ease-out;
}

.modal-header-premium { margin-bottom: 25px; }

.modal-title-premium {
  margin: 0; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;
  gap: 12px; padding-bottom: 20px;
  border-bottom: 1px dashed var(--premium-border-color);
  letter-spacing: 1px;
}

.theme-blue { color: #409eff; }
.theme-orange { color: #fa8c16; }
.icon-sparkle { font-size: 1.6rem; }

.modal-body-premium { margin-bottom: 35px; }
.modal-message-premium {
  color: var(--premium-text-main); font-size: 1.1rem; line-height: 1.8;
  margin: 0; white-space: pre-wrap; opacity: 0.9;
}

.modal-input-premium {
  width: 100%; padding: 12px 15px; margin-top: 20px; border-radius: 12px;
  border: 1px solid var(--premium-border-color);
  background: var(--premium-glass-inner);
  color: var(--premium-text-main); outline: none;
  text-align: center; font-size: 1rem;
}

.choice-group-premium, .action-footer-premium { 
  display: flex; justify-content: center; gap: 60px; margin-top: 15px; 
}

.glass-btn-premium {
  border: none; border-radius: 12px; font-weight: bold; cursor: pointer;
  transition: all 0.3s; padding: 12px 25px; font-size: 1.05rem;
  min-width: 180px; letter-spacing: 1px;
}

.primary-btn-premium {
  background: #409eff; color: white;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}
.primary-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4); }

.secondary-btn-premium {
  background: var(--premium-glass-inner);
  color: var(--premium-text-main);
  border: 1px solid var(--premium-border-color);
}
.secondary-btn-premium:hover { transform: translateY(-2px); filter: brightness(1.1); }

.danger-btn-premium {
  background: #f5222d; color: white; box-shadow: 0 4px 15px rgba(245, 34, 45, 0.3);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
