<script setup>
/**
 * 【虚拟分页引擎】
 * 在原有编辑器基础上提供分页缓冲层，避免一次性渲染全量 DOM。
 * 适用于大数据集（500+行），只渲染当前页的行，大幅降低内存占用与渲染压力。
 */
import { store, actions } from '@/core/store.js'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  filteredRows: { type: Array, default: () => [] }
})

const emit = defineEmits(['captureHistory', 'commitHistory', 'deleteRow', 'deleteColumn'])

const PAGE_SIZE = 50
const currentPage = ref(1)

// 自动限制最大页码
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.filteredRows.length / PAGE_SIZE))
})

// 当前页的行
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return props.filteredRows.slice(start, start + PAGE_SIZE)
})

// 当前页的行号偏移
const rowOffset = computed(() => (currentPage.value - 1) * PAGE_SIZE)

// 数据变化/搜索变化时回到第一页
watch(() => props.filteredRows.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function goToPage(p) { currentPage.value = Math.max(1, Math.min(p, totalPages.value)) }

// 快速跳页
const jumpInput = ref('')
function handleJump() {
  const n = parseInt(jumpInput.value)
  if (!isNaN(n)) goToPage(n)
  jumpInput.value = ''
}
</script>

<template>
  <div class="paged-table-wrapper">
    <div class="table-scroll-area">
      <table class="glass-table dark-header" style="width: 100%; white-space: nowrap; border-collapse: separate; border-spacing: 0;">
        <thead style="position: sticky; top: 0; z-index: 10;">
          <tr>
            <th class="sticky-header op-col">操作</th>
            <th class="sticky-header line-col"># 行号</th>
            <th v-for="(col, idx) in store.previewData.headers" :key="idx" class="sticky-header data-col">
              <div class="header-cell">
                <input v-model="store.previewData.headers[idx]" @focus="emit('captureHistory')" @change="emit('commitHistory')" class="header-input" title="编辑列名"/>
                <button @click="emit('deleteColumn', idx)" class="del-col-btn">✕</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in pagedRows" :key="rowOffset + rIdx" class="table-row-hover">
            <td class="action-cell">
              <button @click="emit('deleteRow', row)" class="del-row-btn">删除</button>
            </td>
            <td class="line-num-cell">{{ store.previewData.rows.indexOf(row) + 1 }}</td>
            <td v-for="(col, cIdx) in store.previewData.headers" :key="cIdx" class="data-cell">
              <input v-model="row[col]" @focus="emit('captureHistory')" @change="emit('commitHistory')" class="cell-input"
                onfocus="this.style.background='var(--glass-bg, rgba(255,255,255,0.5))'; this.style.boxShadow='inset 0 -2px 0 #fa8c16';"
                onblur="this.style.background='transparent'; this.style.boxShadow='none';" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控制条 -->
    <div v-if="totalPages > 1" class="pagination-bar">
      <div class="page-info">
        共 <strong>{{ filteredRows.length }}</strong> 行
        · 每页 {{ PAGE_SIZE }} 行
        · 第 <strong>{{ currentPage }}</strong> / {{ totalPages }} 页
      </div>
      <div class="page-controls">
        <button @click="goToPage(1)" :disabled="currentPage <= 1" class="page-btn">⏮</button>
        <button @click="prevPage" :disabled="currentPage <= 1" class="page-btn">◀</button>

        <template v-for="p in totalPages" :key="p">
          <button v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)"
            @click="goToPage(p)" class="page-btn" :class="{ active: p === currentPage }">
            {{ p }}
          </button>
          <span v-else-if="p === currentPage - 3 || p === currentPage + 3" class="page-ellipsis">…</span>
        </template>

        <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">▶</button>
        <button @click="goToPage(totalPages)" :disabled="currentPage >= totalPages" class="page-btn">⏭</button>

        <div class="jump-box">
          <input v-model="jumpInput" @keyup.enter="handleJump" placeholder="跳页" class="jump-input" />
          <button @click="handleJump" class="page-btn jump-btn">GO</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paged-table-wrapper { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.table-scroll-area { flex: 1; overflow: auto; min-height: 0; }

/* 已有的编辑器表格样式复用 */
.sticky-header { background: var(--glass-bg, rgba(255,255,255,0.8)); backdrop-filter: blur(calc(var(--glass-blur) * 0.67)); padding: 15px; border-right: 1px solid var(--glass-border, rgba(0,0,0,0.05)); }
.op-col { width: 60px; text-align: center; border-radius: 12px 0 0 0; }
.line-col { width: 60px; text-align: center; color: var(--text-muted, #888); }
.data-col { padding: 10px 15px; }
.header-cell { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.header-input { background:transparent; border:none; color:var(--text-color, #333); font-weight:bold; width:100%; min-width:80px; outline:none; border-bottom: 1px dashed rgba(0,0,0,0.1); }
.del-col-btn { background: rgba(245,34,45,0.1); border: none; color: #ff4d4f; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; transition: all 0.2s; }
.del-col-btn:hover { background: #ff4d4f; color: #fff; }
.action-cell { text-align: center; padding: 8px; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05)); }
.del-row-btn { background: rgba(245,34,45,0.05); border: 1px solid rgba(245,34,45,0.3); color: #ff4d4f; border-radius: 8px; cursor: pointer; padding: 6px 12px; font-size: 0.85rem; }
.del-row-btn:hover { background: #ff4d4f; color: #fff; }
.line-num-cell { text-align: center; color: var(--text-color, #888); font-family: monospace; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05)); }
.data-cell { padding: 0; border-right: 1px dashed var(--glass-border, rgba(0,0,0,0.05)); }
.cell-input { width: 100%; height: 100%; padding: 12px 15px; border: none; background: transparent; color: var(--text-color, #444); font-family: inherit; font-size: 0.95rem; outline: none; box-sizing: border-box; }

/* === 分页控制条 === */
.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; flex-wrap: wrap; gap: 10px;
  border-top: 1px solid var(--premium-border-color, rgba(0,0,0,0.06));
  background: var(--premium-glass-inner, rgba(0,0,0,0.02));
  flex-shrink: 0;
}
.page-info { font-size: 0.82rem; color: var(--text-muted, #888); font-weight: 600; }
.page-controls { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.page-btn {
  min-width: 32px; height: 32px; border: 1px solid var(--premium-border-color, rgba(0,0,0,0.08));
  background: var(--premium-glass-inner, transparent); border-radius: 8px;
  color: var(--text-color, #555); font-size: 0.82rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { border-color: #fa8c16; color: #fa8c16; }
.page-btn.active { background: #fa8c16; color: white; border-color: #fa8c16; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-ellipsis { color: var(--text-muted, #888); font-size: 0.85rem; padding: 0 4px; }
.jump-box { display: flex; align-items: center; gap: 4px; margin-left: 8px; }
.jump-input {
  width: 50px; height: 32px; text-align: center; border: 1px solid var(--premium-border-color, rgba(0,0,0,0.1));
  border-radius: 8px; background: var(--premium-glass-inner, transparent);
  color: var(--text-color, #333); font-size: 0.82rem; font-weight: 700; outline: none;
}
.jump-btn { font-size: 0.75rem; padding: 0 8px; }
</style>
