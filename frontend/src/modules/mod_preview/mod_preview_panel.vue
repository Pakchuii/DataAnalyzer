<script setup>
import { store, actions } from '@/core/store.js'
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const activeTab = ref('table')
const selectedField = ref(null)
const chartInstances = ref({})

// 切换到统计视图时自动拉取数据或重新渲染图表
watch(activeTab, async (val) => {
  if (val === 'stats') {
    if (!store.previewStatsData) {
      actions.fetchPreviewStats()
    } else {
      // 数据已有但 DOM 被 v-if 销毁过，需重新渲染
      await nextTick()
      renderSparklines()
      if (selectedField.value) {
        renderMainChart(selectedField.value)
      }
    }
  }
})

// 统计数据到达后自动渲染迷你图
watch(() => store.previewStatsData, async (data) => {
  if (data && data.length > 0) {
    selectedField.value = data[0]
    await nextTick()
    renderSparklines()
    renderMainChart(data[0])
  }
}, { immediate: true })

function selectField(field) {
  selectedField.value = field
  nextTick(() => renderMainChart(field))
}

function renderSparklines() {
  if (!store.previewStatsData) return
  store.previewStatsData.forEach((col, idx) => {
    const dom = document.getElementById(`sparkline-${idx}`)
    if (!dom || !col.sparkline || col.sparkline.length === 0) return
    
    let chart = echarts.getInstanceByDom(dom)
    if (chart) chart.dispose()
    chart = echarts.init(dom, store.isDarkMode ? 'dark' : null)
    
    chart.setOption({
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { show: false, type: 'category' },
      yAxis: { show: false },
      series: [{
        type: 'bar',
        data: col.sparkline,
        itemStyle: {
          color: col.type === 'numeric'
            ? 'rgba(64, 158, 255, 0.7)'
            : 'rgba(114, 46, 209, 0.7)'
        },
        barCategoryGap: '20%'
      }],
      animation: false
    })
    chartInstances.value[`spark-${idx}`] = chart
  })
}

function renderMainChart(field) {
  if (!field) return
  const dom = document.getElementById('main-stats-chart')
  if (!dom) return

  let chart = echarts.getInstanceByDom(dom)
  if (chart) chart.dispose()
  chart = echarts.init(dom, store.isDarkMode ? 'dark' : null)

  let option = {}

  if (field.type === 'numeric' && field.histogram) {
    const bins = field.histogram.bins
    const labels = bins.slice(0, -1).map((b, i) => `${b}`)
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0]
          const i = p.dataIndex
          return `<b>${bins[i]} ~ ${bins[i + 1]}</b><br/>频次: ${p.value}`
        }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 45 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 30, fontSize: 11 },
        axisTick: { alignWithLabel: true }
      },
      yAxis: { type: 'value', name: '频次' },
      series: [{
        type: 'bar',
        data: field.histogram.counts,
        barCategoryGap: '15%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#69c0ff' },
            { offset: 1, color: '#096dd9' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }]
    }
  } else if (field.type === 'categorical' && field.top_values) {
    option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 100, right: 20, top: 20, bottom: 20 },
      xAxis: { type: 'value', name: '频次' },
      yAxis: {
        type: 'category',
        data: [...field.top_values.labels].reverse(),
        axisLabel: {
          fontSize: 11,
          formatter: (v) => v.length > 10 ? v.slice(0, 10) + '…' : v
        }
      },
      series: [{
        type: 'bar',
        data: [...field.top_values.counts].reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#b37feb' },
            { offset: 1, color: '#722ed1' }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      }]
    }
  }

  chart.setOption(option)
  chartInstances.value['main'] = chart
}

// 窗口resize时重刷图表
function handleResize() {
  Object.values(chartInstances.value).forEach(c => { if (c && !c.isDisposed()) c.resize() })
}
window.addEventListener('resize', handleResize)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances.value).forEach(c => { if (c && !c.isDisposed()) c.dispose() })
})
</script>

<template>
  <div v-if="store.showPreview && store.previewData" class="glass-card result-panel preview-panel-wrapper">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#13c2c2;">👁️ 数据预览</h3>
      <div class="tab-switcher">
        <button
          class="tab-btn" :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'">📋 表格视图</button>
        <button
          class="tab-btn" :class="{ active: activeTab === 'stats' }"
          @click="activeTab = 'stats'">📊 图表统计</button>
      </div>
    </div>

    <!-- ===== Tab 1: 表格视图 ===== -->
    <div v-if="activeTab === 'table'" class="table-responsive">
      <table class="glass-table">
        <thead>
          <tr><th v-for="col in store.previewData.columns" :key="col">{{ col }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in store.previewData.rows" :key="i">
            <td v-for="col in store.previewData.columns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== Tab 2: 图表统计视图 ===== -->
    <div v-if="activeTab === 'stats'" class="stats-view">
      <div v-if="!store.previewStatsData" class="stats-loading">
        <div class="loading-spinner"></div>
        <p>正在扫描全量字段分布...</p>
      </div>

      <div v-else class="stats-layout">
        <!-- 左侧字段列表 -->
        <div class="field-list">
          <div
            v-for="(col, idx) in store.previewStatsData" :key="idx"
            class="field-item" :class="{ selected: selectedField && selectedField.name === col.name }"
            @click="selectField(col)">
            <div class="field-name">
              <span class="field-type-badge" :class="col.type">{{ col.type === 'numeric' ? '#' : 'Aa' }}</span>
              {{ col.name }}
            </div>
            <div :id="'sparkline-' + idx" class="sparkline-chart"></div>
          </div>
        </div>

        <!-- 右侧详情区 -->
        <div class="field-detail" v-if="selectedField">
          <div class="detail-header">
            <h4 class="detail-title">{{ selectedField.name }}</h4>
            <span class="detail-type-tag" :class="selectedField.type">
              {{ selectedField.type === 'numeric' ? '数值型' : '分类型' }}
            </span>
          </div>

          <!-- 大图表 -->
          <div id="main-stats-chart" class="main-chart"></div>

          <!-- 统计指标卡片 -->
          <div class="metrics-cards">
            <div class="metric-card">
              <span class="metric-label">总行数</span>
              <span class="metric-value">{{ selectedField.count }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">唯一值</span>
              <span class="metric-value">{{ selectedField.unique }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">缺失</span>
              <span class="metric-value" :class="{ 'warn-value': selectedField.missing > 0 }">{{ selectedField.missing }}</span>
            </div>

            <template v-if="selectedField.type === 'numeric'">
              <div class="metric-card">
                <span class="metric-label">最小值</span>
                <span class="metric-value">{{ selectedField.min }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">最大值</span>
                <span class="metric-value">{{ selectedField.max }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">均值</span>
                <span class="metric-value">{{ selectedField.mean }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">中位数</span>
                <span class="metric-value">{{ selectedField.median }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">标准差</span>
                <span class="metric-value">{{ selectedField.std }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">25th 分位</span>
                <span class="metric-value">{{ selectedField.q25 }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">75th 分位</span>
                <span class="metric-value">{{ selectedField.q75 }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel-wrapper {
  overflow: visible;
}

/* ===== Tab 切换条 ===== */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.tab-switcher {
  display: flex;
  gap: 4px;
  background: var(--premium-glass-inner, rgba(0,0,0,0.04));
  padding: 4px;
  border-radius: 12px;
}
.tab-btn {
  padding: 8px 18px;
  border: none;
  background: transparent;
  color: var(--text-color, #666);
  font-weight: 600;
  font-size: 0.88rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.tab-btn:hover {
  background: rgba(19, 194, 194, 0.08);
  color: #13c2c2;
}
.tab-btn.active {
  background: rgba(19, 194, 194, 0.15);
  color: #13c2c2;
  box-shadow: 0 2px 8px rgba(19, 194, 194, 0.2);
}

/* ===== 统计视图 ===== */
.stats-view {
  margin-top: 15px;
}
.stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-color, #999);
}
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(19, 194, 194, 0.2);
  border-top-color: #13c2c2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.stats-layout {
  display: flex;
  gap: 20px;
  min-height: 380px;
}

/* --- 左侧字段列表 --- */
.field-list {
  width: 240px;
  min-width: 200px;
  max-height: 500px;
  overflow-y: auto;
  border-right: 1px solid var(--glass-border, rgba(0,0,0,0.06));
  padding-right: 12px;
}
.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  margin-bottom: 4px;
  gap: 10px;
}
.field-item:hover {
  background: rgba(19, 194, 194, 0.06);
}
.field-item.selected {
  background: rgba(19, 194, 194, 0.12);
  box-shadow: inset 3px 0 0 #13c2c2;
}
.field-name {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-color, #333);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  flex-shrink: 0;
}
.field-type-badge.numeric {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
}
.field-type-badge.categorical {
  background: rgba(114, 46, 209, 0.15);
  color: #722ed1;
}
.sparkline-chart {
  width: 80px;
  height: 30px;
  flex-shrink: 0;
}

/* --- 右侧详情区 --- */
.field-detail {
  flex: 1;
  min-width: 0;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.detail-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color, #222);
}
.detail-type-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
}
.detail-type-tag.numeric {
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
}
.detail-type-tag.categorical {
  background: rgba(114, 46, 209, 0.12);
  color: #722ed1;
}
.main-chart {
  width: 100%;
  height: 250px;
  border-radius: 12px;
  background: var(--premium-glass-inner, rgba(0,0,0,0.02));
  margin-bottom: 20px;
}

/* --- 统计指标卡片 --- */
.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.metric-card {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--premium-glass-inner, rgba(0,0,0,0.03));
  border: 1px solid var(--glass-border, rgba(0,0,0,0.05));
  transition: all 0.2s;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.metric-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-color, #888);
  opacity: 0.65;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-color, #333);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.warn-value {
  color: #fa8c16 !important;
}
</style>
