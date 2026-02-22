<script setup>
import { store, actions } from '../store.js'
import { watch, nextTick, ref, onMounted } from 'vue'

// ==========================================
// 打字机特效逻辑
// ==========================================
const typedText = ref([]);
let typeInterval = null;

watch(() => store.showAiSummary, (newVal) => {
    if (newVal && store.aiSummaryText.length > 0) {
        typedText.value = [];
        let lineIndex = 0;
        let charIndex = 0;

        if (typeInterval) clearInterval(typeInterval);

        typeInterval = setInterval(() => {
            if (lineIndex < store.aiSummaryText.length) {
                const currentLine = store.aiSummaryText[lineIndex];
                if (charIndex < currentLine.length) {
                    if (!typedText.value[lineIndex]) typedText.value[lineIndex] = '';
                    typedText.value[lineIndex] += currentLine[charIndex];
                    charIndex++;
                } else {
                    lineIndex++;
                    charIndex = 0;
                }
            } else {
                clearInterval(typeInterval);
            }
        }, 30); // 打字速度控制
    }
});

// ==========================================
// ECharts 图表渲染监听器
// ==========================================
watch(() => store.visActiveVars, async () => {
    if(store.showCharts) {
        await nextTick();
        setTimeout(() => { actions.renderCharts(); }, 100);
    }
}, { deep: true });

// ==========================================
// 数据导出方法
// ==========================================
const exportStats = () => {
    actions.exportToCSV(["variable", "count", "mean", "median", "std", "min", "max"], store.statsResult, "描述性统计结果");
};

const exportTTest = () => {
    actions.exportToCSV(["variable", "group1_name", "group1_mean", "group2_name", "group2_mean", "t_value", "p_value", "significant"], store.ttestResult, "T检验结果");
};

const exportNormality = () => {
    actions.exportToCSV(["variable", "statistic", "p_value", "is_normal"], store.advancedResult.normality, "正态性检验结果");
};

// ==========================================
// 悬浮面板拖拽逻辑
// ==========================================
const dragX = ref(0);
const dragY = ref(0);
let isDragging = false, startMouseX = 0, startMouseY = 0, startPosX = 0, startPosY = 0;

onMounted(() => {
    dragX.value = Math.max(100, window.innerWidth - 350);
    dragY.value = 150;
});

const startDrag = (e) => {
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startPosX = dragX.value;
    startPosY = dragY.value;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
    if(!isDragging) return;
    dragX.value = startPosX + (e.clientX - startMouseX);
    dragY.value = startPosY + (e.clientY - startMouseY);
};

const stopDrag = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
};
</script>

<template>
  <main class="content-area" id="pdf-report-area">

    <div v-if="!store.showPreview && !store.showStats && !store.showCharts && !store.showAdvanced && !store.showTTest && !store.showAiSummary && !store.showRadar && !store.showML" class="empty-state glass-card">
      <h2>📊 数据大屏就绪</h2>
      <p>请在左侧点击按钮开启对应面板</p>
    </div>

    <div v-if="store.showAiSummary" class="glass-card result-panel ai-panel">
        <div class="panel-header">
            <h3 class="panel-title" style="color:#b37feb;">🤖 数据解读报告</h3>
        </div>
        <div class="ai-content">
            <p v-for="(line, index) in typedText" :key="index" v-html="line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></p>
            <span class="cursor">|</span>
        </div>
    </div>

    <div v-if="store.showRadar && store.radarResult" class="glass-card result-panel">
        <div class="panel-header">
            <h3 class="panel-title" style="color:#e6a23c;">🕸️ 个体能力定位雷达图</h3>
        </div>
        <div id="radar-container" class="chart-box" style="height: 500px;"></div>
    </div>

    <div v-show="store.showCharts && store.showVisControl" class="drag-modal glass-card" :style="{ left: dragX + 'px', top: dragY + 'px' }">
        <div class="drag-header" @mousedown="startDrag">
            <span>⚙️ 控制图表显隐</span>
            <button @click="store.showVisControl = false" class="close-btn">✕</button>
        </div>
        <div class="drag-content">
            <p style="font-size:0.8rem; color:#888; margin-bottom:10px;">请勾选需要在右侧大屏显示的图表：</p>
            <div class="checkbox-group">
                <label v-for="col in store.selectedVars" :key="col" class="checkbox-label" style="padding: 4px 10px;">
                    <input type="checkbox" v-model="store.visActiveVars" :value="col" /> {{ col }}
                </label>
            </div>
        </div>
    </div>

    <div v-if="store.showPreview && store.previewData" class="glass-card result-panel">
      <div class="panel-header">
          <h3 class="panel-title" style="color:#13c2c2;">👁️ 数据预览 (前15行)</h3>
      </div>
      <div class="table-responsive">
          <table class="glass-table">
              <thead>
                  <tr>
                      <th v-for="col in store.previewData.columns" :key="col">{{ col }}</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="(row, i) in store.previewData.rows" :key="i">
                      <td v-for="col in store.previewData.columns" :key="col">{{ row[col] }}</td>
                  </tr>
              </tbody>
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
              <thead>
                  <tr>
                      <th>变量</th><th>均值</th><th>中位数</th><th>标准差</th><th>最小</th><th>最大</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="row in store.statsResult" :key="row.variable">
                      <td class="var-name">{{ row.variable }}</td>
                      <td>{{ row.mean }}</td>
                      <td>{{ row.median }}</td>
                      <td>{{ row.std }}</td>
                      <td>{{ row.min }}</td>
                      <td>{{ row.max }}</td>
                  </tr>
              </tbody>
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
              <thead>
                  <tr>
                      <th>分析变量</th><th>组1均值</th><th>组2均值</th><th>t 值</th><th>P 值</th><th>结论</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="(res, index) in store.ttestResult" :key="index">
                      <td class="var-name">{{ res.variable }}</td>
                      <td>{{ res.group1_mean }}</td>
                      <td>{{ res.group2_mean }}</td>
                      <td>{{ res.t_value }}</td>
                      <td>{{ res.p_value }}</td>
                      <td :class="res.significant ? 'danger-text' : 'success-text'">
                          {{ res.significant ? '🔥 显著 (p<0.05)' : '➖ 不显著' }}
                      </td>
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
      <div v-if="store.visActiveVars.length === 0" style="text-align:center; padding: 40px; color:#888;">
          👈 暂无显示图表，请在右上角显隐面板中勾选。
      </div>
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
          <thead>
              <tr>
                  <th>变量</th><th>W 值</th><th>P 值</th><th>Shapiro-Wilk 结论</th>
              </tr>
          </thead>
          <tbody>
              <tr v-for="(res, index) in store.advancedResult.normality" :key="index">
                  <td class="var-name">{{ res.variable }}</td>
                  <td>{{ res.statistic }}</td>
                  <td>{{ res.p_value }}</td>
                  <td :class="res.is_normal ? 'success-text' : 'danger-text'">
                      {{ res.is_normal ? '✔️ 符合正态' : '❌ 不符合正态' }}
                  </td>
              </tr>
          </tbody>
      </table>
      <div class="chart-grid">
          <div id="heatmap-container" class="chart-box glass-inner"></div>
          <div id="scatter-container" class="chart-box glass-inner"></div>
      </div>
    </div>

    <div v-if="store.showML" class="result-panel glass-card scale-in mt-3">
      <h3 class="panel-title" style="color: #722ed1;">🤖 机器学习预测模型 (Random Forest)</h3>

      <div style="display: flex; gap: 15px; margin-bottom: 20px;">
          <div class="glass-inner" style="flex: 1; text-align: center; padding: 15px;">
              <div style="font-size: 0.9rem; color: #888;">模型拟合优度 (R² Score)</div>
              <div style="font-size: 1.8rem; color: #722ed1; font-weight: bold;">{{ store.mlResult.r2 }}</div>
              <div style="font-size: 0.75rem; color: #aaa;">越接近1说明预测越准</div>
          </div>
          <div class="glass-inner" style="flex: 1; text-align: center; padding: 15px;">
              <div style="font-size: 0.9rem; color: #888;">均方误差 (MSE)</div>
              <div style="font-size: 1.8rem; color: #fa8c16; font-weight: bold;">{{ store.mlResult.mse }}</div>
              <div style="font-size: 0.75rem; color: #aaa;">预测误差的平均水平</div>
          </div>
      </div>

      <div class="chart-grid">
         <div id="ml-importance-chart" class="chart-box glass-inner" style="height: 350px;"></div>
         <div id="ml-scatter-chart" class="chart-box glass-inner" style="height: 350px;"></div>
      </div>
    </div>

  </main>
</template>

<style scoped src="./DataScreen.css"></style>