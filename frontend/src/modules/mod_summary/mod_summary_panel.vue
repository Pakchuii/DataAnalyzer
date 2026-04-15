<script setup>
import { store } from '@/core/store.js'
import { watch, ref } from 'vue'

const typedText = ref([]);
const isTyping = ref(false);
let typeInterval = null;

watch(() => store.showAiSummary, (newVal) => {
  if (newVal && store.aiSummaryText.length > 0) {
    typedText.value = [];
    isTyping.value = true;
    let lineIndex = 0, charIndex = 0;

    if (typeInterval) clearInterval(typeInterval);
    typeInterval = setInterval(() => {
      if (lineIndex < store.aiSummaryText.length) {
        const currentLine = store.aiSummaryText[lineIndex];
        if (charIndex < currentLine.length) {
          if (!typedText.value[lineIndex]) typedText.value[lineIndex] = '';
          typedText.value[lineIndex] += currentLine[charIndex];
          charIndex++;
        } else {
          lineIndex++;
          charIndex = 0;
        }
      } else {
        clearInterval(typeInterval);
        isTyping.value = false;
      }
    }, 30);
  }
}, { immediate: true });
</script>

<template>
  <div v-if="store.showAiSummary" class="glass-card result-panel ai-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#b37feb;">🤖 数据解读报告</h3>
    </div>
    <div class="ai-content">
      <p v-for="(line, index) in typedText" :key="index">
        <span v-html="line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></span>
        <span v-if="isTyping && index === typedText.length - 1" class="cursor">|</span>
      </p>
    </div>
  </div>
</template>
