<script setup>
import { store, actions } from '@/core/store.js'
import { ref, watch, computed } from 'vue'

const selectedColumn = ref('')
const filterType = ref('range')
const rangeMin = ref(0)
const rangeMax = ref(100)
const selectedValues = ref([])

// 当选中列改变时，拉取该列信息
watch(selectedColumn, async (col) => {
  if (!col) return;
  store.filterColumnInfo = null;
  filterType.value = 'range';
  selectedValues.value = [];
  await actions.fetchColumnFilterInfo(col);

  // 自动设置范围初始值
  if (store.filterColumnInfo) {
    if (store.filterColumnInfo.type === 'numeric') {
      rangeMin.value = store.filterColumnInfo.min;
      rangeMax.value = store.filterColumnInfo.max;
      filterType.value = 'range';
    } else {
      filterType.value = 'values';
      selectedValues.value = [...store.filterColumnInfo.values];
    }
  }
})

const allColumns = computed(() => {
  if (!store.fileInfo) return [];
  return store.fileInfo.columns || [];
})

function addFilter() {
  if (!selectedColumn.value || !store.filterColumnInfo) return;

  const filter = { column: selectedColumn.value, type: filterType.value };
  if (filterType.value === 'range') {
    filter.min = parseFloat(rangeMin.value);
    filter.max = parseFloat(rangeMax.value);
  } else {
    filter.values = [...selectedValues.value];
  }

  // 替换已有的同列筛选
  const idx = store.activeFilters.findIndex(f => f.column === filter.column);
  if (idx >= 0) {
    store.activeFilters.splice(idx, 1, filter);
  } else {
    store.activeFilters.push(filter);
  }

  actions.addLog(`已添加筛选条件: ${filter.column}`, "info");
}

function removeFilter(index) {
  store.activeFilters.splice(index, 1);
}

function toggleValue(val) {
  const idx = selectedValues.value.indexOf(val);
  if (idx >= 0) {
    selectedValues.value.splice(idx, 1);
  } else {
    selectedValues.value.push(val);
  }
}

function selectAllValues() {
  if (store.filterColumnInfo && store.filterColumnInfo.values) {
    selectedValues.value = [...store.filterColumnInfo.values];
  }
}

function deselectAllValues() {
  selectedValues.value = [];
}
</script>

<template>
  <div v-if="store.showFilterPanel" class="glass-card result-panel filter-panel-wrapper">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#fa8c16;">🎯 数据筛选器</h3>
      <button @click="store.showFilterPanel = false" class="close-btn">✕</button>
    </div>

    <div class="filter-body">
      <!-- 列选择 -->
      <div class="filter-section">
        <label class="filter-label">选择筛选字段</label>
        <select v-model="selectedColumn" class="filter-select">
          <option value="">— 请选择 —</option>
          <option v-for="col in allColumns" :key="col" :value="col">{{ col }}</option>
        </select>
      </div>

      <!-- 加载中 -->
      <div v-if="selectedColumn && !store.filterColumnInfo" class="filter-loading">
        <div class="loading-dot"></div>
        <span>正在获取字段信息...</span>
      </div>

      <!-- 筛选配置 -->
      <div v-if="store.filterColumnInfo" class="filter-config">

        <!-- 筛选类型选择 -->
        <div class="filter-type-bar" v-if="store.filterColumnInfo.type === 'numeric'">
          <label class="type-option" :class="{ active: filterType === 'range' }">
            <input type="radio" value="range" v-model="filterType" /> 按范围筛选
          </label>
          <label class="type-option" :class="{ active: filterType === 'values' }">
            <input type="radio" value="values" v-model="filterType" /> 按值集筛选
          </label>
        </div>

        <!-- 范围筛选 -->
        <div v-if="filterType === 'range' && store.filterColumnInfo.type === 'numeric'" class="range-config">
          <div class="range-info">
            <span class="range-bound">原始范围: {{ store.filterColumnInfo.min }} ~ {{ store.filterColumnInfo.max }}</span>
          </div>
          <div class="range-inputs">
            <div class="range-field">
              <label>最小值</label>
              <input type="number" v-model.number="rangeMin" :min="store.filterColumnInfo.min" :max="rangeMax" class="range-input" :step="0.01" />
            </div>
            <span class="range-sep">~</span>
            <div class="range-field">
              <label>最大值</label>
              <input type="number" v-model.number="rangeMax" :min="rangeMin" :max="store.filterColumnInfo.max" class="range-input" :step="0.01" />
            </div>
          </div>
          <!-- 双滑块 -->
          <div class="dual-slider">
            <input type="range" v-model.number="rangeMin"
              :min="store.filterColumnInfo.min" :max="store.filterColumnInfo.max"
              :step="(store.filterColumnInfo.max - store.filterColumnInfo.min) / 200"
              class="slider slider-min" />
            <input type="range" v-model.number="rangeMax"
              :min="store.filterColumnInfo.min" :max="store.filterColumnInfo.max"
              :step="(store.filterColumnInfo.max - store.filterColumnInfo.min) / 200"
              class="slider slider-max" />
          </div>
        </div>

        <!-- 值集筛选 -->
        <div v-if="filterType === 'values' || store.filterColumnInfo.type === 'categorical'" class="values-config">
          <div class="values-actions">
            <button @click="selectAllValues" class="mini-action-btn">全选</button>
            <button @click="deselectAllValues" class="mini-action-btn">清空</button>
            <span class="values-count">{{ selectedValues.length }} / {{ (store.filterColumnInfo.values || []).length }} 已选</span>
          </div>
          <div class="values-list">
            <label v-for="val in (store.filterColumnInfo.values || [])" :key="val" class="value-chip" :class="{ selected: selectedValues.includes(val) }">
              <input type="checkbox" :checked="selectedValues.includes(val)" @change="toggleValue(val)" />
              {{ val }}
            </label>
          </div>
        </div>

        <button @click="addFilter" class="glass-btn add-filter-btn">➕ 添加此筛选条件</button>
      </div>

      <!-- 已添加的筛选条件 -->
      <div v-if="store.activeFilters && store.activeFilters.length > 0" class="active-filters">
        <h4 class="filters-title">📋 当前筛选条件</h4>
        <div v-for="(f, idx) in store.activeFilters" :key="idx" class="filter-chip">
          <span class="chip-col">{{ f.column }}</span>
          <span class="chip-rule" v-if="f.type === 'range'">{{ f.min }} ~ {{ f.max }}</span>
          <span class="chip-rule" v-else>{{ f.values.length }} 个值</span>
          <button @click="removeFilter(idx)" class="chip-remove">✕</button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="filter-footer" v-if="store.activeFilters && store.activeFilters.length > 0">
        <button @click="actions.resetFilters" class="glass-btn reset-btn">↩️ 重置</button>
        <button @click="actions.applyFilters" class="glass-btn apply-btn">✅ 应用筛选</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-panel-wrapper { overflow: visible; }
.panel-header { display: flex; justify-content: space-between; align-items: center; }
.close-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-muted, #888); }
.close-btn:hover { color: #f5222d; }

.filter-body { margin-top: 16px; }
.filter-section { margin-bottom: 18px; }
.filter-label { display: block; font-weight: 700; font-size: 0.88rem; margin-bottom: 8px; color: var(--text-color, #333); }
.filter-select {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--premium-border-color); background: var(--premium-glass-inner);
  color: var(--text-color, #333); font-size: 0.92rem; font-weight: 600;
  outline: none; cursor: pointer; transition: border-color 0.2s;
}
.filter-select:focus { border-color: #fa8c16; }

.filter-loading { display: flex; align-items: center; gap: 10px; padding: 16px 0; color: var(--text-muted, #888); font-size: 0.88rem; }
.loading-dot { width: 10px; height: 10px; border-radius: 50%; background: #fa8c16; animation: pulse 0.8s infinite alternate; }
@keyframes pulse { to { opacity: 0.3; transform: scale(0.8); } }

.filter-config { margin-top: 12px; }

/* 筛选类型切换 */
.filter-type-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.type-option {
  flex: 1; padding: 10px; text-align: center; border-radius: 10px;
  background: var(--premium-glass-inner); border: 2px solid transparent;
  cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: all 0.25s;
  color: var(--text-color, #555);
}
.type-option:hover { border-color: rgba(250, 140, 22, 0.3); }
.type-option.active { border-color: #fa8c16; background: rgba(250, 140, 22, 0.06); color: #fa8c16; }
.type-option input { display: none; }

/* 范围筛选 */
.range-config { margin-bottom: 16px; }
.range-info { margin-bottom: 12px; }
.range-bound { font-size: 0.82rem; color: var(--text-muted, #888); font-weight: 600; }
.range-inputs { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.range-field { flex: 1; }
.range-field label { display: block; font-size: 0.78rem; color: var(--text-muted, #888); margin-bottom: 4px; font-weight: 600; }
.range-input {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--premium-border-color); background: var(--premium-glass-inner);
  color: var(--text-color, #333); font-size: 0.92rem; font-weight: 700;
  outline: none; font-family: 'SF Mono', monospace;
}
.range-input:focus { border-color: #fa8c16; }
.range-sep { font-size: 1.2rem; color: var(--text-muted, #aaa); font-weight: 300; }

/* 双滑块 */
.dual-slider { position: relative; height: 30px; margin-top: 4px; }
.slider {
  position: absolute; width: 100%; -webkit-appearance: none;
  background: transparent; pointer-events: none; top: 8px;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: #fa8c16; border: 2px solid white; cursor: pointer;
  pointer-events: all; box-shadow: 0 2px 6px rgba(250, 140, 22, 0.4);
}
.slider::-webkit-slider-runnable-track { height: 4px; background: rgba(250, 140, 22, 0.2); border-radius: 2px; }

/* 值集筛选 */
.values-config { margin-bottom: 16px; }
.values-actions { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.mini-action-btn {
  padding: 4px 12px; border-radius: 6px; border: 1px solid var(--premium-border-color);
  background: var(--premium-glass-inner); color: var(--text-color, #555);
  font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.mini-action-btn:hover { border-color: #fa8c16; color: #fa8c16; }
.values-count { font-size: 0.78rem; color: var(--text-muted, #888); margin-left: auto; }
.values-list { display: flex; flex-wrap: wrap; gap: 6px; max-height: 200px; overflow-y: auto; }
.value-chip {
  padding: 6px 14px; border-radius: 20px;
  background: var(--premium-glass-inner); border: 1px solid var(--premium-border-color);
  cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
  color: var(--text-color, #555); display: flex; align-items: center; gap: 6px;
}
.value-chip input { display: none; }
.value-chip:hover { border-color: #fa8c16; }
.value-chip.selected { background: rgba(250, 140, 22, 0.1); border-color: #fa8c16; color: #fa8c16; font-weight: 700; }

.add-filter-btn {
  width: 100%; margin-top: 12px; padding: 10px;
  background: rgba(250, 140, 22, 0.08); color: #fa8c16;
  border: 1px dashed rgba(250, 140, 22, 0.4); font-weight: 700;
}
.add-filter-btn:hover { background: rgba(250, 140, 22, 0.15); }

/* 已添加条件 */
.active-filters { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--premium-border-color); }
.filters-title { margin-bottom: 10px; color: var(--text-color, #333); }
.filter-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px; margin-bottom: 6px;
  background: var(--premium-glass-inner); border: 1px solid var(--premium-border-color);
}
.chip-col { font-weight: 700; color: #fa8c16; }
.chip-rule { flex: 1; font-size: 0.88rem; color: var(--text-muted, #888); font-family: monospace; }
.chip-remove {
  background: rgba(245, 34, 45, 0.08); border: none; color: #f5222d;
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
  font-size: 0.85rem; transition: all 0.2s;
}
.chip-remove:hover { background: #f5222d; color: white; }

/* 底部操作 */
.filter-footer { display: flex; gap: 12px; margin-top: 16px; }
.reset-btn {
  flex: 1; background: var(--premium-glass-inner); color: var(--text-color, #555);
  border: 1px solid var(--premium-border-color);
}
.apply-btn {
  flex: 2; background: linear-gradient(135deg, #fa8c16, #eb2f96);
  color: white; box-shadow: 0 4px 15px rgba(250, 140, 22, 0.3);
}
.apply-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(250, 140, 22, 0.4); }
</style>
