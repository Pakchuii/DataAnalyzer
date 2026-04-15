<script setup>
import { store, actions } from '@/core/store.js'

const addGridCol = () => {
    store.manualGrid[0].push(`新特征${store.manualGrid[0].length + 1}`);
    for (let i = 1; i < store.manualGrid.length; i++) {
        store.manualGrid[i].push("");
    }
};
const addGridRow = () => {
    const cols = store.manualGrid[0].length;
    store.manualGrid.push(new Array(cols).fill(""));
};
const removeGridCol = (cIdx) => {
    for (let i = 0; i < store.manualGrid.length; i++) {
        store.manualGrid[i].splice(cIdx, 1);
    }
};
const removeGridRow = (rIdx) => store.manualGrid.splice(rIdx, 1);

const closeModal = () => {
  store.showManualModal = false;
};
</script>

<template>
  <div v-if="store.showManualModal" class="modal-overlay" style="z-index: 2500;">
    <div class="glass-card manual-modal-content">
      <div class="modal-header-flex">
        <h2 class="editor-title">
          📝 在线表格编辑器 <span class="editor-subtitle">(直接输入数据，支持行列增删)</span>
        </h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="toolbar-flex">
        <button @click="addGridCol" class="glass-btn secondary-btn compact-btn">➕ 添加一列</button>
        <button @click="addGridRow" class="glass-btn secondary-btn compact-btn">➕ 添加一行</button>
      </div>

      <div class="table-scroll-container">
        <table class="glass-table manual-table">
          <thead>
            <tr>
              <th v-for="(col, cIdx) in store.manualGrid[0]" :key="'h'+cIdx" class="sticky-th">
                <div class="col-header-box">
                  <input v-model="store.manualGrid[0][cIdx]" class="edit-input head-input" placeholder="输入表头" />
                  <button @click="removeGridCol(cIdx)" class="mini-del-btn" v-if="store.manualGrid[0].length > 1" title="删除该列">✕</button>
                </div>
              </th>
              <th class="del-row-th"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in store.manualGrid.slice(1)" :key="'r'+rIdx">
              <td v-for="(val, cIdx) in row" :key="'c'+cIdx" class="table-cell">
                <input v-model="store.manualGrid[rIdx + 1][cIdx]" class="edit-input" placeholder="..." />
              </td>
              <td class="del-row-td">
                <button @click="removeGridRow(rIdx + 1)" class="mini-del-btn danger-text" title="删除该行">➖</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer-actions">
        <button @click="actions.submitManualGrid" class="glass-btn primary-btn submit-btn">🚀 提交并生成分析</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manual-modal-content {
  width: 80vw; max-width: 900px; height: 80vh; display: flex; flex-direction: column; padding: 25px; position: relative;
}
.modal-header-flex {
  display:flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 15px; margin-bottom: 15px;
}
.editor-title { margin:0; color:#409eff; display: flex; align-items: center; gap: 10px; }
.editor-subtitle { font-size: 0.9rem; color: #888; font-weight: normal; }

.toolbar-flex { display:flex; gap:10px; margin-bottom: 15px; }
.compact-btn { width:auto; padding: 6px 15px; background: rgba(144, 147, 153, 0.4); }

.table-scroll-container {
  flex: 1; overflow: auto; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: rgba(255,255,255,0.3);
}

.manual-table { width: 100%; border-collapse: collapse; }
.sticky-th { position: sticky; top: 0; background: rgba(64,158,255,0.2); z-index: 10; }
.col-header-box { display: flex; align-items: center; }
.table-cell { padding: 0; border: 1px solid rgba(0,0,0,0.1); }
.del-row-th { width: 40px; position: sticky; top: 0; background: rgba(64,158,255,0.2); z-index: 10; }
.del-row-td { width: 40px; border:none; text-align: center; vertical-align: middle; }

.footer-actions { margin-top: 20px; text-align: center; }
.submit-btn { width: 250px; font-size: 1.2rem; padding: 12px; box-shadow: 0 4px 15px rgba(64,158,255,0.4); }

.edit-input { width: 100%; box-sizing: border-box; background: transparent; border: none; text-align: center; font-size: 1rem; color: inherit; padding: 12px 8px; outline: none; transition: background 0.2s; }
.edit-input:focus { background: rgba(255, 255, 255, 0.5); }
.head-input { font-weight: bold; color: #333; }
.mini-del-btn { background: none; border: none; color: #888; font-weight: bold; cursor: pointer; padding: 0 5px; font-size: 1.1rem; }
.mini-del-btn:hover { color: #f56c6c; transform: scale(1.2); }
.danger-text { color: #f56c6c; }

.close-btn { font-size: 1.5rem; background:none; border:none; cursor:pointer; color: #888; }
.close-btn:hover { color: #f5222d; }

:global(.dark-mode) .head-input { color: #eee; }
:global(.dark-mode) .edit-input:focus { background: rgba(0, 0, 0, 0.3); }
</style>
