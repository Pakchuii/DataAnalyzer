<script setup>
import { actions } from '@/core/store.js'

/**
 * 【积木名：全局系统退出组件】
 * 统一封装“返回枢纽”逻辑，支持跨系统复用与安全拦截。
 */
</script>

<template>
  <button @click="actions.requestExitToPortal" class="glass-btn primary-btn mod-exit-btn">
    ⬅️ 返回时空枢纽
  </button>
</template>

<style scoped>
.mod-exit-btn {
  width: 100%;
  padding: 12px;
  margin-bottom: 25px;
  border-radius: 30px;
  font-weight: bold;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(24,144,255,0.3);
  transition: all 0.3s;
}

.mod-exit-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(24,144,255,0.5);
  filter: brightness(1.1);
}

.mod-exit-btn:active {
  transform: translateY(1px) scale(0.98);
}
</style>
