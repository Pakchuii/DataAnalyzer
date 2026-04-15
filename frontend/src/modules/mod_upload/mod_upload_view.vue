<script setup>
import { store, actions } from '@/core/store.js'
import api from '@/core/api.js'
import { ref } from 'vue'

const isDragging = ref(false);
const fileInput = ref(null);

const handleDragOver = () => { isDragging.value = true; };
const handleDragLeave = () => { isDragging.value = false; };

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (!file) return;
  triggerUpload(file);
};

const handleFileSelect = (event) => {
  const inputTarget = event.target;
  const file = inputTarget.files[0];
  if (!file) return;
  triggerUpload(file, inputTarget);
};

const triggerUpload = (file, inputTarget = null) => {
  if (store.previewData) {
    actions.openConfirm("⚠️ 覆盖警告", `当前正在编辑表 <b>${store.uploadedFileName}</b>！<br>强制载入将丢失未保存的修改，是否覆盖？`, () => {
      uploadFileToServer(file, inputTarget);
    });
  } else {
    uploadFileToServer(file, inputTarget);
  }
};

const uploadFileToServer = async (file, inputTarget) => {
  const formData = new FormData();
  formData.append('file', file);
  if (actions && actions.addLog) actions.addLog(`[System] 正在上传并注册数据集: ${file.name}...`, "info");
  
  try {
    const res = await api.post('/api/upload', formData);
    if (res.data && res.data.status === 'success' && res.data.data) {
      const fileInfo = res.data.data;
      const dataRes = await api.post('/api/data/get_full', { filename: fileInfo.filename });
      if (dataRes.data.status === 'success') {
        const tempHeaders = dataRes.data.headers;
        const tempRows = dataRes.data.rows;
        const rCount = tempRows.length;
        const cCount = tempHeaders.length;

        const proceedWithRender = () => {
          store.fileInfo = fileInfo;
          store.currentDataFile = fileInfo.filename;
          store.uploadedFileName = file.name;
          store.isNewTable = false;
          store.isRenamed = false;
          // Note: historyStack and search logic will be in mod_preview_editor
          store.previewData = { headers: tempHeaders, rows: tempRows };
          if (actions && actions.addLog) actions.addLog("[Success] 数据源已无缝装载至手术台！", "success");
        };

        const abortRender = () => { if (actions && actions.addLog) actions.addLog("[System] 用户已主动拦截超大体积数据集的渲染", "warning"); };
        
        if (rCount * cCount > 1500) {
          actions.openChoice("⚠️ 性能降级预警", `您导入的数据集包含 <b>${rCount}</b> 行和 <b>${cCount}</b> 列。<br><br><span style="color:#f5222d;">系统探针检测到数据矩阵过于庞大。在前端强制渲染该表格可能会导致您的浏览器严重卡顿或假死。</span><br><br>您是否确认要继续在手术台中加载此表格？`, "放弃加载并释放内存", "确认风险，强行加载", abortRender, proceedWithRender, abortRender);
        } else {
          proceedWithRender();
        }
      } else {
        throw new Error(dataRes.data.message || "拉取底层文件内容失败");
      }
    } else {
      throw new Error(res.data.message || "上传接口返回格式不匹配");
    }
  } catch (err) {
    console.error(err);
    actions.openAlert("上传失败", `数据流交互异常。<br><span style="font-size:0.8rem;color:#f5222d;">${err.message || '网络连接被拒绝'}</span>`);
  } finally {
    if (inputTarget) inputTarget.value = '';
  }
};
</script>

<template>
  <div
    class="glass-card module-upload-view"
    :class="{ 'drag-over': isDragging }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    style="width: 100%; display: flex; flex-direction: column; padding: 20px; border-radius: 16px; transition: all 0.3s; position: relative; margin-bottom: 25px;"
  >
    <!-- 拖拽覆盖层 -->
    <div v-if="isDragging" class="drag-overlay">
      <div style="font-size: 3rem; margin-bottom: 10px;">📥</div>
      <h3 style="color: #1890ff; margin: 0;">松开鼠标覆盖数据</h3>
    </div>

    <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv, .xlsx, .xls" style="display: none;" />

    <div style="display: flex; gap: 10px;">
      <button @click="fileInput.click()" class="glass-btn hover-scale" style="flex: 1; padding: 10px; border-radius: 12px; color: #1890ff; border: 1px solid rgba(24,144,255,0.4); background: rgba(24,144,255,0.05);">📁 导入表格</button>
    </div>
  </div>
</template>

<style scoped>
.drag-overlay {
  position: absolute; top: 0; left: 0; 
  width: 100%; height: 100%; 
  background: rgba(24,144,255,0.15); 
  border: 3px dashed #1890ff; 
  border-radius: 16px; 
  display: flex; flex-direction: column; justify-content: center; align-items: center; 
  z-index: 50; pointer-events: none;
}
.drag-over {
  box-shadow: 0 0 20px rgba(24,144,255,0.3);
  transform: scale(1.02);
}
</style>
