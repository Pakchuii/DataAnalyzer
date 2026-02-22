import { reactive, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

export const store = reactive({
  isEntered: false, isDarkMode: false, showUploadModal: false, uploadedFileName: '',
  showPreview: false, showStats: false, showCharts: false, showAdvanced: false, showTTest: false,
  isDragging: false, fileInfo: null, cleanResult: null, selectedVars: [], isStandardized: false, currentDataFile: '', selectedGroupVar: '',
  previewData: null, statsResult: null, ttestResult: null, catChartsData: [], chartsData: [],
  showVisControl: false, visActiveVars: [], advancedResult: null,
  dialog: { show: false, title: '', message: '', type: 'alert', onConfirm: null },
  showManualModal: false, manualGrid: [],

  // ======== 全新：AI解读与雷达图状态 ========
  showAiSummary: false,
  aiSummaryText: [], // 存放解读段落
  showRadar: false,
  radarIdCol: '', // 用户选择的身份列（例如“姓名”）
  radarOptions: [], // 身份列里的所有选项（例如张三、李四...）
  selectedRadarTarget: '', // 用户选中的那个人
  radarResult: null // 后端返回的雷达图数据
})

export const actions = {
  showDialog(options) {
    store.dialog.title = options.title || '提示'; store.dialog.message = options.message || '';
    store.dialog.type = options.type || 'alert';
    store.dialog.onConfirm = () => { if (options.onConfirm) options.onConfirm(); store.dialog.show = false; };
    store.dialog.show = true;
  },

  handleDrop(e) { store.isDragging = false; const files = e.dataTransfer.files; if (files.length > 0) actions.uploadFile(files[0]); },
  handleFileSelect(e) { const files = e.target.files; if (files.length > 0) actions.uploadFile(files[0]); },

  resetSystemState() {
    store.fileInfo = null; store.cleanResult = null; store.statsResult = null; store.chartsData = []; store.advancedResult = null; store.catChartsData = []; store.isStandardized = false; store.ttestResult = null; store.selectedGroupVar = ''; store.previewData = null;
    store.showPreview = false; store.showStats = false; store.showCharts = false; store.showAdvanced = false; store.showTTest = false; store.showVisControl = false;
    // 重置新功能状态
    store.showAiSummary = false; store.aiSummaryText = []; store.showRadar = false; store.radarIdCol = ''; store.radarOptions = []; store.selectedRadarTarget = ''; store.radarResult = null;
  },

  async uploadFile(file) {
    actions.resetSystemState();
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/upload', formData);
      if(res.data.status === 'success') {
        store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename; store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns];
        if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0];
        store.showUploadModal = true;
      }
    } catch (err) { actions.showDialog({ title: '❌ 上传失败', message: '文件解析失败。' }); }
  },

  // ... (省略手动输入相关代码，保持不变，请确保你复制的是完整文件) ...
  openManualEditor() { store.manualGrid = [['姓名', '数学', '英语', '性别'],['张三', '85', '78', '男'],['李四', '92', '88', '女'],['王五', '60', '75', '男']]; store.showManualModal = true; },
  addGridRow() { const cols = store.manualGrid[0].length; store.manualGrid.push(new Array(cols).fill('')); },
  addGridCol() { const newColName = `新变量${store.manualGrid[0].length + 1}`; store.manualGrid[0].push(newColName); for(let i=1; i<store.manualGrid.length; i++) { store.manualGrid[i].push(''); } },
  removeGridRow(idx) { if(store.manualGrid.length > 2) store.manualGrid.splice(idx, 1); },
  removeGridCol(idx) { if(store.manualGrid[0].length > 1) store.manualGrid.forEach(row => row.splice(idx, 1)); },
  async submitManualGrid() { if(store.manualGrid.length < 2) return actions.showDialog({ title: '提示', message: '请至少输入一行数据！' }); actions.resetSystemState(); try { const res = await axios.post('http://127.0.0.1:5000/api/upload_manual', { grid: store.manualGrid }); if(res.data.status === 'success') { store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename; store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns]; if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0]; store.showManualModal = false; store.showUploadModal = true; } } catch(err) { const errMsg = err.response?.data?.message || '后端服务异常'; actions.showDialog({ title: '❌ 提交失败', message: errMsg }); } },

// ================== 【全新修复】AI 智能解读 Action ==================
  async runAiSummary() {
      if (store.showAiSummary) { store.showAiSummary = false; return; }
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/analyze/summary', { filename: store.currentDataFile });
          if(res.data.status === 'success') {
              store.aiSummaryText = res.data.data;
              store.showAiSummary = true;
          }
      } catch (err) {
          // 核心修复：不再掩盖错误，把后端真实的死因弹出来！
          const realError = err.response?.data?.message || '网络或服务器断开连接';
          actions.showDialog({ title: '❌ AI 分析失败', message: `错误原因：${realError}` });
      }
  },

  // ================== 【全新】雷达图相关 Action ==================
  // 当用户选择身份列（如“姓名”）时，去后端获取这一列的所有唯一值
// ================== 【全新修复】专门获取下拉框选项的逻辑 ==================
  async fetchRadarOptions() {
      if (!store.radarIdCol) return;
      try {
          // 不再蹭画图的接口了，调用专属的选项接口
          const res = await axios.post('http://127.0.0.1:5000/api/get_options', {
              filename: store.currentDataFile,
              column: store.radarIdCol
          });
          if(res.data.status === 'success') {
              store.radarOptions = res.data.data;
              store.selectedRadarTarget = ''; // 获取到新选项后，重置旧的选中状态
          }
      } catch(err) {}
  },
  // 生成雷达图
  async runRadarChart() {
      if (store.showRadar) { store.showRadar = false; return; }
      if (!store.radarIdCol || !store.selectedRadarTarget) return actions.showDialog({title:'提示', message:'请先选择身份列和具体个体！'});
      try {
          const res = await axios.post('http://127.0.0.1:5000/api/visualize/radar', {
              filename: store.currentDataFile,
              id_col: store.radarIdCol,
              target_val: store.selectedRadarTarget
          });
          if(res.data.status === 'success') {
              store.radarResult = res.data.data;
              store.showRadar = true;
              // 延时渲染 ECharts
              setTimeout(() => {
                 const dom = document.getElementById('radar-container');
                 if (dom) {
                     let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear();
                     chart.setOption({
                         title: { text: `${store.radarResult.target_name} vs 群体平均 能力对比`, left: 'center' },
                         tooltip: { trigger: 'item' }, legend: { bottom: 0, data: ['群体平均', store.radarResult.target_name] },
                         radar: { indicator: store.radarResult.indicators, radius: '65%', splitArea: { areaStyle: { color: ['rgba(255,255,255,0.1)', 'rgba(200,200,200,0.1)'] } } },
                         series: [{ type: 'radar', data: [
                             { value: store.radarResult.avg_data, name: '群体平均', itemStyle: {color: '#aaa'}, areaStyle: {color: 'rgba(170,170,170,0.3)'} },
                             { value: store.radarResult.target_data, name: store.radarResult.target_name, itemStyle: {color: '#E6A23C'}, areaStyle: {color: 'rgba(230,162,60,0.4)'}, lineStyle: {width: 3} }
                         ], animationDuration: 1500 }]
                     });
                 }
              }, 300);
          }
      } catch (err) { actions.showDialog({ title: '生成失败', message: err.response?.data?.message || '无法生成雷达图' }); }
  },

  // ... (省略旧的 actions: togglePreview, exportToCSV, triggerDataCleaning, standardize, descriptive, ttest, charts, advanced, cleanup。请确保这些都在！) ...
  async togglePreview() { if (store.showPreview) { store.showPreview = false; return; } try { const res = await axios.post('http://127.0.0.1:5000/api/preview', { filename: store.currentDataFile }); if(res.data.status === 'success') { store.previewData = res.data.data; store.showPreview = true; } } catch (err) {} },
  exportToCSV(headers, rows, exportFilename) { let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\r\n"; rows.forEach(row => { csvContent += headers.map(h => row[h] !== undefined ? row[h] : "").join(",") + "\r\n"; }); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", exportFilename + ".csv"); document.body.appendChild(link); link.click(); },
  async triggerDataCleaning() { try { const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename }); if(res.data.status === 'success') { store.cleanResult = res.data.data; store.currentDataFile = res.data.data.cleaned_filename; store.showPreview = false; } } catch (err) {} },
  async triggerStandardization() { actions.showDialog({ type: 'confirm', title: '⚙️ 确认标准化', message: '确定要执行 Z-score 标准化吗？', onConfirm: async () => { try { const res = await axios.post('http://127.0.0.1:5000/api/standardize', { filename: store.cleanResult.cleaned_filename }); if(res.data.status === 'success') { store.currentDataFile = res.data.data.std_filename; store.isStandardized = true; store.showPreview = false; } } catch (err) {} } }); },
  undoStandardization() { actions.showDialog({ type: 'confirm', title: '↩️ 撤回标准化', message: '确定要撤回标准化吗？', onConfirm: () => { store.currentDataFile = store.cleanResult.cleaned_filename; store.isStandardized = false; store.showStats = false; store.showCharts = false; store.showAdvanced = false; store.showTTest = false; } }); },
  async runDescriptiveStats() { if (store.showStats) { store.showStats = false; return; } if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' }); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/descriptive', { filename: store.currentDataFile, columns: store.selectedVars }); if(res.data.status === 'success') { store.statsResult = res.data.data; store.showStats = true; } } catch (err) {} },
  async runTTest() { if (store.showTTest) { store.showTTest = false; return; } if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少必要变量！' }); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/ttest', { filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars }); if(res.data.status === 'success') { store.ttestResult = res.data.data; store.showTTest = true; } else { actions.showDialog({ title: '计算失败', message: res.data.message }); } } catch (err) {} },
  renderCharts() { const toolbox = { feature: { saveAsImage: { name: '图表', pixelRatio: 2 } } }; const initChart = (domId, options) => { const dom = document.getElementById(domId); if (dom) { let chart = echarts.getInstanceByDom(dom) || echarts.init(dom); chart.clear(); chart.setOption({...options, toolbox, animation: true, animationDuration: 1000}); } }; store.chartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => { initChart(`hist-${item.variable}`, { title: { text: `${item.variable} - 分布`, left: 'center' }, tooltip: {}, xAxis: { type: 'category', data: item.histogram.categories }, yAxis: { type: 'value' }, series: [{ data: item.histogram.series, type: 'bar', itemStyle: {color: '#5470c6'} }] }); initChart(`box-${item.variable}`, { title: { text: `${item.variable} - 箱线图`, left: 'center' }, tooltip: {}, xAxis: { type: 'category', data: [item.variable] }, yAxis: { type: 'value', scale: true }, series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: {color: '#fac858'} }] }); }); store.catChartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => { initChart(`pie-${item.variable}`, { title: { text: `${item.variable} - 占比`, left: 'center' }, tooltip: { trigger: 'item' }, legend: { bottom: '0%' }, series: [{ type: 'pie', radius: '50%', data: item.pie_data }] }); initChart(`cat-bar-${item.variable}`, { title: { text: `${item.variable} - 数量`, left: 'center' }, tooltip: {}, xAxis: { type: 'category', data: item.categories }, yAxis: { type: 'value' }, series: [{ data: item.values, type: 'bar', itemStyle: {color: '#91cc75'} }] }); }); },
  async generateCharts() { if (store.showCharts) { store.showCharts = false; store.showVisControl = false; return; } if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' }); try { const res = await axios.post('http://127.0.0.1:5000/api/visualize/distribution', { filename: store.currentDataFile, columns: store.selectedVars }); if(res.data.status === 'success') { store.chartsData = res.data.data; const catRes = await axios.post('http://127.0.0.1:5000/api/visualize/categorical', { filename: store.currentDataFile }); if(catRes.data.status === 'success') store.catChartsData = catRes.data.data; store.visActiveVars = []; store.showCharts = true; store.showVisControl = true; } } catch (error) {} },
  async runAdvancedAnalysis() { if (store.showAdvanced) { store.showAdvanced = false; return; } if (store.selectedVars.length < 2) return actions.showDialog({ title: '提示', message: '至少勾选 2 个变量！' }); try { const res = await axios.post('http://127.0.0.1:5000/api/analyze/advanced', { filename: store.currentDataFile, columns: store.selectedVars }); if(res.data.status === 'success') { store.advancedResult = res.data.data; store.showAdvanced = true; setTimeout(() => { const heatDom = document.getElementById('heatmap-container'); if (heatDom && res.data.data.correlation_matrix.length > 0) { let chart = echarts.getInstanceByDom(heatDom) || echarts.init(heatDom); chart.clear(); chart.setOption({ title: { text: '相关性热力图', left: 'center' }, toolbox: { feature: { saveAsImage: { name: '热力图' } } }, tooltip: { position: 'top', formatter: (params) => `${res.data.data.variables[params.value[0]]} vs ${res.data.data.variables[params.value[1]]}: ${params.value[2]}` }, grid: { height: '60%', top: '15%' }, xAxis: { type: 'category', data: res.data.data.variables, axisLabel: { rotate: 30 } }, yAxis: { type: 'category', data: res.data.data.variables }, visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } }, series: [{ name: 'Correlation', type: 'heatmap', data: res.data.data.correlation_matrix, label: { show: true } }], animation: true, animationDuration: 1000 }); } const scatDom = document.getElementById('scatter-container'); if (scatDom && res.data.data.scatter_data.length > 0) { let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom); chart.clear(); chart.setOption({ title: { text: `散点图：${res.data.data.scatter_vars[0]} vs ${res.data.data.scatter_vars[1]}`, left: 'center' }, toolbox: { feature: { saveAsImage: { name: '散点图', pixelRatio: 2 } } }, xAxis: { name: res.data.data.scatter_vars[0], type: 'value', scale: true }, yAxis: { name: res.data.data.scatter_vars[1], type: 'value', scale: true }, tooltip: { trigger: 'item', formatter: '{c}' }, series: [{ symbolSize: 12, data: res.data.data.scatter_data, type: 'scatter', itemStyle: { color: '#ee6666' } }], animation: true, animationDuration: 1000 }); } }, 300); } } catch (error) {} },
  async triggerCleanup() { actions.showDialog({ type: 'confirm', title: '🧹 清理系统缓存', message: '确定要清理吗？', onConfirm: async () => { try { await axios.post('http://127.0.0.1:5000/api/cleanup'); actions.resetSystemState(); store.isEntered = false;} catch (err) {} } }); }
}