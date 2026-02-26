<script setup>
/**
 * 【视图与控制器层：数据大屏与 Canvas 渲染器】
 * 核心包含三大逻辑机制：
 * 1. setTimeout 与 setInterval 控制的 AI 仿生打字机引擎。
 * 2. ECharts DOM 挂载拦截：借助 nextTick 确保 Vue 虚拟 DOM 实装后再调用 Canvas API。
 * 3. 自定义窗口推拽拦截：使用纯净的 MouseEvent 监听器脱离原生限制。
 */
import { store, actions } from '../store.js'
import { watch, nextTick, ref, onMounted } from 'vue'

// ==========================================
// 🚀 微交互设计：AI 报告自然流打字机特效
// ==========================================
const typedText = ref([]);
const isTyping = ref(false);
let typeInterval = null;

// 响应式订阅：当探测到 AI 摘要下发完毕，启动逐帧队列渲染器
watch(() => store.showAiSummary, (newVal) => {
  if (newVal && store.aiSummaryText.length > 0) {
    typedText.value = [];
    isTyping.value = true;
    let lineIndex = 0, charIndex = 0;

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
        isTyping.value = false; // 触发销毁，光标下线
      }
    }, 30);
  }
});

// ==========================================
// 🚀 DOM 渲染拦截：保证 ECharts 图表容器在内存中真实存在
// ==========================================
watch(() => store.visActiveVars, async () => {
  if(store.showCharts) {
    // 异步防抖：强迫代码等待一次微任务周期
    await nextTick();
    setTimeout(() => { actions.renderCharts(); }, 100);
  }
}, { deep: true });

// ==========================================
// 数据字典映射：对接离线导出引擎 (CSV Exporter)
// ==========================================
const exportStats = () => actions.exportToCSV(["variable", "count", "mean", "median", "std", "min", "max"], store.statsResult, "描述性统计结果");
const exportTTest = () => actions.exportToCSV(["variable", "group1_name", "group1_mean", "group2_name", "group2_mean", "t_value", "p_value", "significant"], store.ttestResult, "T检验结果");
const exportNormality = () => actions.exportToCSV(["variable", "statistic", "p_value", "is_normal"], store.advancedResult.normality, "正态性检验结果");

// ==========================================
// 脱离三方库约束：纯 JS 原生拖拽面板控制器
// ==========================================
const dragX = ref(0), dragY = ref(0);
let isDragging = false, startMouseX = 0, startMouseY = 0, startPosX = 0, startPosY = 0;

onMounted(() => {
  // 自适应响应式定位，防溢出
  dragX.value = Math.max(100, window.innerWidth - 350);
  dragY.value = 150;
});

const startDrag = (e) => {
  isDragging = true; startMouseX = e.clientX; startMouseY = e.clientY; startPosX = dragX.value; startPosY = dragY.value;
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
  document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag);
};
</script>

<template>
  <div style="position: relative; flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden;">

    <div class="exit-corner-btn" @click="store.showExitConfirm = true" title="返回主菜单">
      <span class="exit-icon">✕</span>
    </div>

    <div v-if="store.showExitConfirm" class="modal-overlay" style="z-index: 3000;">
      <transition name="banner-slide">
        <div v-if="store.showExitConfirm" class="glass-card exit-top-banner">
          <div class="banner-left">
            <div class="warning-icon-box">⚠️</div>
            <div class="warning-text-box">
              <h4>确认退出工作区？</h4>
              <p>未导出的数据和分析结果将彻底丢失，无法恢复。</p>
            </div>
          </div>
          <div class="banner-right">
        <button @click="store.showExitConfirm = false" class="glass-btn secondary-btn small-btn">取消手滑</button>
        <button @click="actions.confirmExitToMainMenu(); store.isEntered = true; store.currentModule = 'portal';" class="glass-btn primary-btn danger-btn small-btn">🗑️ 确定退出</button>
      </div>
        </div>
      </transition>
    </div>

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
          <p v-for="(line, index) in typedText" :key="index">
            <span v-html="line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')"></span>
            <span v-if="isTyping && index === typedText.length - 1" class="cursor">|</span>
          </p>
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
            <thead><tr><th v-for="col in store.previewData.columns" :key="col">{{ col }}</th></tr></thead>
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
            <thead><tr><th>变量</th><th>均值</th><th>中位数</th><th>标准差</th><th>最小</th><th>最大</th></tr></thead>
            <tbody>
              <tr v-for="row in store.statsResult" :key="row.variable">
                <td class="var-name">{{ row.variable }}</td><td>{{ row.mean }}</td><td>{{ row.median }}</td><td>{{ row.std }}</td><td>{{ row.min }}</td><td>{{ row.max }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="store.showTTest && store.ttestResult" class="glass-card result-panel">
        <div class="panel-header">
          <h3 class="panel-title" style="color:#ff7875;">⚖️ 独立样本 t 检验 (分组: {{ store.selectedGroupVar }})</h3>
          <button @click="exportTTest" class="glass-btn secondary-btn export-btn" :disabled="store.ttestResult.length === 0">⬇️ 导出 CSV</button>
        </div>
        <div v-if="store.ttestResult.length === 0" style="text-align: center; padding: 40px 20px; color: #f5222d; background: rgba(245,34,45,0.05); border-radius: 8px; border: 1px dashed rgba(245,34,45,0.3);">
          <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
          <h4 style="margin: 0 0 5px 0; color: #f5222d;">样本量过少，无法执行 T 检验</h4>
          <p style="font-size: 0.9rem; margin: 0; opacity: 0.8;">您当前的数据存在某一组只有一个样本的情况。</p>
        </div>
        <div v-else class="table-responsive">
          <table class="glass-table">
            <thead>
              <tr>
                <th>分析变量</th>
                <th>组1均值</th>
                <th>组2均值</th>
                <th><span class="help-tip" data-tip="t 值：衡量两组数据均值差异的程度。绝对值越大，说明两组差异越明显。">t 值</span></th>
                <th><span class="help-tip" data-tip="P 值：统计学中的概率值。通常 P < 0.05 即代表两组数据存在显著性差异。">P 值</span></th>
                <th>结论</th>
              </tr>
            </thead>
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
        <div v-if="store.visActiveVars.length === 0" style="text-align:center; padding: 40px; color:#888;">👈 暂无显示图表，请勾选。</div>
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
              <th>变量</th>
              <th><span class="help-tip" data-tip="W 值 (Shapiro-Wilk 检验)：用于评估数据是否呈现正态分布。该值越接近 1，数据越符合正态分布曲线。">W 值</span></th>
              <th><span class="help-tip" data-tip="P 值：在此处若 P > 0.05，则说明数据符合正态分布；若 P < 0.05，则偏离正态分布。">P 值</span></th>
              <th>Shapiro-Wilk 结论</th>
            </tr>
          </thead>
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

     <div v-if="store.showML" class="result-panel glass-card scale-in mt-3">
        <h3 class="panel-title" style="color: #722ed1; margin-bottom: 15px;">🤖 机器学习预测模型 (Random Forest)</h3>

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

        <div class="chart-grid" key="original-ml-charts">
          <div id="ml-importance-chart" class="chart-box glass-inner" style="height: 350px !important; min-height: 350px !important; max-height: 350px !important;"></div>
          <div id="ml-scatter-chart" class="chart-box glass-inner" style="height: 350px !important; min-height: 350px !important; max-height: 350px !important;"></div>
        </div>

        <transition name="expand-down">
          <div v-if="store.predictData" class="predict-expand-wrapper">
            <div style="margin-top: 25px; padding-top: 25px; border-top: 1px dashed rgba(0,0,0,0.1);">
              <h4 style="color: #9254de; margin-top: 0; margin-bottom: 15px;">✨ 未知数据推理结果</h4>

              <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div class="glass-inner" style="flex: 1; text-align: center; padding: 10px;">
                  <div style="font-size: 0.85rem; color: #888;">平均预测置信度</div>
                  <div style="font-size: 1.8rem; color: #52c41a; font-weight: bold;">{{ store.predictData.confidence }}<span style="font-size: 1rem;">%</span></div>
                </div>
                <div class="glass-inner" style="flex: 1; text-align: center; padding: 10px;">
                  <div style="font-size: 0.85rem; color: #888;">测试样本量</div>
                  <div style="font-size: 1.8rem; color: #1890ff; font-weight: bold;">{{ store.predictData.sampleSize }}<span style="font-size: 1rem;">条</span></div>
                </div>
              </div>

              <div id="new-predict-chart" class="chart-box glass-inner" style="height: 300px !important; min-height: 300px !important; width: 100%;"></div>

              <div style="margin-top: 15px; padding: 18px; background: rgba(114, 46, 209, 0.08); border-left: 4px solid #722ed1; border-radius: 0 8px 8px 0; animation: fadeIn 0.8s ease;">
                <h5 style="color: #9254de; margin: 0 0 8px 0; font-size: 1rem; display: flex; align-items: center; gap: 6px;">
                  💡 智能图表解读：
                </h5>
                <div style="font-size: 0.95rem; line-height: 1.6; opacity: 0.85;" v-html="store.predictData.insight.replace(/\*\*(.*?)\*\*/g, '<strong style=\'color: #722ed1;\'>$1</strong>')"></div>
              </div>
            </div>
          </div>
        </transition>
      </div>

    </main>
  </div>
</template>

<style scoped src="./DataScreen.css"></style>