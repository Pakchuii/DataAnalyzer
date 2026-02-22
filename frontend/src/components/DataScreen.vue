<script setup>
import { store, actions } from '../store.js'
import { watch, nextTick, ref, onMounted } from 'vue'

// 核心修复2：加入 100ms 延时，确保 Vue 已经把 div 高度完全撑开，Echarts 才去获取容器作画
watch(() => store.visActiveVars, async () => {
    if(store.showCharts) {
        await nextTick();
        setTimeout(() => {
            actions.renderCharts();
        }, 100);
    }
}, { deep: true });

const exportStats = () => { actions.exportToCSV(["variable", "count", "mean", "median", "std", "min", "max"], store.statsResult, "描述性统计结果"); };
const exportTTest = () => { actions.exportToCSV(["variable", "group1_name", "group1_mean", "group2_name", "group2_mean", "t_value", "p_value", "significant"], store.ttestResult, "T检验结果"); };
const exportNormality = () => { actions.exportToCSV(["variable", "statistic", "p_value", "is_normal"], store.advancedResult.normality, "正态性检验结果"); };

// ======== 悬浮窗拖拽逻辑 ========
const dragX = ref(0);
const dragY = ref(0);
let isDragging = false, startMouseX = 0, startMouseY = 0, startPosX = 0, startPosY = 0;

onMounted(() => { dragX.value = Math.max(100, window.innerWidth - 350); dragY.value = 150; });
const startDrag = (e) => { isDragging = true; startMouseX = e.clientX; startMouseY = e.clientY; startPosX = dragX.value; startPosY = dragY.value; document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', stopDrag); };
const onDrag = (e) => { if(!isDragging) return; dragX.value = startPosX + (e.clientX - startMouseX); dragY.value = startPosY + (e.clientY - startMouseY); };
const stopDrag = () => { isDragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag); };
</script>

<template>
  <main class="content-area">
    <div v-if="!store.showPreview && !store.showStats && !store.showCharts && !store.showAdvanced && !store.showTTest" class="empty-state glass-card">
      <h2>📊 数据大屏就绪</h2>
      <p>请在左侧点击按钮开启对应面板</p>
    </div>

    <div v-show="store.showCharts && store.showVisControl" class="drag-modal glass-card" :style="{ left: dragX + 'px', top: dragY + 'px' }">
        <div class="drag-header" @mousedown="startDrag">
            <span>⚙️ 控制图表显隐</span><button @click="store.showVisControl = false" class="close-btn">✕</button>
        </div>
        <div class="drag-content">
            <p style="font-size:0.8rem; color:#888; margin-bottom:10px;">请勾选需要在右侧大屏显示的图表：</p>
            <div class="checkbox-group">
                <label v-for="col in store.selectedVars" :key="col" class="checkbox-label" style="padding: 4px 10px;">
                    <input type="checkbox" v-model="store.visActiveVars" :value="col" /> {{ col }}
                </label>
                <label v-for="cat in store.catChartsData" :key="'cb-'+cat.variable" class="checkbox-label" style="padding: 4px 10px;">
                    <input type="checkbox" v-model="store.visActiveVars" :value="cat.variable" /> {{ cat.variable }} (分类)
                </label>
            </div>
        </div>
    </div>

    <div v-if="store.showPreview && store.previewData" class="glass-card result-panel">
      <div class="panel-header"><h3 class="panel-title" style="color:#13c2c2;">👁️ 数据预览 (前15行)</h3></div>
      <div class="table-responsive">
        <table class="glass-table">
          <thead><tr><th v-for="col in store.previewData.columns" :key="col">{{ col }}</th></tr></thead>
          <tbody><tr v-for="(row, i) in store.previewData.rows" :key="i"><td v-for="col in store.previewData.columns" :key="col">{{ row[col] }}</td></tr></tbody>
        </table>
      </div>
    </div>

    <div v-if="store.showStats && store.statsResult" class="glass-card result-panel">
      <div class="panel-header">
        <h3 class="panel-title">🧮 描述性统计结果</h3>
        <button @click="exportStats" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
      </div>
      <div class="table-responsive">
        <table class="glass-table">
          <thead><tr><th>变量</th><th>均值</th><th>中位数</th><th>标准差</th><th>最小</th><th>最大</th></tr></thead>
          <tbody><tr v-for="row in store.statsResult" :key="row.variable"><td class="var-name">{{ row.variable }}</td><td>{{ row.mean }}</td><td>{{ row.median }}</td><td>{{ row.std }}</td><td>{{ row.min }}</td><td>{{ row.max }}</td></tr></tbody>
        </table>
      </div>
    </div>

    <div v-if="store.showTTest && store.ttestResult" class="glass-card result-panel">
      <div class="panel-header">
        <h3 class="panel-title" style="color:#ff7875;">⚖️ 独立样本 t 检验 (分组: {{ store.selectedGroupVar }})</h3>
        <button @click="exportTTest" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
      </div>
      <div class="table-responsive">
        <table class="glass-table">
          <thead><tr><th>分析变量</th><th>组1均值</th><th>组2均值</th><th>t 值</th><th>P 值</th><th>结论</th></tr></thead>
          <tbody>
            <tr v-for="(res, index) in store.ttestResult" :key="index">
              <td class="var-name">{{ res.variable }}</td><td>{{ res.group1_mean }}</td><td>{{ res.group2_mean }}</td><td>{{ res.t_value }}</td><td>{{ res.p_value }}</td>
              <td :class="res.significant ? 'danger-text' : 'success-text'">{{ res.significant ? '🔥 显著 (p<0.05)' : '➖ 不显著' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-show="store.showCharts" class="glass-card result-panel">
      <div class="panel-header">
        <h3 class="panel-title" style="color:#69c0ff;">📈 数据分布可视化视图</h3>
        <button @click="store.showVisControl = true" class="glass-btn primary-btn export-btn" style="width: 140px;">👀 开启显隐面板</button>
      </div>
      <div v-if="store.visActiveVars.length === 0" style="text-align:center; padding: 40px; color:#888;">👈 暂无显示图表，请在右上角显隐面板中勾选。</div>
      <template v-for="(item, index) in store.catChartsData" :key="'cat-'+index">
        <div v-if="store.visActiveVars.includes(item.variable)" class="chart-grid mb-3">
          <div :id="'pie-' + item.variable" class="chart-box glass-inner"></div>
          <div :id="'cat-bar-' + item.variable" class="chart-box glass-inner"></div>
        </div>
      </template>
      <template v-for="(item, index) in store.chartsData" :key="'num-'+index">
        <div v-if="store.visActiveVars.includes(item.variable)" class="chart-grid mb-3">
            <div :id="'hist-' + item.variable" class="chart-box glass-inner"></div>
            <div :id="'box-' + item.variable" class="chart-box glass-inner"></div>
        </div>
      </template>
    </div>

    <div v-if="store.showAdvanced && store.advancedResult" class="glass-card result-panel">
      <div class="panel-header">
        <h3 class="panel-title" style="color:#b37feb;">🔬 统计检验与关联分析</h3>
        <button @click="exportNormality" class="glass-btn secondary-btn export-btn">⬇️ 导出 CSV</button>
      </div>
      <table class="glass-table mb-3">
        <thead><tr><th>变量</th><th>W 值</th><th>P 值</th><th>Shapiro-Wilk 结论</th></tr></thead>
        <tbody>
          <tr v-for="(res, index) in store.advancedResult.normality" :key="index">
            <td class="var-name">{{ res.variable }}</td><td>{{ res.statistic }}</td><td>{{ res.p_value }}</td>
            <td :class="res.is_normal ? 'success-text' : 'danger-text'">{{ res.is_normal ? '✔️ 符合正态' : '❌ 不符合正态' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="chart-grid">
        <div id="heatmap-container" class="chart-box glass-inner"></div>
        <div id="scatter-container" class="chart-box glass-inner"></div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.drag-modal { position: fixed; width: 300px; z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding: 0; overflow: hidden; }
.drag-header { background: rgba(0,0,0,0.05); padding: 12px 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: grab; border-bottom: 1px solid rgba(0,0,0,0.1); }
.drag-header:active { cursor: grabbing; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888;}
.close-btn:hover { color: #f5222d; }
.drag-content { padding: 15px; }

.content-area { flex: 1; display: flex; flex-direction: column; gap: 20px; padding-right: 5px; overflow-y: auto; }
.content-area::-webkit-scrollbar { width: 8px; }
.content-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.5); border-radius: 10px; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.7;}
.result-panel { padding: 25px; animation: fadeIn 0.4s ease;}
.panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(0,0,0,0.1); margin-bottom: 15px; padding-bottom: 10px; }
.panel-title { margin: 0; border: none; padding: 0; }
.export-btn { width: 120px; font-size: 0.8rem; padding: 6px 12px; }

.table-responsive { overflow-x: auto; max-height: 400px; }
.glass-table { width: 100%; border-collapse: collapse; text-align: center; font-size:0.9rem; }
.glass-table th, .glass-table td { padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1); }
.glass-table th { background: rgba(255,255,255,0.3); font-weight: bold; position: sticky; top: 0; backdrop-filter: blur(10px); z-index:2;}
.glass-table tr:hover { background: rgba(255,255,255,0.5); }
.var-name { font-weight: bold; color: #409eff; }

.success-text { color: #52c41a; font-weight: bold; }
.danger-text { color: #f5222d; font-weight: bold; }
.chart-grid { display: flex; gap: 20px; }

/* ======== 核心修复1：把 height: 350px 加回来了！======== */
.chart-box { flex: 1; height: 350px; padding: 10px; box-shadow: inset 0 0 10px rgba(0,0,0,0.02); }
/* ======================================================= */

.mb-3 { margin-bottom: 15px; }
.mt-3 { margin-top: 15px; }

.glass-btn { border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(4px); }
.primary-btn { background: rgba(64, 158, 255, 0.9); color: white; }
.primary-btn:hover { background: rgba(64, 158, 255, 1); transform: translateY(-2px); }
.secondary-btn { background: rgba(144, 147, 153, 0.8); color: white; }
.secondary-btn:hover { background: rgba(144, 147, 153, 1); }

.checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
.checkbox-label { padding: 6px 12px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.1); border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: border-color 0.2s;}
.checkbox-label:hover { border-color: #409eff; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
</style>