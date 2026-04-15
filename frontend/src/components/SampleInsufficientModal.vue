<script setup>
import { store } from '@/core/store.js'

const closeModal = () => {
    store.showSampleInsufficientModal = false;
};
</script>

<template>
  <div class="modal-overlay" style="z-index: 20000;" @click.self="closeModal">
    <div class="glass-card modal-content" style="max-width: 450px; width: 90%; padding: 40px; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
      <h2 style="color: #fa8c16; margin-top: 0;">机器学习训练受阻</h2>
      <p style="color: #888; line-height: 1.6;">
        由于您选定的特征变量和目标变量存在大量缺失值，或数据量过小，导致过滤后的有效训练样本量不足 <b>(需至少 5 个样本)</b>。
      </p>
      <div class="glass-inner" style="margin: 20px 0; padding: 15px; background: rgba(250, 140, 22, 0.05); border: 1px dashed rgba(250, 140, 22, 0.3);">
        <p style="margin: 0; font-size: 0.9rem; color: #fa8c16;">💡 建议：尝试执行【智能清洗】后再进行建模</p>
      </div>
      <button @click="closeModal" class="glass-btn primary-btn" style="width: 100%; height: 45px; margin-top: 10px; background: #fa8c16; border: none;">返回并调整变量</button>
    </div>
  </div>
</template>
