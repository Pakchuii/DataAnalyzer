<script setup>
import { store, actions } from '@/core/store.js'
import { watch, nextTick, ref, onMounted } from 'vue'

watch(() => store.visActiveVars, async () => {
  if(store.showCharts) {
    await nextTick();
    setTimeout(() => { actions.renderCharts(); }, 100);
  }
}, { deep: true });

const dragX = ref(0), dragY = ref(0);
let isDragging = false, startMouseX = 0, startMouseY = 0, startPosX = 0, startPosY = 0;

onMounted(() => {
  dragX.value = Math.max(100, window.innerWidth - 350);
  dragY.value = 150;
});

const startDrag = (e) => {
  isDragging = true; startMouseX = e.clientX; startMouseY = e.clientY; startPosX = dragX.value; startPosY = dragY.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};
const onDrag = (e) => {
  if(!isDragging) return;
  dragX.value = startPosX + (e.clientX - startMouseX);
  dragY.value = startPosY + (e.clientY - startMouseY);
};
const stopDrag = () => {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag);
};
</script>

<template>
  <div v-if="store.showCharts && store.chartsData.length > 0" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#52c41a;">📊 多维数据分布视图</h3>
    </div>
    <div id="charts-area" class="charts-grid-container">
      <div v-for="varName in store.visActiveVars" :key="varName" class="chart-pair-container">
        <div :id="'hist-' + varName" class="chart-box"></div>
        <div :id="'box-' + varName" class="chart-box"></div>
      </div>
    </div>

    <!-- 图表控制浮窗 -->
    <div v-if="store.showVisControl" class="drag-modal glass-card" :style="{ left: dragX + 'px', top: dragY + 'px' }">
      <div class="modal-header" @mousedown="startDrag">
        <span>🎨 图表布局控制</span>
        <button @click="store.showVisControl = false" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.8rem; color: #888; margin-bottom: 10px;">选择要在画布中显示的变量：</p>
        <div class="vis-toggle-list">
          <label v-for="v in store.selectedVars" :key="v" class="vis-toggle-item">
            <input type="checkbox" v-model="store.visActiveVars" :value="v">
            <span>{{ v }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-modal {
  position: fixed;
  width: 280px;
  z-index: 1000;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
}
.modal-header {
  padding: 10px 15px;
  background: rgba(64,158,255,0.2);
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.modal-body {
  padding: 15px;
}
.vis-toggle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.vis-toggle-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
</style>
