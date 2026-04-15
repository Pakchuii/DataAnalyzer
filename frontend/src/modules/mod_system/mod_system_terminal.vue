<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { store } from '@/core/store.js'

const logContainer = ref(null);

// 【视图响应式监听】：终端日志更新时，强制触发微任务实现平滑滚动至底部
watch(() => store.logs.length, async () => {
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
});

onMounted(() => {
    // 初始滚动
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
});
</script>

<template>
  <transition name="slide-up">
    <div v-if="store.showLogs" class="log-console-panel-premium">
      <div class="log-header-premium">
        <span>📟 终端监控台 (Terminal)</span>
        <button @click="store.showLogs = false" class="close-log-btn-premium">✕</button>
      </div>
      <div class="log-body-premium" ref="logContainer">
        <div v-if="store.logs.length === 0" class="empty-log-text">系统就绪，等待指令...</div>
        <div v-for="(log, idx) in store.logs" :key="idx" class="log-line">
          <span v-if="log.includes('[ERROR]')" class="log-error">{{ log }}</span>
          <span v-else-if="log.includes('[SUCCESS]')" class="log-success">{{ log }}</span>
          <span v-else class="log-info">{{ log }}</span>
        </div>
        <div class="blinking-cursor">_</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.log-console-panel-premium {
  position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%);
  width: 900px; max-width: 95vw; height: 320px;
  background: rgba(10, 10, 15, 0.9); backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1); border-top: 3px solid #409eff;
  border-radius: 12px 12px 0 0; z-index: 2000;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
}

.log-header-premium {
  padding: 12px 20px; background: rgba(255, 255, 255, 0.05);
  display: flex; justify-content: space-between; align-items: center;
  color: #aaa; font-size: 0.9rem; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.log-body-premium {
  flex: 1; padding: 20px; overflow-y: auto; font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.9rem; line-height: 1.6;
}
.log-body-premium::-webkit-scrollbar { width: 6px; }
.log-body-premium::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }

.log-line { margin-bottom: 6px; white-space: pre-wrap; word-break: break-all; }
.log-error { color: #ff4d4f; }
.log-success { color: #52c41a; }
.log-info { color: #ccc; }
.empty-log-text { color: #666; font-style: italic; }

.close-log-btn-premium { background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem; }
.close-log-btn-premium:hover { color: #ff4d4f; }

.blinking-cursor { display: inline-block; width: 8px; background-color: #409eff; animation: blink 1s infinite; margin-left: 5px; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }
</style>
