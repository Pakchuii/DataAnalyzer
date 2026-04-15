<script setup>
import { store, actions } from '@/core/store.js'
import api from '@/core/api.js'

const createNewTable = () => {
  if (store.previewData) {
    actions.openConfirm("⚠️ 覆盖警告", "已有活跃数据表！新建将丢失未保存的修改，继续吗？", executeCreateNewTable);
  } else {
    executeCreateNewTable();
  }
};

const executeCreateNewTable = () => {
  actions.openPrompt("新建空白数据表", "请输入新建表格的名称：", "New_Dataset", async (tableName) => {
    const filename = `${tableName}.csv`;
    store.uploadedFileName = filename;
    store.currentDataFile = filename;
    store.isNewTable = true;
    store.isRenamed = false;
    store.previewData = { headers: ["字段1", "字段2"], rows: [{"字段1": "", "字段2": ""}] };
    // Trigger save internally or wait for user to save
    await actions.executeBackendSave('new_output', true);
  });
};

const renameCurrentTable = () => {
  actions.openPrompt("重命名数据表", "请输入新的表名 (系统将自动附加 .csv):", store.uploadedFileName.replace('.csv', ''), (newName) => {
    store.uploadedFileName = `${newName.trim()}.csv`;
    store.isRenamed = true;
    if (actions && actions.addLog) actions.addLog(`文件名在内存中已变更为: ${store.uploadedFileName}`, "info");
  });
};

const confirmCloseFile = () => {
  actions.openConfirm("⚠️ 退出确认", "您确定要卸载当前数据表吗？<br><b>未同步的修改将永久丢失！</b>", () => {
    store.previewData = null;
    store.currentDataFile = '';
    store.uploadedFileName = '';
    store.isNewTable = false;
    store.isRenamed = false;
    // reset history stack will be in mod_preview_editor or here if we use global state
  });
};
</script>

<template>
  <div class="module-data-io-view" style="width: 100%;">
    
    <button @click="createNewTable" class="glass-btn hover-scale" style="width: 100%; padding: 10px; border-radius: 12px; color: #52c41a; border: 1px solid rgba(82,196,26,0.4); background: rgba(82,196,26,0.05); margin-bottom: 25px;">📄 新建空白表格</button>

    <div class="dataset-status-box">
      <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.8;">🗂️</div>
      <p style="color: var(--text-color, #666); font-size: 0.95rem; text-align: center; margin: 0; font-weight: bold;">当前活跃数据集：</p>

      <template v-if="store.uploadedFileName">
        <div style="display: flex; align-items: center; gap: 8px; margin: 10px 0 20px 0;">
          <p style="color: #fa8c16; font-weight: bold; text-align: center; margin: 0; word-break: break-all; font-size: 1.1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            {{ store.uploadedFileName }}
          </p>
          <button @click="renameCurrentTable" class="rename-btn">✏️</button>
        </div>

        <button @click="confirmCloseFile" class="glass-btn hover-scale unload-btn">⏹️ 退出释放内存</button>
      </template>

      <template v-else>
        <p style="color: #999; margin: 10px 0 0 0; text-align: center;">未载入任何数据</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.rename-btn {
  background: none; border: none; cursor: pointer; font-size: 1.2rem; filter: grayscale(100%); opacity: 0.7; transition: all 0.2s;
}
.rename-btn:hover {
  opacity: 1; transform: scale(1.1);
}
.unload-btn {
  padding: 8px 20px; border-radius: 20px; color: #ff4d4f; border: 1px solid rgba(245,34,45,0.3); background: rgba(245,34,45,0.05); font-size: 0.9rem; font-weight: bold;
}

.dataset-status-box {
  position: relative; flex: 1; width: 100%; min-height: 180px;
  background: var(--glass-bg, rgba(0,0,0,0.05)); border-radius: 16px; padding: 20px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px dashed var(--glass-border, rgba(0,0,0,0.15));
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
