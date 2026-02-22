import { reactive, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

export const store = reactive({
  isEntered: false, isDarkMode: false, showUploadModal: false, uploadedFileName: '',
  showPreview: false, showStats: false, showCharts: false, showAdvanced: false, showTTest: false,
  isDragging: false, fileInfo: null, cleanResult: null, selectedVars: [], isStandardized: false, currentDataFile: '', selectedGroupVar: '',
  previewData: null, statsResult: null, ttestResult: null, chartsData: [], // 彻底移除了 catChartsData
  showVisControl: false, visActiveVars: [], advancedResult: null,
  dialog: { show: false, title: '', message: '', type: 'alert', onConfirm: null },
  showManualModal: false, manualGrid: [],
  showAiSummary: false, aiSummaryText: [], showRadar: false, radarIdCol: '', radarOptions: [], selectedRadarTarget: '', radarResult: null,

  // ======== 全新：极客日志系统 ========
  showLogs: false,
  logs: []
})

export const actions = {
  // ======== 全新：写日志方法 ========
  addLog(msg, type = 'info') {
      const time = new Date().toLocaleTimeString();
      const prefix = type === 'error' ? '❌ [ERROR]' : type === 'success' ? '✅ [SUCCESS]' : '⚡ [SYSTEM]';
      store.logs.push(`[${time}] ${prefix} ${msg}`);
      // 保持日志不超过 50 条，防止内存溢出
      if (store.logs.length > 50) store.logs.shift();
      // 自动滚动到底部的逻辑在组件里实现
  },

  // ======== 全新：初始化自动深浅色模式 ========
  initTheme() {
      const hour = new Date().getHours();
      // 晚上 18 点到早上 6 点自动开启暗黑模式
      if (hour >= 18 || hour < 6) {
          store.isDarkMode = true;
          document.body.classList.add('dark-mode');
          actions.addLog("已根据当前时间自动切换至【夜间模式】", "info");
      } else {
          store.isDarkMode = false;
          document.body.classList.remove('dark-mode');
          actions.addLog("已根据当前时间自动切换至【白天模式】", "info");
      }
  },

  showDialog(options) {
    store.dialog.title = options.title || '提示'; store.dialog.message = options.message || '';
    store.dialog.type = options.type || 'alert';
    store.dialog.onConfirm = () => { if (options.onConfirm) options.onConfirm(); store.dialog.show = false; };
    store.dialog.show = true;
  },

  handleDrop(e) { store.isDragging = false; const files = e.dataTransfer.files; if (files.length > 0) actions.uploadFile(files[0]); },
  handleFileSelect(e) { const files = e.target.files; if (files.length > 0) actions.uploadFile(files[0]); },

  resetSystemState() {
    store.fileInfo = null; store.cleanResult = null; store.statsResult = null; store.chartsData = []; store.advancedResult = null; store.isStandardized = false; store.ttestResult = null; store.selectedGroupVar = ''; store.previewData = null;
    store.showPreview = false; store.showStats = false; store.showCharts = false; store.showAdvanced = false; store.showTTest = false; store.showVisControl = false;
    store.showAiSummary = false; store.aiSummaryText = []; store.showRadar = false; store.radarIdCol = ''; store.radarOptions = []; store.selectedRadarTarget = ''; store.radarResult = null;
  },

  async uploadFile(file) {
    actions.resetSystemState();
    actions.addLog(`开始读取文件: ${file.name}...`);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/upload', formData);
      if(res.data.status === 'success') {
        store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename; store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns];
        if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0];
        store.showUploadModal = true;
        actions.addLog(`文件读取完成！识别出 ${store.fileInfo.row_count} 行数据，${store.fileInfo.numeric_columns.length} 个分析变量。`, "success");
      }
    } catch (err) { actions.addLog(`文件解析失败: ${err.message}`, "error"); actions.showDialog({ title: '❌ 上传失败', message: '文件解析失败。' }); }
  },

  openManualEditor() { store.manualGrid = [['姓名', '数学', '英语', '性别'],['张三', '85', '78', '男'],['李四', '92', '88', '女'],['王五', '60', '75', '男']]; store.showManualModal = true; },
  addGridRow() { const cols = store.manualGrid[0].length; store.manualGrid.push(new Array(cols).fill('')); },
  addGridCol() { const newColName = `新变量${store.manualGrid[0].length + 1}`; store.manualGrid[0].push(newColName); for(let i=1; i<store.manualGrid.length; i++) { store.manualGrid[i].push(''); } },
  removeGridRow(idx) { if(store.manualGrid.length > 2) store.manualGrid.splice(idx, 1); },
  removeGridCol(idx) { if(store.manualGrid[0].length > 1) store.manualGrid.forEach(row => row.splice(idx, 1)); },
  async submitManualGrid() {
      if(store.manualGrid.length < 2) return actions.showDialog({ title: '提示', message: '请至少输入一行数据！' });
      actions.resetSystemState();
      actions.addLog("开始提交在线表格数据...");
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/upload_manual', { grid: store.manualGrid });
          if(res.data.status === 'success') {
              store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename; store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns];
              if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0];
              store.showManualModal = false; store.showUploadModal = true;
              actions.addLog("在线表格构建成功并已存入缓存！", "success");
          }
      } catch(err) {
          actions.addLog("表格提交失败，请检查数据格式。", "error");
          const errMsg = err.response?.data?.message || '后端服务异常'; actions.showDialog({ title: '❌ 提交失败', message: errMsg });
      }
  },

  async runAiSummary() {
      if (store.showAiSummary) { store.showAiSummary = false; actions.addLog("已收起 AI 智能解读面板"); return; }
      actions.addLog("正在启动 AI 智能引擎分析全局数据...");
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/analyze/summary', { filename: store.currentDataFile });
          if(res.data.status === 'success') {
              store.aiSummaryText = res.data.data;
              store.showAiSummary = true;
              actions.addLog("AI 解读报告生成完毕，正在打字输出...", "success");
          }
      } catch (err) {
          const realError = err.response?.data?.message || '网络或服务器断开连接';
          actions.addLog(`AI 分析失败: ${realError}`, "error");
          actions.showDialog({ title: '❌ AI 分析失败', message: `错误原因：${realError}` });
      }
  },

  async fetchRadarOptions() {
      if (!store.radarIdCol) return;
      actions.addLog(`正在拉取雷达图个体选项 [${store.radarIdCol}]...`);
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/get_options', { filename: store.currentDataFile, column: store.radarIdCol });
          if(res.data.status === 'success') { store.radarOptions = res.data.data; store.selectedRadarTarget = ''; actions.addLog(`选项拉取成功，共 ${store.radarOptions.length} 条`); }
      } catch(err) { actions.addLog("拉取个体选项失败", "error"); }
  },

  async runRadarChart() {
      if (store.showRadar) { store.showRadar = false; actions.addLog("已收起雷达图面板"); return; }
      if (!store.radarIdCol || !store.selectedRadarTarget) return actions.showDialog({title:'提示', message:'请先选择身份列和具体个体！'});
      actions.addLog(`正在计算群体均值与 [${store.selectedRadarTarget}] 的个体多维数据...`);
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/visualize/radar', { filename: store.currentDataFile, id_col: store.radarIdCol, target_val: store.selectedRadarTarget });
          if(res.data.status === 'success') {
              store.radarResult = res.data.data; store.showRadar = true;
              actions.addLog(`雷达图数据计算完成，正在渲染...`, "success");
              setTimeout(() => {
                 const dom = document.getElementById('radar-container');
                 if (dom) {
                     let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                     chart.setOption({
                         title: { text: `${store.radarResult.target_name} vs 群体平均`, left: 'center' }, tooltip: { trigger: 'item' }, legend: { bottom: 0, data: ['群体平均', store.radarResult.target_name] }, radar: { indicator: store.radarResult.indicators, radius: '65%' },
                         series: [{ type: 'radar', data: [ { value: store.radarResult.avg_data, name: '群体平均', itemStyle: {color: '#aaa'}, areaStyle: {color: 'rgba(170,170,170,0.3)'} }, { value: store.radarResult.target_data, name: store.radarResult.target_name, itemStyle: {color: '#E6A23C'}, areaStyle: {color: 'rgba(230,162,60,0.4)'}, lineStyle: {width: 3} } ], animationDuration: 1500 }]
                     });
                 }
              }, 300);
          }
      } catch (err) { actions.addLog("雷达图计算失败", "error"); actions.showDialog({ title: '生成失败', message: err.response?.data?.message || '无法生成' }); }
  },

  async togglePreview() { if (store.showPreview) { store.showPreview = false; return; } actions.addLog("正在拉取数据预览..."); try { const res = await axios.post('http://127.0.0.1:5000/api/preview', { filename: store.currentDataFile }); if(res.data.status === 'success') { store.previewData = res.data.data; store.showPreview = true; actions.addLog("预览数据加载完毕"); } } catch (err) {} },
  exportToCSV(headers, rows, exportFilename) { actions.addLog(`正在导出文件: ${exportFilename}.csv`, "success"); let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\r\n"; rows.forEach(row => { csvContent += headers.map(h => row[h] !== undefined ? row[h] : "").join(",") + "\r\n"; }); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", exportFilename + ".csv"); document.body.appendChild(link); link.click(); },
  async triggerDataCleaning() { actions.addLog("正在执行全自动数据清洗..."); try { const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename }); if(res.data.status === 'success') { store.cleanResult = res.data.data; store.currentDataFile = res.data.data.cleaned_filename; store.showPreview = false; actions.addLog(`清洗完成: 处理了空值和异常值，生成新文件 ${store.currentDataFile}`, "success"); } } catch (err) {} },
  async triggerStandardization() { actions.showDialog({ type: 'confirm', title: '⚙️ 确认标准化', message: '确定要执行 Z-score 吗？', onConfirm: async () => { actions.addLog("开始执行 Z-score 标准化计算..."); try { const res = await axios.post('http://127.0.0.1:5000/api/standardize', { filename: store.cleanResult.cleaned_filename }); if(res.data.status === 'success') { store.currentDataFile = res.data.data.std_filename; store.isStandardized = true; store.showPreview = false; actions.addLog("标准化完成！数据已消除量纲影响。", "success"); } } catch (err) {} } }); },
  undoStandardization() { actions.showDialog({ type: 'confirm', title: '↩️ 撤回标准化', message: '确定要撤回吗？', onConfirm: () => { store.currentDataFile = store.cleanResult.cleaned_filename; store.isStandardized = false; store.showStats = false; store.showCharts = false; store.showAdvanced = false; store.showTTest = false; actions.addLog("已撤销标准化，恢复为原始清洗数据"); } }); },
  async runDescriptiveStats() { if (store.showStats) { store.showStats = false; return; } if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' }); actions.addLog("正在进行描述性统计计算(均值、标准差等)..."); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/descriptive', { filename: store.currentDataFile, columns: store.selectedVars }); if(res.data.status === 'success') { store.statsResult = res.data.data; store.showStats = true; actions.addLog("描述统计计算完成！", "success"); } } catch (err) {} },
  async runTTest() { if (store.showTTest) { store.showTTest = false; return; } if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少必要变量！' }); actions.addLog(`正在执行独立样本 t 检验 (分组: ${store.selectedGroupVar})...`); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/ttest', { filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars }); if(res.data.status === 'success') { store.ttestResult = res.data.data; store.showTTest = true; actions.addLog("t 检验矩阵计算完成！", "success"); } else { actions.showDialog({ title: '计算失败', message: res.data.message }); } } catch (err) {} },

  // ======== 终极修复：彻底去除了饼图，图表渲染变纯粹 ========
  renderCharts() {
      const toolbox = { feature: { saveAsImage: { name: '图表', pixelRatio: 2 } } };
      const initChart = (domId, options) => { const dom = document.getElementById(domId); if (dom) { let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear(); chart.setOption({...options, toolbox, animation: true, animationDuration: 1000}); } };
      store.chartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => {
          initChart(`hist-${item.variable}`, { title: { text: `${item.variable} - 分布`, left: 'center' }, tooltip: {}, xAxis: { type: 'category', data: item.histogram.categories }, yAxis: { type: 'value' }, series: [{ data: item.histogram.series, type: 'bar', itemStyle: {color: '#5470c6'} }] });
          initChart(`box-${item.variable}`, { title: { text: `${item.variable} - 箱线图`, left: 'center' }, tooltip: {}, xAxis: { type: 'category', data: [item.variable] }, yAxis: { type: 'value', scale: true }, series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: {color: '#fac858'} }] });
      });
      actions.addLog("ECharts 引擎渲染完成！", "success");
  },
  async generateCharts() {
      if (store.showCharts) { store.showCharts = false; store.showVisControl = false; return; }
      if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' });
      actions.addLog("正在提取数据特征点以绘制可视化图表...");
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/visualize/distribution', { filename: store.currentDataFile, columns: store.selectedVars });
          if(res.data.status === 'success') {
              store.chartsData = res.data.data;
              // 彻底干掉获取分类饼图的请求，一劳永逸！
              store.visActiveVars = [...store.selectedVars]; // 默认勾选全部
              store.showCharts = true;
              store.showVisControl = true;
          }
      } catch (error) {}
  },

  async runAdvancedAnalysis() { if (store.showAdvanced) { store.showAdvanced = false; return; } if (store.selectedVars.length < 2) return actions.showDialog({ title: '提示', message: '至少勾选 2 个变量！' }); actions.addLog("正在执行正态性检验及相关性热力图运算..."); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/advanced', { filename: store.currentDataFile, columns: store.selectedVars }); if(res.data.status === 'success') { store.advancedResult = res.data.data; store.showAdvanced = true; actions.addLog("复杂矩阵降维计算完成！", "success"); setTimeout(() => { const heatDom = document.getElementById('heatmap-container'); if (heatDom && res.data.data.correlation_matrix.length > 0) { let chart = echarts.getInstanceByDom(heatDom) || echarts.init(heatDom); chart.clear(); chart.setOption({ title: { text: '相关性热力图', left: 'center' }, toolbox: { feature: { saveAsImage: { name: '热力图' } } }, tooltip: { position: 'top', formatter: (params) => `${res.data.data.variables[params.value[0]]} vs ${res.data.data.variables[params.value[1]]}: ${params.value[2]}` }, grid: { height: '60%', top: '15%' }, xAxis: { type: 'category', data: res.data.data.variables, axisLabel: { rotate: 30 } }, yAxis: { type: 'category', data: res.data.data.variables }, visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } }, series: [{ name: 'Correlation', type: 'heatmap', data: res.data.data.correlation_matrix, label: { show: true } }], animation: true, animationDuration: 1000 }); } const scatDom = document.getElementById('scatter-container'); if (scatDom && res.data.data.scatter_data.length > 0) { let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom); chart.clear(); chart.setOption({ title: { text: `散点图：${res.data.data.scatter_vars[0]} vs ${res.data.data.scatter_vars[1]}`, left: 'center' }, toolbox: { feature: { saveAsImage: { name: '散点图', pixelRatio: 2 } } }, xAxis: { name: res.data.data.scatter_vars[0], type: 'value', scale: true }, yAxis: { name: res.data.data.scatter_vars[1], type: 'value', scale: true }, tooltip: { trigger: 'item', formatter: '{c}' }, series: [{ symbolSize: 12, data: res.data.data.scatter_data, type: 'scatter', itemStyle: { color: '#ee6666' } }], animation: true, animationDuration: 1000 }); } }, 300); } } catch (error) {} },
  async triggerCleanup() { actions.showDialog({ type: 'confirm', title: '🧹 清理系统缓存', message: '确定要清理吗？', onConfirm: async () => { actions.addLog("发出清空指令，销毁内存中的文件碎片..."); try { await axios.post('http://127.0.0.1:5000/api/cleanup'); actions.resetSystemState(); store.isEntered = false; store.logs = []; } catch (err) {} } }); }
}