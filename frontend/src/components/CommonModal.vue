<script setup>
import { store } from '@/core/store.js'

const confirmModal = () => {
    if (store.dialog.onConfirm) store.dialog.onConfirm();
};
</script>

<template>
  <transition name="fade">
    <div v-if="store.dialog.show" class="modal-overlay global-modal-root" style="z-index: 9999;">
      <div class="glass-card modal-container">
        
        <h3 class="modal-title">
          <span v-if="['warning', '退出', '预警', '冲突'].some(k => store.dialog.title.includes(k)) || store.dialog.type === 'confirm'">⚠️</span>
          <span v-else>✨</span>
          {{ store.dialog.title }}
        </h3>

        <p class="modal-message" v-html="store.dialog.message"></p>

        <!-- 输入框模式 -->
        <input 
          v-if="store.dialog.type === 'prompt'" 
          v-model="store.dialog.inputValue" 
          :placeholder="store.dialog.placeholder" 
          class="modal-input"
          @keyup.enter="confirmModal" 
        />

        <!-- 选择模式 (三按钮已简化为双按钮，避免逻辑重复) -->
        <div v-if="store.dialog.type === 'choice'" class="choice-group">
          <button @click="store.dialog.cb1" class="glass-btn danger-btn choice-btn-danger">{{ store.dialog.btn1Text }}</button>
          <button @click="store.dialog.cb2" class="glass-btn secondary-btn choice-btn-secondary">{{ store.dialog.btn2Text }}</button>
        </div>

        <!-- 标准模式 (确定/取消) -->
        <div v-else class="action-footer">
          <button v-if="store.dialog.type !== 'alert'" @click="store.dialog.show = false" class="glass-btn secondary-btn footer-btn">取消</button>
          <button @click="confirmModal" class="glass-btn primary-btn footer-btn">确认</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
}

.modal-container {
  width: 450px;
  max-width: 90vw;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  background: var(--glass-bg, rgba(255, 255, 255, 0.85));
}

.modal-title {
  margin-top: 0;
  color: #fa8c16;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.modal-message {
  color: var(--text-color, #444);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 25px;
  white-space: pre-wrap;
}

.modal-input {
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 25px;
  border-radius: 12px;
  border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.2));
  background: var(--glass-bg, rgba(255, 255, 255, 0.5));
  outline: none;
  color: var(--text-color, #333);
  box-sizing: border-box;
}

.choice-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.choice-btn-primary {
  background: linear-gradient(135deg, #13c2c2, #08979c);
  color: white; border: none; font-weight: bold;
}

.choice-btn-danger {
  background: linear-gradient(135deg, #f5222d, #cf1322);
  color: white; border: none; font-weight: bold;
}

.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.footer-btn {
  padding: 8px 25px;
  border-radius: 10px;
  font-weight: bold;
}

.danger-btn {
  background: #f5222d;
  color: white;
}
</style>
