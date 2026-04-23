<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { store, actions } from '@/core/store.js'

const logContainer = ref(null);

// --- 🖱️ 核心拖拽逻辑 ---
const dragX = ref(0), dragY = ref(0);
const isDragging = ref(false);
let startMouseX = 0, startMouseY = 0, startPosX = 0, startPosY = 0;

const startDrag = (e) => {
  isDragging.value = true;
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  startPosX = dragX.value;
  startPosY = dragY.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  dragX.value = startPosX + (e.clientX - startMouseX);
  dragY.value = startPosY + (e.clientY - startMouseY);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 【视图响应式监听】：终端日志更新时，强制触发微任务实现平滑滚动至底部
watch(() => store.logs.length, async () => {
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
});

onMounted(() => {
    // 初始位置设定在右下角偏上一点
    dragX.value = Math.max(100, window.innerWidth - 750);
    dragY.value = Math.max(100, window.innerHeight - 450);
    
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
});

const clearLogs = () => {
    store.logs = [];
    actions.addLog("底层终端日志已物理清除。", "info");
};
</script>

<template>
  <transition name="modal-scale">
    <div v-if="store.showLogs" 
         class="log-console-floating glass-card"
         :style="{ left: dragX + 'px', top: dragY + 'px' }">
      
      <!-- 拖拽手柄头部 -->
      <div class="log-header-fixed" @mousedown="startDrag">
        <div class="header-left">
          <span class="terminal-icon">📟</span>
          <span class="terminal-title">系统操作日志 (System Runtime Logs)</span>
        </div>
        <div class="header-right">
          <button @click="clearLogs" class="log-action-btn" title="清空日志">🗑️</button>
          <button @click="store.showLogs = false" class="log-action-btn close-btn">✕</button>
        </div>
      </div>

      <!-- 日志主体区 -->
      <div class="log-body-fixed" ref="logContainer">
        <div v-if="store.logs.length === 0" class="empty-log-msg">
          <span class="blink-dot"></span> 等待系统核心指令下达...
        </div>
        <div v-for="(log, idx) in store.logs" :key="idx" class="log-entry">
          <!-- 核心修复：直接显示完整日志，或精准提取消息体 -->
          <span :class="['log-text', { 
            'error': log.includes('ERROR'), 
            'success': log.includes('SUCCESS'),
            'warning': log.includes('SYSTEM')
          }]">{{ log }}</span>
        </div>
        <div class="terminal-cursor">█</div>
      </div>

      <!-- 底部状态装饰 -->
      <div class="log-footer-decoration">
        <span class="status-badge">CONNECTED</span>
        <span class="encoding-badge">UTF-8 / NO-VNC</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* --- 悬浮终端核心样式 --- */
.log-console-floating {
  position: fixed; width: 700px; height: 380px; z-index: 10000;
  display: flex; flex-direction: column; overflow: hidden;
  background: rgba(13, 14, 21, 0.85); backdrop-filter: blur(calc(var(--glass-blur) * 2));
  border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), inset 0 0 1px rgba(255,255,255,0.2);
  transition: box-shadow 0.3s;
}

.log-console-floating:hover { box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8); }

/* --- 拖拽头部 --- */
.log-header-fixed {
  padding: 12px 18px; background: rgba(255, 255, 255, 0.04);
  display: flex; justify-content: space-between; align-items: center;
  cursor: move; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.terminal-icon { font-size: 1.1rem; }
.terminal-title { color: #8892b0; font-size: 0.85rem; font-weight: bold; letter-spacing: 0.5px; }

.log-action-btn {
  background: none; border: none; color: #555; cursor: pointer;
  width: 28px; height: 28px; border-radius: 6px; transition: all 0.2s;
  display: inline-flex; align-items: center; justify-content: center;
}
.log-action-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
.close-btn:hover { background: rgba(245, 74, 69, 0.8) !important; color: white; }

/* --- 日志内容容器 --- */
.log-body-fixed {
  flex: 1; padding: 18px; overflow-y: auto; font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.85rem; line-height: 1.6; color: #acc1da;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.log-body-fixed::-webkit-scrollbar { width: 5px; }
.log-body-fixed::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }

.log-entry { margin-bottom: 6px; display: flex; gap: 10px; opacity: 0.9; }
.log-timestamp { color: #555; flex-shrink: 0; }
.log-text { word-break: break-all; }
.log-text.error { color: #ff5f56; font-weight: bold; }
.log-text.success { color: #27c93f; }
.log-text.warning { color: #feb429; }

.empty-log-msg { color: #444; font-style: italic; display: flex; align-items: center; gap: 8px; }
.blink-dot { width: 6px; height: 6px; background: #555; border-radius: 50%; animation: blink 1s infinite; }

.terminal-cursor { display: inline-block; color: #409eff; animation: blink 1.2s infinite; }

/* --- 底部装饰条 --- */
.log-footer-decoration {
  padding: 5px 15px; background: rgba(0, 0, 0, 0.2);
  display: flex; justify-content: flex-end; gap: 15px;
  font-size: 0.65rem; color: #444; letter-spacing: 1px;
}
.status-badge { color: #27c93f; font-weight: bold; }

/* --- 动画 --- */
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.modal-scale-enter-active, .modal-scale-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-scale-enter-from, .modal-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
