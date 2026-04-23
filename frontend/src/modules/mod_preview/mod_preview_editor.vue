<script setup>
import { store, actions } from '@/core/store.js'
import { ref, computed, watch } from 'vue'
import PagedTable from './mod_preview_paged_table.vue'

const historyStack = ref([]);
let tempSnapshot = null;

const captureHistory = () => { if (store.previewData) tempSnapshot = JSON.parse(JSON.stringify(store.previewData)); };
const commitHistory = () => { if (tempSnapshot) { historyStack.value.push(tempSnapshot); if (historyStack.value.length > 30) historyStack.value.shift(); tempSnapshot = null; } };
const pushDirectHistory = () => { if (!store.previewData) return; historyStack.value.push(JSON.parse(JSON.stringify(store.previewData))); if (historyStack.value.length > 30) historyStack.value.shift(); };
const undoAction = () => { if (historyStack.value.length === 0) return; store.previewData = historyStack.value.pop(); if (actions && actions.addLog) actions.addLog("⏪ 已回溯至上一步骤", "info"); };

defineExpose({ undo: undoAction, addColumn, addNewRow, historyLength: computed(() => historyStack.value.length) });

const searchColumn = ref('');
const searchQuery = ref('');

const filteredRows = computed(() => {
  if (!store.previewData || !store.previewData.rows) return [];
  if (!searchQuery.value) return store.previewData.rows;
  const q = searchQuery.value.toLowerCase();
  return store.previewData.rows.filter(row => {
    if (searchColumn.value) {
      const cellVal = row[searchColumn.value];
      return cellVal !== null && cellVal !== undefined && String(cellVal).toLowerCase().includes(q);
    }
    return Object.values(row).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q));
  });
});

function addColumn() {
  if (!store.previewData) return;
  actions.openPrompt("添加新特征列", "请输入新列的表头名称：", "例如：手机号码", (colName) => {
    if (store.previewData.headers.includes(colName)) return;
    pushDirectHistory();
    store.previewData.headers.push(colName);
    store.previewData.rows.forEach(row => { row[colName] = ""; });
  });
}

function deleteColumn(idx) {
  if (!store.previewData) return;
  const colName = store.previewData.headers[idx];
  actions.openConfirm("危险操作确认", `确定删除整列 <b>【${colName}】</b> 及其数据吗？`, () => {
    pushDirectHistory();
    store.previewData.headers.splice(idx, 1);
    store.previewData.rows.forEach(row => { delete row[colName]; });
    if(searchColumn.value === colName) searchColumn.value = '';
  });
}

function addNewRow() {
  if (!store.previewData) return;
  pushDirectHistory();
  const newRow = {};
  store.previewData.headers.forEach(h => newRow[h] = "");
  store.previewData.rows.push(newRow);
  searchQuery.value = '';
}

function deleteRow(targetRow) {
  if (!store.previewData) return;
  pushDirectHistory();
  const realIndex = store.previewData.rows.indexOf(targetRow);
  if (realIndex !== -1) store.previewData.rows.splice(realIndex, 1);
}

// Reset history when file changes
watch(() => store.currentDataFile, () => {
  historyStack.value = [];
});
</script>

<template>
  <div class="module-preview-editor" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
    
    <!-- 搜索栏 (集成到编辑器上方) -->
    <div class="glass-card search-bar" v-if="store.previewData" style="margin-bottom: 20px; padding: 15px; border-radius: 12px; display: flex; gap: 15px; align-items: center;">
      <div style="width: 200px;">
        <select v-model="searchColumn" class="glass-btn search-select">
          <option value="">🌐 全局跨列检索</option>
          <option v-for="col in store.previewData.headers" :key="col" :value="col">📌 限定列: {{ col }}</option>
        </select>
      </div>
      <div style="flex: 1; position: relative;">
        <input v-model="searchQuery" :placeholder="searchColumn ? `正在 [${searchColumn}] 中搜索...` : '输入关键字全局过滤...'" class="search-input" />
        <span class="search-icon">🔎</span>
      </div>
    </div>

    <div class="glass-card table-container" style="flex: 1; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; padding: 0;">
      <div v-if="!store.previewData" class="empty-placeholder">
        <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">📭</div>
        <h3 style="margin: 0 0 10px 0;">数据区暂无信号接入</h3>
      </div>

      <div v-else style="flex: 1; overflow: auto; padding: 20px; display: flex; flex-direction: column;">
        <!-- 使用分页表格组件替代原始全量渲染 -->
        <PagedTable
          :filteredRows="filteredRows"
          @captureHistory="captureHistory"
          @commitHistory="commitHistory"
          @deleteRow="deleteRow"
          @deleteColumn="deleteColumn"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-select {
  width: 100%; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); background: var(--glass-bg, rgba(255,255,255,0.3)); color: var(--text-color, #333); outline: none; font-size: 0.9rem; font-weight: bold; cursor: pointer;
}
.search-input {
  width: 100%; padding: 12px 15px 12px 40px; border-radius: 16px; border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); background: var(--glass-bg, rgba(255,255,255,0.3)); color: var(--text-color, #333); outline: none; transition: all 0.3s; box-sizing: border-box;
}
.search-icon {
  position: absolute; left: 12px; top: 12px; filter: grayscale(100%); opacity: 0.6;
}
.empty-placeholder {
  flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: var(--text-color, #aaa);
}
</style>
