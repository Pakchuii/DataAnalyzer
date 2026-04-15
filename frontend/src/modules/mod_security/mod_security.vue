<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <div class="std-section" v-if="!store.isMasked" style="margin-bottom: 10px;">
    <button @click="actions.triggerMasking" class="glass-btn secondary-btn" style="border-color: #faad14; color: #faad14; background: rgba(250, 173, 20, 0.05);">🔏 启动隐私数据脱敏</button>
  </div>
  <div class="std-section" v-else style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: rgba(250, 173, 20, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(250, 173, 20, 0.5);">
    <span class="success-text" style="color: #faad14; font-size: 0.9rem;">🔒 已开启隐私脱敏</span>
    <button @click="actions.undoMasking" class="glass-btn danger-btn" style="width: auto; padding: 4px 10px; font-size: 0.8rem; border: none; background: rgba(255, 77, 79, 0.1); color: #ff4d4f;">🔓 解除</button>
  </div>
</template>
