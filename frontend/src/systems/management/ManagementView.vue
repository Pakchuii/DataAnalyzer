<template>
  <div class="unified-editor-container" style="display: flex; width: 100%; height: 100%; padding: 20px; box-sizing: border-box; background: rgba(0,0,0,0.3);">

    <div
      class="glass-card editor-sidebar"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      style="width: 300px; display: flex; flex-direction: column; padding: 20px; margin-right: 20px; border-radius: 16px; transition: all 0.3s; position: relative;"
    >
      <div v-if="isDragging" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(24,144,255,0.15); border: 3px dashed #1890ff; border-radius: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 50; pointer-events: none;">
        <div style="font-size: 4rem; margin-bottom: 10px;">📥</div>
        <h3 style="color: #1890ff; margin: 0; text-shadow: 0 2px 10px rgba(255,255,255,0.5);">松开鼠标覆盖数据</h3>
      </div>

      <button @click="store.currentModule = 'portal'" class="glass-btn primary-btn hover-scale" style="width: 100%; padding: 12px; margin-bottom: 25px; border-radius: 30px; font-weight: bold; background: linear-gradient(135deg, #1890ff, #096dd9); color: white; border: none; box-shadow: 0 4px 15px rgba(24,144,255,0.3);">
        ⬅️ 返回时空枢纽
      </button>

      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv, .xlsx, .xls" style="display: none;" />

      <div style="display: flex; gap: 10px; margin-bottom: 25px;">
        <button @click="$refs.fileInput.click()" class="glass-btn hover-scale" style="flex: 1; padding: 10px; border-radius: 12px; color: #1890ff; border: 1px solid rgba(24,144,255,0.4); background: rgba(24,144,255,0.05);">📁 导入表格</button>
        <button @click="createNewTable" class="glass-btn hover-scale" style="flex: 1; padding: 10px; border-radius: 12px; color: #52c41a; border: 1px solid rgba(82,196,26,0.4); background: rgba(82,196,26,0.05);">📄 新建空白</button>
      </div>

      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-color, #eee); font-weight: bold;">🔍 高级数据检索</p>
        </div>

        <div style="margin-bottom: 10px;" v-if="store.previewData">
          <select
            v-model="searchColumn"
            class="glass-btn"
            style="width: 100%; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); background: var(--glass-bg, rgba(255,255,255,0.3)); color: var(--text-color, #333); outline: none; font-size: 0.9rem; font-weight: bold; cursor: pointer;"
          >
            <option value="">🌐 全局跨列检索</option>
            <option v-for="col in store.previewData.headers" :key="col" :value="col">📌 限定列: {{ col }}</option>
          </select>
        </div>

        <div style="position: relative;">
          <input
            v-model="searchQuery"
            :placeholder="searchColumn ? `正在 [${searchColumn}] 中搜索...` : '输入关键字全局过滤...'"
            style="width: 100%; padding: 12px 15px 12px 35px; border-radius: 16px; border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); background: var(--glass-bg, rgba(255,255,255,0.3)); color: var(--text-color, #333); outline: none; transition: all 0.3s;"
          />
          <span style="position: absolute; left: 12px; top: 12px; filter: grayscale(100%); opacity: 0.6;">🔎</span>
        </div>
      </div>

      <div style="flex: 1; background: var(--glass-bg, rgba(0,0,0,0.05)); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed var(--glass-border, rgba(0,0,0,0.15));">
        <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.8;">🗂️</div>
        <p style="color: var(--text-color, #666); font-size: 0.95rem; text-align: center; margin: 0; font-weight: bold;">当前活跃数据集：</p>

        <template v-if="store.uploadedFileName">
          <div style="display: flex; align-items: center; gap: 8px; margin: 10px 0 20px 0;">
            <p style="color: #fa8c16; font-weight: bold; text-align: center; margin: 0; word-break: break-all; font-size: 1.1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              {{ store.uploadedFileName }}
            </p>
            <button @click="renameCurrentTable" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; filter: grayscale(100%); opacity: 0.7; transition: all 0.2s;" onmouseover="this.style.opacity='1'; this.style.transform='scale(1.1)';" onmouseout="this.style.opacity='0.7'; this.style.transform='scale(1)';">✏️</button>
          </div>

          <button @click="confirmCloseFile" class="glass-btn hover-scale" style="padding: 8px 20px; border-radius: 20px; color: #ff4d4f; border: 1px solid rgba(245,34,45,0.3); background: rgba(245,34,45,0.05); font-size: 0.9rem; font-weight: bold;">⏹️ 退出释放内存</button>
        </template>

        <template v-else>
          <p style="color: #999; margin: 10px 0 0 0; text-align: center;">未载入任何数据</p>
        </template>
      </div>
    </div>

    <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; gap: 20px;">

      <div class="glass-card" style="padding: 15px 25px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <h2 style="margin: 0; color: #b37feb; font-size: 1.4rem;">✨ 数据资产手术台</h2>
        </div>

        <div style="display: flex; gap: 12px;" v-if="store.previewData">
          <button @click="undoAction" :disabled="historyStack.length === 0" class="glass-btn hover-scale" :style="{ opacity: historyStack.length === 0 ? 0.5 : 1, cursor: historyStack.length === 0 ? 'not-allowed' : 'pointer', borderRadius: '20px', padding: '8px 15px', color: '#eb2f96', border: '1px solid rgba(235,47,150,0.3)', background: 'rgba(235,47,150,0.05)' }">
            ↩️ 撤销 ({{ historyStack.length }})
          </button>
          <button @click="addColumn" class="glass-btn hover-scale" style="border-radius: 20px; padding: 8px 15px; color: #1890ff; border: 1px solid rgba(24,144,255,0.3); background: rgba(24,144,255,0.05);">➕ 添加新列</button>
          <button @click="addNewRow" class="glass-btn hover-scale" style="border-radius: 20px; padding: 8px 15px; color: #52c41a; border: 1px solid rgba(82,196,26,0.3); background: rgba(82,196,26,0.05);">➕ 底部添行</button>

          <div style="width: 1px; background: var(--glass-border, rgba(0,0,0,0.1)); margin: 0 5px;"></div>

          <button @click="saveChanges(false)" class="glass-btn primary-btn hover-scale" style="border-radius: 20px; padding: 8px 18px; background: linear-gradient(135deg, #722ed1, #531dab); color: white; border: none; box-shadow: 0 4px 10px rgba(114,46,209,0.3);">💾 同步保存</button>
          <button @click="exportToLocal" class="glass-btn primary-btn hover-scale" style="border-radius: 20px; padding: 8px 18px; background: linear-gradient(135deg, #13c2c2, #08979c); color: white; border: none; box-shadow: 0 4px 10px rgba(19,194,194,0.3);">⬇️ 导出至本地</button>
        </div>
      </div>

      <div class="glass-card" style="flex: 1; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; padding: 0;">
        <div v-if="!store.previewData" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: var(--text-color, #aaa);">
          <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">📭</div>
          <h3 style="margin: 0 0 10px 0;">数据区暂无信号接入</h3>
        </div>

        <div v-else style="flex: 1; overflow: auto; padding: 20px;">
          <table class="glass-table" style="width: 100%; white-space: nowrap; border-collapse: separate; border-spacing: 0;">
            <thead style="position: sticky; top: 0; z-index: 10;">
              <tr>
                <th style="width: 60px; text-align: center; border-radius: 12px 0 0 0; background: var(--glass-bg, rgba(255,255,255,0.8)); backdrop-filter: blur(10px); padding: 15px; border-right: 1px solid var(--glass-border, rgba(0,0,0,0.05));">操作</th>
                <th style="width: 60px; text-align: center; background: var(--glass-bg, rgba(255,255,255,0.8)); backdrop-filter: blur(10px); color: #888; border-right: 1px solid var(--glass-border, rgba(0,0,0,0.05));"># 行号</th>

                <th v-for="(col, idx) in store.previewData.headers" :key="idx" style="background: var(--glass-bg, rgba(255,255,255,0.8)); backdrop-filter: blur(10px); padding: 10px 15px; border-right: 1px solid var(--glass-border, rgba(0,0,0,0.05));">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <input v-model="store.previewData.headers[idx]" @focus="captureHistory" @change="commitHistory" style="background:transparent; border:none; color:var(--text-color, #333); font-weight:bold; width:100%; min-width:80px; outline:none; border-bottom: 1px dashed rgba(0,0,0,0.1);" title="编辑列名"/>
                    <button @click="deleteColumn(idx)" style="background: rgba(245,34,45,0.1); border: none; color: #ff4d4f; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#ff4d4f'; this.style.color='#fff';" onmouseout="this.style.background='rgba(245,34,45,0.1)'; this.style.color='#ff4d4f';">✕</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIdx) in filteredRows" :key="rIdx" class="table-row-hover" style="transition: all 0.2s;">
                <td style="text-align: center; padding: 8px; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05));">
                  <button @click="deleteRow(row)" style="background: rgba(245,34,45,0.05); border: 1px solid rgba(245,34,45,0.3); color: #ff4d4f; border-radius: 8px; cursor: pointer; padding: 6px 12px; font-size: 0.85rem;" onmouseover="this.style.background='#ff4d4f'; this.style.color='#fff';" onmouseout="this.style.background='rgba(245,34,45,0.05)'; this.style.color='#ff4d4f';">删除</button>
                </td>
                <td style="text-align: center; color: var(--text-color, #888); font-family: monospace; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05));">{{ store.previewData.rows.indexOf(row) + 1 }}</td>
                <td v-for="(col, cIdx) in store.previewData.headers" :key="cIdx" style="padding: 0; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05));">
                  <input v-model="row[col]" @focus="captureHistory" @change="commitHistory" style="width: 100%; height: 100%; padding: 12px 15px; border: none; background: transparent; color: var(--text-color, #444); font-family: inherit; font-size: 0.95rem; outline: none; box-sizing: border-box;" onfocus="this.style.background='var(--glass-bg, rgba(255,255,255,0.5))'; this.style.boxShadow='inset 0 -2px 0 #fa8c16';" onblur="this.style.background='transparent'; this.style.boxShadow='none';" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="customModal.show" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 9999; display: flex; justify-content: center; align-items: center;">
        <div class="glass-card" style="width: 450px; max-width: 90vw; padding: 30px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); background: var(--glass-bg, rgba(255,255,255,0.85));">

          <h3 style="margin-top: 0; color: #fa8c16; display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
            <span v-if="customModal.title.includes('警告') || customModal.title.includes('退出') || customModal.title.includes('预警') || customModal.title.includes('冲突')">⚠️</span>
            <span v-else>✨</span>
            {{ customModal.title }}
          </h3>

          <p style="color: var(--text-color, #444); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px;" v-html="customModal.message"></p>

          <input v-if="customModal.type === 'prompt'" v-model="customModal.inputValue" :placeholder="customModal.placeholder" style="width: 100%; padding: 12px 15px; margin-bottom: 25px; border-radius: 12px; border: 1px solid var(--glass-border, rgba(0,0,0,0.2)); background: var(--glass-bg, rgba(255,255,255,0.5)); outline: none; color: var(--text-color, #333);" @keyup.enter="confirmModal" />

          <div v-if="customModal.type === 'choice'" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
            <button @click="customModal.cb2" class="glass-btn primary-btn hover-scale" style="width: 100%; padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #13c2c2, #08979c); color: white; border: none; font-size: 1rem; box-shadow: 0 4px 10px rgba(19,194,194,0.3); font-weight: bold;">{{ customModal.btn2Text }}</button>
            <button @click="customModal.cb1" class="glass-btn primary-btn hover-scale" style="width: 100%; padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #f5222d, #cf1322); color: white; border: none; font-size: 1rem; box-shadow: 0 4px 10px rgba(245,34,45,0.3); font-weight: bold;">{{ customModal.btn1Text }}</button>
            <button @click="customModal.cbCancel" class="glass-btn hover-scale" style="width: 100%; padding: 12px; border-radius: 12px; color: var(--text-color, #666); background: transparent; border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); font-size: 1rem;">取消操作并返回</button>
          </div>

          <div v-else style="display: flex; justify-content: flex-end; gap: 15px;">
            <button v-if="customModal.type !== 'alert'" @click="customModal.show = false" class="glass-btn hover-scale" style="padding: 8px 20px; border-radius: 10px; color: var(--text-color, #666); background: transparent; border: 1px solid var(--glass-border, rgba(0,0,0,0.1));">取消</button>
            <button @click="confirmModal" class="glass-btn primary-btn hover-scale" style="padding: 8px 25px; border-radius: 10px; background: linear-gradient(135deg, #1890ff, #096dd9); color: white; border: none; box-shadow: 0 4px 10px rgba(24,144,255,0.4); font-weight: bold;">确认</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { store, actions } from '@/core/store.js';
import api from '@/core/api.js';

const historyStack = ref([]);
let tempSnapshot = null;

const captureHistory = () => { if (store.previewData) tempSnapshot = JSON.parse(JSON.stringify(store.previewData)); };
const commitHistory = () => { if (tempSnapshot) { historyStack.value.push(tempSnapshot); if (historyStack.value.length > 30) historyStack.value.shift(); tempSnapshot = null; } };
const pushDirectHistory = () => { if (!store.previewData) return; historyStack.value.push(JSON.parse(JSON.stringify(store.previewData))); if (historyStack.value.length > 30) historyStack.value.shift(); };
const undoAction = () => { if (historyStack.value.length === 0) return; store.previewData = historyStack.value.pop(); if (actions && actions.addLog) actions.addLog("⏪ 已回溯至上一步骤", "info"); };

const customModal = ref({ show: false, type: 'alert', title: '', message: '', inputValue: '', placeholder: '', callback: null, cb1: null, cb2: null, cbCancel: null, btn1Text: '', btn2Text: '' });

const openAlert = (title, message) => { customModal.value.show = false; setTimeout(() => { customModal.value = { show: true, type: 'alert', title, message }; }, 50); };
const openConfirm = (title, message, callback) => { customModal.value.show = false; setTimeout(() => { customModal.value = { show: true, type: 'confirm', title, message, callback }; }, 50); };
const openPrompt = (title, message, placeholder, callback) => { customModal.value.show = false; setTimeout(() => { customModal.value = { show: true, type: 'prompt', title, message, placeholder, inputValue: '', callback }; }, 50); };

const openChoice = (title, message, btn1Text, btn2Text, cb1, cb2, cbCancel = null) => {
  customModal.value.show = false;
  setTimeout(() => {
    customModal.value = {
      show: true, type: 'choice', title, message, btn1Text, btn2Text,
      cb1: () => { customModal.value.show = false; setTimeout(cb1, 50); },
      cb2: () => { customModal.value.show = false; setTimeout(cb2, 50); },
      cbCancel: () => { customModal.value.show = false; setTimeout(cbCancel || (() => {}), 50); }
    };
  }, 50);
};

const confirmModal = () => {
  const cb = customModal.value.callback;
  const type = customModal.value.type;
  let val = customModal.value.inputValue;
  const placeholder = customModal.value.placeholder;
  customModal.value.show = false;
  setTimeout(() => {
    if (cb) {
      if (type === 'prompt') {
        val = val ? val.trim() : '';
        if (!val && placeholder) val = placeholder.replace('例如：', '').trim();
        if (val) cb(val);
      } else { cb(); }
    }
  }, 50);
};

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

const isDragging = ref(false);
const handleDragOver = () => { isDragging.value = true; };
const handleDragLeave = () => { isDragging.value = false; };
const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (store.previewData) { openConfirm("⚠️ 覆盖警告", `当前正在编辑表 <b>${store.uploadedFileName}</b>！<br>强制载入将丢失未保存的修改，是否覆盖？`, () => { uploadFileToServer(file, null); }); } else { uploadFileToServer(file, null); }
};
const handleFileSelect = (event) => {
  const inputTarget = event.target;
  const file = inputTarget.files[0];
  if (!file) return;
  if (store.previewData) { openConfirm("⚠️ 覆盖警告", `当前正在编辑表 <b>${store.uploadedFileName}</b>！<br>强制载入将丢失未保存的修改，是否覆盖？`, () => { uploadFileToServer(file, inputTarget); }); } else { uploadFileToServer(file, inputTarget); }
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
          store.fileInfo = fileInfo; store.currentDataFile = fileInfo.filename; store.uploadedFileName = file.name;
          store.isNewTable = false; store.isRenamed = false; historyStack.value = []; searchColumn.value = '';
          store.previewData = { headers: tempHeaders, rows: tempRows };
          if (actions && actions.addLog) actions.addLog("[Success] 数据源已无缝装载至手术台！", "success");
        };
        const abortRender = () => { if (actions && actions.addLog) actions.addLog("[System] 用户已主动拦截超大体积数据集的渲染", "warning"); };
        if (rCount * cCount > 1500) {
          openChoice("⚠️ 性能降级预警", `您导入的数据集包含 <b>${rCount}</b> 行和 <b>${cCount}</b> 列。<br><br><span style="color:#f5222d;">系统探针检测到数据矩阵过于庞大。在前端强制渲染该表格可能会导致您的浏览器严重卡顿或假死。</span><br><br>您是否确认要继续在手术台中加载此表格？`, "放弃加载并释放内存", "确认风险，强行加载", abortRender, proceedWithRender, abortRender);
        } else { proceedWithRender(); }
      } else { throw new Error(dataRes.data.message || "拉取底层文件内容失败"); }
    } else { throw new Error(res.data.message || "上传接口返回格式不匹配"); }
  } catch (err) { console.error(err); openAlert("上传失败", `数据流交互异常。<br><span style="font-size:0.8rem;color:#f5222d;">${err.message || '网络连接被拒绝'}</span>`); }
  finally { if (inputTarget) inputTarget.value = ''; }
};

const confirmCloseFile = () => { openConfirm("⚠️ 退出确认", "您确定要卸载当前数据表吗？<br><b>未同步的修改将永久丢失！</b>", () => { store.previewData = null; store.currentDataFile = ''; store.uploadedFileName = ''; store.isNewTable = false; store.isRenamed = false; historyStack.value = []; searchColumn.value = ''; }); };
const renameCurrentTable = () => { openPrompt("重命名数据表", "请输入新的表名 (系统将自动附加 .csv):", store.uploadedFileName.replace('.csv', ''), (newName) => { store.uploadedFileName = `${newName.trim()}.csv`; store.isRenamed = true; if (actions && actions.addLog) actions.addLog(`文件名在内存中已变更为: ${store.uploadedFileName}`, "info"); }); };
const createNewTable = () => { if (store.previewData) openConfirm("⚠️ 覆盖警告", "已有活跃数据表！新建将丢失未保存的修改，继续吗？", executeCreateNewTable); else executeCreateNewTable(); };
const executeCreateNewTable = () => { openPrompt("新建空白数据表", "请输入新建表格的名称：", "New_Dataset", async (tableName) => { const filename = `${tableName}.csv`; store.uploadedFileName = filename; store.currentDataFile = filename; store.isNewTable = true; store.isRenamed = false; historyStack.value = []; searchColumn.value = ''; store.previewData = { headers: ["字段1", "字段2"], rows: [{"字段1": "", "字段2": ""}] }; await saveChanges(true); }); };

const addColumn = () => { if (!store.previewData) return; openPrompt("添加新特征列", "请输入新列的表头名称：", "例如：手机号码", (colName) => { if (store.previewData.headers.includes(colName)) return; pushDirectHistory(); store.previewData.headers.push(colName); store.previewData.rows.forEach(row => { row[colName] = ""; }); }); };
const deleteColumn = (idx) => { if (!store.previewData) return; const colName = store.previewData.headers[idx]; openConfirm("危险操作确认", `确定删除整列 <b>【${colName}】</b> 及其数据吗？`, () => { pushDirectHistory(); store.previewData.headers.splice(idx, 1); store.previewData.rows.forEach(row => { delete row[colName]; }); if(searchColumn.value === colName) searchColumn.value = ''; }); };
const addNewRow = () => { if (!store.previewData) return; pushDirectHistory(); const newRow = {}; store.previewData.headers.forEach(h => newRow[h] = ""); store.previewData.rows.push(newRow); searchQuery.value = ''; };
const deleteRow = (targetRow) => { if (!store.previewData) return; pushDirectHistory(); const realIndex = store.previewData.rows.indexOf(targetRow); if (realIndex !== -1) store.previewData.rows.splice(realIndex, 1); };

const saveChanges = async (isSilent = false) => {
  if (!store.currentDataFile) return;
  if (store.isNewTable) { executeBackendSave('new_output', isSilent); return; }
  if (store.isRenamed) {
    openChoice("🔄 智能分发选择", `系统检测到您已将表名修改为 <b>${store.uploadedFileName}</b>。<br><br>您希望如何处理底层物理文件？`, "覆盖并重命名源文件", "存入 outputs 作为新表",
      () => { openConfirm("⚠️ 危险覆盖警告", "这将会修改源文件，请确保检查了没有错误。", () => { executeBackendSave('rename_source', false); }); },
      () => { executeBackendSave('new_output', false); }
    );
    return;
  }
  if (!isSilent) { openConfirm("⚠️ 覆盖警告", "这将会修改源文件，请确保检查了没有错误。", () => { executeBackendSave('overwrite', false); }); } else { executeBackendSave('overwrite', true); }
};

const executeBackendSave = async (saveMode, isSilent, overwriteConfirmed = false) => {
  try {
    const payload = { filename: store.uploadedFileName, old_filename: store.currentDataFile, rows: store.previewData.rows, save_mode: saveMode, is_new_table: store.isNewTable, overwrite_confirmed: overwriteConfirmed };
    const res = await api.post('/api/data/save', payload);
    if (res.data.status === 'exists') { openConfirm("⚠️ 同名文件冲突", res.data.message, () => { executeBackendSave(saveMode, isSilent, true); }); return; }
    if (res.data.status === 'success') { store.currentDataFile = store.uploadedFileName; store.isNewTable = false; store.isRenamed = false; if (!isSilent) openAlert("同步完成", `💾 ${res.data.message}`); }
  } catch (err) { if (!isSilent) openAlert("后端异常", "保存被拒绝，请检查 Python 引擎。"); }
};

const exportToLocal = () => {
  if (!store.previewData) return;
  let csvContent = "\uFEFF";
  csvContent += store.previewData.headers.join(",") + "\n";
  store.previewData.rows.forEach(row => {
    const rowData = store.previewData.headers.map(h => { let cell = row[h] === null || row[h] === undefined ? "" : String(row[h]); if (cell.includes(",") || cell.includes("\"") || cell.includes("\n")) cell = `"${cell.replace(/"/g, '""')}"`; return cell; });
    csvContent += rowData.join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", store.uploadedFileName || "exported_data.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
</script>

<style scoped>
@import '@/systems/management/management.css';
</style>
