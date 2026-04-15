<script setup>
import { store, actions } from '@/core/store.js'

defineProps({
  historyLength: Number
});

const emit = defineEmits(['undo', 'addColumn', 'addRow']);

const saveChanges = async (isSilent = false) => {
  if (!store.currentDataFile) return;
  if (store.isNewTable) { 
    await actions.executeBackendSave('new_output', isSilent); 
    return; 
  }
  if (store.isRenamed) {
    actions.openChoice("🔄 智能分发选择", `系统检测到您已将表名修改为 <b>${store.uploadedFileName}</b>。<br><br>您希望如何处理底层物理文件？`, "覆盖并重命名源文件", "存入 outputs 作为新表",
      () => { actions.openConfirm("⚠️ 危险覆盖警告", "这将会修改源文件，请确保检查了没有错误。", () => { actions.executeBackendSave('rename_source', false); }); },
      () => { actions.executeBackendSave('new_output', false); }
    );
    return;
  }
  if (!isSilent) { 
    actions.openConfirm("⚠️ 覆盖警告", "这将会修改源文件，请确保检查了没有错误。", () => { actions.executeBackendSave('overwrite', false); }); 
  } else { 
    await actions.executeBackendSave('overwrite', true); 
  }
};

const exportToLocal = () => {
  if (!store.previewData) return;
  let csvContent = "\uFEFF";
  csvContent += store.previewData.headers.join(",") + "\n";
  store.previewData.rows.forEach(row => {
    const rowData = store.previewData.headers.map(h => { 
      let cell = row[h] === null || row[h] === undefined ? "" : String(row[h]); 
      if (cell.includes(",") || cell.includes("\"") || cell.includes("\n")) cell = `"${cell.replace(/"/g, '""')}"`; 
      return cell; 
    });
    csvContent += rowData.join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a"); 
  const url = URL.createObjectURL(blob); 
  link.setAttribute("href", url); 
  link.setAttribute("download", store.uploadedFileName || "exported_data.csv"); 
  document.body.appendChild(link); 
  link.click(); 
  document.body.removeChild(link);
};
</script>

<template>
  <div class="glass-card module-export-view surgical-console-toolbar">
    <div class="console-left">
      <div class="status-indicator-ring"></div>
      <h2 class="console-title">✨ 数据资产手术台 <span class="sub-label">Data Operating Terminal</span></h2>
    </div>

    <div class="console-right" v-if="store.previewData">
      <!-- 撤销/历史组 -->
      <div class="action-group edit-actions">
        <button @click="emit('undo')" :disabled="historyLength === 0" class="console-btn undo-btn" :title="historyLength > 0 ? '撤销上一步操作' : '无历史操作'">
          <span class="btn-icon">↩️</span> 撤销 ({{ historyLength }})
        </button>
      </div>

      <!-- 结构调整组 -->
      <div class="action-group structure-actions">
        <button @click="emit('addColumn')" class="console-btn secondary-btn">
          <span class="btn-icon">➕</span> 添加新列
        </button>
        <button @click="emit('addRow')" class="console-btn secondary-btn">
          <span class="btn-icon">➕</span> 底部添行
        </button>
      </div>

      <div class="console-divider"></div>

      <!-- 持久化组 -->
      <div class="action-group system-actions">
        <button @click="saveChanges(false)" class="console-btn primary-btn save-btn">
          <span class="btn-icon">💾</span> 同步保存
        </button>
        <button @click="exportToLocal" class="console-btn accent-btn export-btn">
          <span class="btn-icon">⬇️</span> 导出至本地
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.surgical-console-toolbar {
  padding: 12px 25px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.dark-mode .surgical-console-toolbar {
  background: rgba(30, 30, 45, 0.45);
  border-color: rgba(255, 255, 255, 0.1);
}

.console-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-indicator-ring {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #b37feb;
  box-shadow: 0 0 10px rgba(179, 127, 235, 0.6);
  position: relative;
}
.status-indicator-ring::after {
  content: '';
  position: absolute;
  top: -4px; left: -4px; right: -4px; bottom: -4px;
  border-radius: 50%;
  border: 1px solid rgba(179, 127, 235, 0.4);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}

.console-title {
  margin: 0;
  color: #722ed1;
  font-size: 1.35rem;
  letter-spacing: 0.5px;
  display: flex;
  flex-direction: column;
}
.sub-label {
  font-size: 0.75rem;
  opacity: 0.5;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.console-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-group {
  display: flex;
  gap: 10px;
}

.console-divider {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.08);
}
.dark-mode .console-divider {
  background: rgba(255, 255, 255, 0.1);
}

.console-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  border: 1px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}

.console-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.console-btn:active {
  transform: translateY(1px);
}

.undo-btn {
  color: #eb2f96;
  background: rgba(235, 47, 150, 0.05);
  border-color: rgba(235, 47, 150, 0.2);
}

.secondary-btn {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
  border-color: rgba(24, 144, 255, 0.2);
}

.save-btn {
  background: linear-gradient(135deg, #722ed1, #531dab);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
}

.export-btn {
  background: linear-gradient(135deg, #13c2c2, #08979c);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(19, 194, 194, 0.3);
}

.console-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  font-size: 1rem;
}
</style>
