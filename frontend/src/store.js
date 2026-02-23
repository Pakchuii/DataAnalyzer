import { reactive, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('DataAnalyzerDB', 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings'); // 创建一个名为 settings 的仓库
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});
// ==========================================
// 全局状态管理 (Store)
// ==========================================
export const store = reactive({
    // 系统核心状态
    isEntered: false,
    isDarkMode: false,

    // 文件与基础数据
    showUploadModal: false,
    uploadedFileName: '',
    isDragging: false,
    fileInfo: null,
    currentDataFile: '',
    selectedGroupVar: '',
    selectedVars: [],

    // UI 控制开关
    showPreview: false,
    showStats: false,
    showCharts: false,
    showAdvanced: false,
    showTTest: false,
    showVisControl: false,

    // 数据处理结果缓存
    cleanResult: null,
    isStandardized: false,
    previewData: null,
    statsResult: null,
    ttestResult: null,
    chartsData: [],
    visActiveVars: [],
    advancedResult: null,

    // 弹窗与交互状态
    dialog: { show: false, title: '', message: '', type: 'alert', onConfirm: null },

    // 在线表格编辑器
    showManualModal: false,
    manualGrid: [],

    // AI 与雷达图
    showAiSummary: false,
    aiSummaryText: [],
    showRadar: false,
    radarIdCol: '',
    radarOptions: [],
    selectedRadarTarget: '',
    radarResult: null,

    // 机器学习模型
    mlTargetVar: '',
    mlFeatureVars: [],
    mlResult: null,
    showML: false,

    // 安全与脱敏协议
    isMasked: false,
    preMaskedFile: '',

    // 极客日志系统
    showLogs: false,
    logs: [],

    // ======== 全新：个性化设置与作者名片 ========
  showSettings: false,
  bgType: 'default', // 'default', 'image', 'video'
  bgUrl: '',
  windowTint: '', // 窗口色彩滤镜
  glassOpacity: 0.65,
});

// ==========================================
// 核心业务行为 (Actions)
// ==========================================
export const actions = {


 // ======== 全新增强：持久化设置面板控制与壁纸引擎 ========

  // 1. 初始化读取本地缓存
  async initSettings() {
      // 读取滤镜颜色
      const savedTint = localStorage.getItem('customWindowTint');
      if (savedTint) store.windowTint = savedTint;

      // 读取透明度
      const savedOpacity = localStorage.getItem('customGlassOpacity');
      if (savedOpacity) store.glassOpacity = parseFloat(savedOpacity);

      // 读取庞大的媒体壁纸 (从 IndexedDB)
      try {
          const db = await openDB();
          const tx = db.transaction('settings', 'readonly');
          const req = tx.objectStore('settings').get('customBgBlob');
          req.onsuccess = () => {
              const fileBlob = req.result;
              if (fileBlob) {
                  store.bgUrl = URL.createObjectURL(fileBlob);
                  store.bgType = localStorage.getItem('customBgType') || 'image';
                  actions.addLog("💾 成功从本地缓存中加载自定义壁纸！", "success");
              }
          };
      } catch (e) {
          console.log("无本地壁纸缓存");
      }

      // 启动时，强制应用颜色和透明度
      actions.applyThemeColor();
  },

  // 2. 处理壁纸上传并存入数据库 (保持不变)
  async handleBgUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (store.bgUrl) URL.revokeObjectURL(store.bgUrl);

      const fileUrl = URL.createObjectURL(file);
      store.bgUrl = fileUrl;
      store.bgType = file.type.startsWith('video/') ? 'video' : 'image';

      actions.addLog(`🎨 正在应用壁纸并写入本地硬盘：${file.name}...`, "info");

      try {
          const db = await openDB();
          const tx = db.transaction('settings', 'readwrite');
          tx.objectStore('settings').put(file, 'customBgBlob');
          localStorage.setItem('customBgType', store.bgType);
          actions.addLog("💾 壁纸已持久化保存，下次打开自动加载！", "success");
      } catch(err) {
          actions.addLog("壁纸缓存失败，可能是文件超出限制", "error");
      }
  },

  // 3. 恢复默认并清理硬盘缓存 (保持不变)
  async resetBackground() {
      if (store.bgUrl) URL.revokeObjectURL(store.bgUrl);
      store.bgType = 'default';
      store.bgUrl = '';

      try {
          const db = await openDB();
          const tx = db.transaction('settings', 'readwrite');
          tx.objectStore('settings').delete('customBgBlob');
          localStorage.removeItem('customBgType');
          actions.addLog("🔄 已恢复系统默认壁纸，并彻底清理本地壁纸缓存！", "success");
      } catch(err) {}
  },

  // 4. 设置预设滤镜 (增加调用引擎)
  setWindowTint(colorRgba) {
      store.windowTint = colorRgba;
      localStorage.setItem('customWindowTint', colorRgba);
      actions.applyThemeColor(); // 通知引擎重新渲染颜色和透明度
      actions.addLog("🌈 系统主题滤镜已切换并保存", "success");
  },

  // 5. 处理原生拾色器的自由调色 (增加调用引擎)
  handleCustomTint(e) {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      // 这里随便给个初始透明度，反正等下引擎会把它覆盖成滑块的透明度
      const rgbaColor = `rgba(${r}, ${g}, ${b}, 0.65)`;

      store.windowTint = rgbaColor;
      localStorage.setItem('customWindowTint', rgbaColor);
      actions.applyThemeColor(); // 通知引擎重新渲染颜色和透明度
      actions.addLog(`🎨 毛玻璃主题色已切换为 ${hex}`, "info");
  },

  // 6. 【全新补全】真正的色彩与透明度渲染引擎！
  applyThemeColor() {
      let color = store.windowTint;
      let r, g, b;

      if (!color) {
          // 如果没有选颜色，默认给个深浅模式的底色
          r = store.isDarkMode ? 25 : 255;
          g = store.isDarkMode ? 25 : 255;
          b = store.isDarkMode ? 35 : 255;
      } else {
          // 黑科技：用正则强行提取当前颜色里的 R, G, B 数值
          const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
              r = match[1]; g = match[2]; b = match[3];
          } else {
              r = 255; g = 255; b = 255;
          }
      }

      // 把提取出的 RGB，配上滑块的最新透明度！
      const finalColor = `rgba(${r}, ${g}, ${b}, ${store.glassOpacity})`;
      store.windowTint = finalColor; // 同步给老代码

      // 强行注入 CSS 全局变量（确保所有毛玻璃都能吃到）
      document.documentElement.style.setProperty('--glass-theme-color', finalColor);
  },

  // 7. 【全新补全】处理透明度滑动条拖拽
  handleOpacityChange(e) {
      const val = parseFloat(e.target.value);
      store.glassOpacity = val;
      localStorage.setItem('customGlassOpacity', val);
      actions.applyThemeColor(); // 滑动时实时刷新界面！
  },

    /**
     * 系统日志写入工具
     */
    addLog(msg, type = 'info') {
        const time = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌ [ERROR]' : type === 'success' ? '✅ [SUCCESS]' : '⚡ [SYSTEM]';
        store.logs.push(`[${time}] ${prefix} ${msg}`);
        if (store.logs.length > 50) store.logs.shift();
    },

    /**
     * 根据时间自动初始化日夜间主题
     */
    initTheme() {
        const hour = new Date().getHours();
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

    /**
     * 全局对话框触发器
     */
    showDialog(options) {
        store.dialog.title = options.title || '提示';
        store.dialog.message = options.message || '';
        store.dialog.type = options.type || 'alert';
        store.dialog.onConfirm = () => {
            if (options.onConfirm) options.onConfirm();
            store.dialog.show = false;
        };
        store.dialog.show = true;
    },

    // ------------------- 文件与数据源管理 -------------------

    handleDrop(e) {
        store.isDragging = false;
        const files = e.dataTransfer.files;
        if (files.length > 0) actions.uploadFile(files[0]);
    },

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) actions.uploadFile(files[0]);
    },

    resetSystemState() {
        store.fileInfo = null;
        store.cleanResult = null;
        store.statsResult = null;
        store.chartsData = [];
        store.advancedResult = null;
        store.isStandardized = false;
        store.ttestResult = null;
        store.selectedGroupVar = '';
        store.previewData = null;
        store.showPreview = false;
        store.showStats = false;
        store.showCharts = false;
        store.showAdvanced = false;
        store.showTTest = false;
        store.showVisControl = false;
        store.showAiSummary = false;
        store.aiSummaryText = [];
        store.showRadar = false;
        store.radarIdCol = '';
        store.radarOptions = [];
        store.selectedRadarTarget = '';
        store.radarResult = null;
        store.isMasked = false;
        store.mlTargetVar = '';
        store.mlFeatureVars = [];
        store.mlResult = null;
        store.showML = false;
    },

    async uploadFile(file) {
        actions.resetSystemState();
        actions.addLog(`开始读取文件: ${file.name}...`);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://127.0.0.1:5000/api/upload', formData);
            if (res.data.status === 'success') {
                store.fileInfo = res.data.data;
                store.uploadedFileName = res.data.data.original_filename;
                store.currentDataFile = res.data.data.filename;
                store.selectedVars = [...res.data.data.numeric_columns];
                if (res.data.data.binary_columns.length > 0) {
                    store.selectedGroupVar = res.data.data.binary_columns[0];
                }
                store.showUploadModal = true;
                actions.addLog(`文件读取完成！识别出 ${store.fileInfo.row_count} 行数据，${store.fileInfo.numeric_columns.length} 个分析变量。`, "success");
            }
        } catch (err) {
            actions.addLog(`文件解析失败: ${err.message}`, "error");
            actions.showDialog({ title: '❌ 上传失败', message: '文件解析失败。' });
        }
    },

    // ------------------- 在线表格编辑器 -------------------

    openManualEditor() {
        store.manualGrid = [
            ['姓名', '数学', '英语', '性别'],
            ['张三', '85', '78', '男'],
            ['李四', '92', '88', '女'],
            ['王五', '60', '75', '男']
        ];
        store.showManualModal = true;
    },

    addGridRow() {
        const cols = store.manualGrid[0].length;
        store.manualGrid.push(new Array(cols).fill(''));
    },

    addGridCol() {
        const newColName = `新变量${store.manualGrid[0].length + 1}`;
        store.manualGrid[0].push(newColName);
        for (let i = 1; i < store.manualGrid.length; i++) {
            store.manualGrid[i].push('');
        }
    },

    removeGridRow(idx) {
        if (store.manualGrid.length > 2) store.manualGrid.splice(idx, 1);
    },

    removeGridCol(idx) {
        if (store.manualGrid[0].length > 1) {
            store.manualGrid.forEach(row => row.splice(idx, 1));
        }
    },

    async submitManualGrid() {
        if (store.manualGrid.length < 2) {
            return actions.showDialog({ title: '提示', message: '请至少输入一行数据！' });
        }
        actions.resetSystemState();
        actions.addLog("开始提交在线表格数据...");

        try {
            const res = await axios.post('http://127.0.0.1:5000/api/upload_manual', { grid: store.manualGrid });
            if (res.data.status === 'success') {
                store.fileInfo = res.data.data;
                store.uploadedFileName = res.data.data.original_filename;
                store.currentDataFile = res.data.data.filename;
                store.selectedVars = [...res.data.data.numeric_columns];
                if (res.data.data.binary_columns.length > 0) {
                    store.selectedGroupVar = res.data.data.binary_columns[0];
                }
                store.showManualModal = false;
                store.showUploadModal = true;
                actions.addLog("在线表格构建成功并已存入缓存！", "success");
            }
        } catch(err) {
            actions.addLog("表格提交失败，请检查数据格式。", "error");
            const errMsg = err.response?.data?.message || '后端服务异常';
            actions.showDialog({ title: '❌ 提交失败', message: errMsg });
        }
    },

    // ------------------- 数据清洗与预处理 -------------------

    async togglePreview() {
        if (store.showPreview) {
            store.showPreview = false;
            return;
        }
        actions.addLog("正在拉取数据预览...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/preview', { filename: store.currentDataFile });
            if (res.data.status === 'success') {
                store.previewData = res.data.data;
                store.showPreview = true;
                actions.addLog("预览数据加载完毕");
            }
        } catch (err) {}
    },

    exportToCSV(headers, rows, exportFilename) {
        actions.addLog(`正在导出文件: ${exportFilename}.csv`, "success");
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\r\n";
        rows.forEach(row => {
            csvContent += headers.map(h => row[h] !== undefined ? row[h] : "").join(",") + "\r\n";
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", exportFilename + ".csv");
        document.body.appendChild(link);
        link.click();
    },

    async triggerDataCleaning() {
        actions.addLog("正在执行全自动数据清洗...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/clean', { filename: store.fileInfo.filename });
            if (res.data.status === 'success') {
                store.cleanResult = res.data.data;
                store.currentDataFile = res.data.data.cleaned_filename;
                store.showPreview = false;
                actions.addLog(`清洗完成: 处理了空值和异常值，生成新文件 ${store.currentDataFile}`, "success");
            }
        } catch (err) {}
    },

    async triggerStandardization() {
        actions.showDialog({
            type: 'confirm',
            title: '⚙️ 确认标准化',
            message: '确定要执行 Z-score 吗？',
            onConfirm: async () => {
                actions.addLog("开始执行 Z-score 标准化计算...");
                try {
                    const res = await axios.post('http://127.0.0.1:5000/api/standardize', { filename: store.cleanResult.cleaned_filename });
                    if (res.data.status === 'success') {
                        store.currentDataFile = res.data.data.std_filename;
                        store.isStandardized = true;
                        store.showPreview = false;
                        actions.addLog("标准化完成！数据已消除量纲影响。", "success");
                    }
                } catch (err) {}
            }
        });
    },

    undoStandardization() {
        actions.showDialog({
            type: 'confirm',
            title: '↩️ 撤回标准化',
            message: '确定要撤回吗？',
            onConfirm: () => {
                store.currentDataFile = store.cleanResult.cleaned_filename;
                store.isStandardized = false;
                store.showStats = false;
                store.showCharts = false;
                store.showAdvanced = false;
                store.showTTest = false;
                actions.addLog("已撤销标准化，恢复为原始清洗数据");
            }
        });
    },

    // ------------------- 安全脱敏协议 -------------------

    async triggerMasking() {
        if (store.isMasked) return;
        actions.addLog("启动安全协议：正在进行数据脱敏加密...");
        store.preMaskedFile = store.currentDataFile;

        try {
            const res = await axios.post('http://127.0.0.1:5000/api/mask', { filename: store.currentDataFile });
            if (res.data.status === 'success') {
                store.currentDataFile = res.data.data.masked_filename;
                store.isMasked = true;
                const cols = res.data.data.masked_cols.length > 0 ? res.data.data.masked_cols.join(', ') : '无匹配列';
                actions.addLog(`🔒 脱敏完成！已对列 [${cols}] 进行星号遮盖处理。`, "success");

                if (store.showPreview) {
                    store.showPreview = false;
                    setTimeout(() => actions.togglePreview(), 200);
                }
                if (store.radarIdCol) { actions.fetchRadarOptions(); }
            }
        } catch (err) {
            actions.addLog("数据脱敏失败", "error");
        }
    },

    undoMasking() {
        actions.showDialog({
            type: 'confirm',
            title: '🔓 解除脱敏协议',
            message: '确定要解除数据脱敏，恢复明文显示吗？（仅限授权人员操作）',
            onConfirm: () => {
                store.currentDataFile = store.preMaskedFile;
                store.isMasked = false;
                actions.addLog("🔓 已解除隐私脱敏，恢复明文数据展示", "info");
                if (store.showPreview) {
                    store.showPreview = false;
                    setTimeout(() => actions.togglePreview(), 200);
                }
                if (store.radarIdCol) { actions.fetchRadarOptions(); }
            }
        });
    },

    // ------------------- 核心数据分析引擎 -------------------

    async runDescriptiveStats() {
        if (store.showStats) { store.showStats = false; return; }
        if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' });

        actions.addLog("正在进行描述性统计计算(均值、标准差等)...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/analyze/descriptive', { filename: store.currentDataFile, columns: store.selectedVars });
            if (res.data.status === 'success') {
                store.statsResult = res.data.data;
                store.showStats = true;
                actions.addLog("描述统计计算完成！", "success");
            }
        } catch (err) {}
    },

    async runTTest() {
        if (store.showTTest) { store.showTTest = false; return; }
        if (store.selectedVars.length === 0 || !store.selectedGroupVar) return actions.showDialog({ title: '提示', message: '缺少必要变量！' });

        actions.addLog(`正在执行独立样本 t 检验 (分组: ${store.selectedGroupVar})...`);
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/analyze/ttest', { filename: store.currentDataFile, group_col: store.selectedGroupVar, columns: store.selectedVars });
            if (res.data.status === 'success') {
                store.ttestResult = res.data.data;
                store.showTTest = true;
                actions.addLog("t 检验矩阵计算完成！", "success");
            } else {
                actions.showDialog({ title: '计算失败', message: res.data.message });
            }
        } catch (err) {}
    },

    async runAdvancedAnalysis() {
        if (store.showAdvanced) { store.showAdvanced = false; return; }
        if (store.selectedVars.length < 2) return actions.showDialog({ title: '提示', message: '至少勾选 2 个变量！' });

        actions.addLog("正在执行正态性检验及相关性热力图运算...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/analyze/advanced', { filename: store.currentDataFile, columns: store.selectedVars });
            if (res.data.status === 'success') {
                store.advancedResult = res.data.data;
                store.showAdvanced = true;
                actions.addLog("复杂矩阵降维计算完成！", "success");

                setTimeout(() => {
                    const heatDom = document.getElementById('heatmap-container');
                    if (heatDom && res.data.data.correlation_matrix.length > 0) {
                        let chart = echarts.getInstanceByDom(heatDom) || echarts.init(heatDom);
                        chart.clear();
                        chart.setOption({
                            title: { text: '相关性热力图', left: 'center' },
                            toolbox: { feature: { saveAsImage: { name: '热力图' } } },
                            tooltip: { position: 'top', formatter: (params) => `${res.data.data.variables[params.value[0]]} vs ${res.data.data.variables[params.value[1]]}: ${params.value[2]}` },
                            grid: { height: '60%', top: '15%' },
                            xAxis: { type: 'category', data: res.data.data.variables, axisLabel: { rotate: 30 } },
                            yAxis: { type: 'category', data: res.data.data.variables },
                            visualMap: { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#313695', '#e0f3f8', '#a50026'] } },
                            series: [{ name: 'Correlation', type: 'heatmap', data: res.data.data.correlation_matrix, label: { show: true } }],
                            animation: true, animationDuration: 1000
                        });
                    }
                    const scatDom = document.getElementById('scatter-container');
                    if (scatDom && res.data.data.scatter_data.length > 0) {
                        let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom);
                        chart.clear();
                        chart.setOption({
                            title: { text: `散点图：${res.data.data.scatter_vars[0]} vs ${res.data.data.scatter_vars[1]}`, left: 'center' },
                            toolbox: { feature: { saveAsImage: { name: '散点图', pixelRatio: 2 } } },
                            xAxis: { name: res.data.data.scatter_vars[0], type: 'value', scale: true },
                            yAxis: { name: res.data.data.scatter_vars[1], type: 'value', scale: true },
                            tooltip: { trigger: 'item', formatter: '{c}' },
                            series: [{ symbolSize: 12, data: res.data.data.scatter_data, type: 'scatter', itemStyle: { color: '#ee6666' } }],
                            animation: true, animationDuration: 1000
                        });
                    }
                }, 300);
            }
        } catch (error) {}
    },

    // ------------------- 可视化引擎图表渲染 -------------------

    renderCharts() {
        const toolbox = { feature: { saveAsImage: { name: '图表', pixelRatio: 2 } } };
        const initChart = (domId, options) => {
            const dom = document.getElementById(domId);
            if (dom) {
                let chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
                chart.clear();
                chart.setOption({...options, toolbox, animation: true, animationDuration: 1000});
            }
        };

        store.chartsData.filter(item => store.visActiveVars.includes(item.variable)).forEach(item => {
            initChart(`hist-${item.variable}`, {
                title: { text: `${item.variable} - 分布`, left: 'center' },
                tooltip: {},
                xAxis: { type: 'category', data: item.histogram.categories },
                yAxis: { type: 'value' },
                series: [{ data: item.histogram.series, type: 'bar', itemStyle: {color: '#5470c6'} }]
            });
            initChart(`box-${item.variable}`, {
                title: { text: `${item.variable} - 箱线图`, left: 'center' },
                tooltip: {},
                xAxis: { type: 'category', data: [item.variable] },
                yAxis: { type: 'value', scale: true },
                series: [{ type: 'boxplot', data: [item.boxplot], itemStyle: {color: '#fac858'} }]
            });
        });
        actions.addLog("ECharts 引擎渲染完成！", "success");
    },

    async generateCharts() {
        if (store.showCharts) {
            store.showCharts = false;
            store.showVisControl = false;
            return;
        }
        if (store.selectedVars.length === 0) return actions.showDialog({ title: '提示', message: '请勾选数值变量！' });

        actions.addLog("正在提取数据特征点以绘制可视化图表...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/visualize/distribution', { filename: store.currentDataFile, columns: store.selectedVars });
            if (res.data.status === 'success') {
                store.chartsData = res.data.data;
                store.visActiveVars = [...store.selectedVars];
                store.showCharts = true;
                store.showVisControl = true;
            }
        } catch (error) {}
    },

    // ------------------- 智能化引擎 (AI & ML & 雷达图) -------------------

    async runAiSummary() {
        if (store.showAiSummary) { store.showAiSummary = false; actions.addLog("已收起解读面板"); return; }
        actions.addLog("正在分析全局数据...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/analyze/summary', { filename: store.currentDataFile });
            if (res.data.status === 'success') {
                store.aiSummaryText = res.data.data;
                store.showAiSummary = true;
                actions.addLog("解读报告生成完毕，正在输出...", "success");
            }
        } catch (err) {
            const realError = err.response?.data?.message || '网络或服务器断开连接';
            actions.addLog(`分析失败: ${realError}`, "error");
            actions.showDialog({ title: '❌ 分析失败', message: `错误原因：${realError}` });
        }
    },

    async fetchRadarOptions() {
        if (!store.radarIdCol) return;
        actions.addLog(`正在拉取雷达图个体选项 [${store.radarIdCol}]...`);
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/get_options', { filename: store.currentDataFile, column: store.radarIdCol });
            if (res.data.status === 'success') {
                store.radarOptions = res.data.data;
                store.selectedRadarTarget = '';
                actions.addLog(`选项拉取成功，共 ${store.radarOptions.length} 条`);
            }
        } catch(err) {
            actions.addLog("拉取个体选项失败", "error");
        }
    },

    async runRadarChart() {
        if (store.showRadar) { store.showRadar = false; actions.addLog("已收起雷达图面板"); return; }
        if (!store.radarIdCol || !store.selectedRadarTarget) return actions.showDialog({title:'提示', message:'请先选择身份列和具体个体！'});

        actions.addLog(`正在计算群体均值与 [${store.selectedRadarTarget}] 的个体多维数据...`);
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/visualize/radar', { filename: store.currentDataFile, id_col: store.radarIdCol, target_val: store.selectedRadarTarget });
            if (res.data.status === 'success') {
                store.radarResult = res.data.data;
                store.showRadar = true;
                actions.addLog(`雷达图数据计算完成，正在渲染...`, "success");

                setTimeout(() => {
                   const dom = document.getElementById('radar-container');
                   if (dom) {
                       let chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
                       chart.clear();
                       chart.setOption({
                           title: { text: `${store.radarResult.target_name} vs 群体平均`, left: 'center' },
                           tooltip: { trigger: 'item' },
                           legend: { bottom: 0, data: ['群体平均', store.radarResult.target_name] },
                           radar: { indicator: store.radarResult.indicators, radius: '65%' },
                           series: [{
                               type: 'radar',
                               data: [
                                   { value: store.radarResult.avg_data, name: '群体平均', itemStyle: {color: '#aaa'}, areaStyle: {color: 'rgba(170,170,170,0.3)'} },
                                   { value: store.radarResult.target_data, name: store.radarResult.target_name, itemStyle: {color: '#E6A23C'}, areaStyle: {color: 'rgba(230,162,60,0.4)'}, lineStyle: {width: 3} }
                               ],
                               animationDuration: 1500
                           }]
                       });
                   }
                }, 300);
            }
        } catch (err) {
            actions.addLog("雷达图计算失败", "error");
            actions.showDialog({ title: '生成失败', message: err.response?.data?.message || '无法生成' });
        }
    },

    async runMachineLearning() {
        if (store.showML) { store.showML = false; return; }
        if (!store.mlTargetVar || store.mlFeatureVars.length === 0) {
            return actions.showDialog({ title: '提示', message: '请选择一个目标变量和至少一个特征变量！' });
        }

        actions.addLog("启动训练引擎：正在构建随机森林模型...");
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/predict', {
                filename: store.currentDataFile,
                target_col: store.mlTargetVar,
                feature_cols: store.mlFeatureVars
            });

            if (res.data.status === 'success') {
                store.mlResult = res.data.data;
                store.showML = true;
                actions.addLog(`模型训练完毕！R² 得分: ${store.mlResult.r2}`, "success");

                setTimeout(() => {
                    // 特征重要性柱状图
                    const impDom = document.getElementById('ml-importance-chart');
                    if (impDom) {
                        let chart = echarts.getInstanceByDom(impDom) || echarts.init(impDom);
                        chart.setOption({
                            title: { text: '诊断：核心影响因素 (特征重要性)', left: 'center' },
                            tooltip: { formatter: '{b}: {c}%' },
                            xAxis: { type: 'category', data: store.mlResult.features, axisLabel: { interval: 0, rotate: 30 } },
                            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
                            series: [{ data: store.mlResult.importances, type: 'bar', itemStyle: { color: store.isDarkMode ? '#b37feb' : '#722ed1', borderRadius: [4, 4, 0, 0] } }],
                            animationDuration: 1500
                        });
                    }

                    // 真实 vs 预测散点图
                    const scatDom = document.getElementById('ml-scatter-chart');
                    if (scatDom) {
                        const allVals = store.mlResult.scatter.flat();
                        const maxVal = Math.max(...allVals) * 1.1;
                        let chart = echarts.getInstanceByDom(scatDom) || echarts.init(scatDom);
                        chart.setOption({
                            title: { text: '模型检验：真实值 vs 预测值', left: 'center' },
                            tooltip: { formatter: (p) => `真实值: ${p.value[0]}<br/>预测值: ${p.value[1]}` },
                            xAxis: { type: 'value', name: '真实值', scale: true },
                            yAxis: { type: 'value', name: '预测值', scale: true },
                            series: [
                                { name: '预测点', type: 'scatter', data: store.mlResult.scatter, itemStyle: { color: '#fa8c16' } },
                                { name: '完美预测线', type: 'line', data: [[0,0], [maxVal, maxVal]], symbol: 'none', lineStyle: { type: 'dashed', color: '#1890ff', width: 2 } }
                            ],
                            animationDuration: 1500
                        });
                    }
                }, 300);
            }
        } catch (err) {
            actions.addLog("模型训练失败", "error");
            actions.showDialog({ title: '训练失败', message: err.response?.data?.message || '算法异常' });
        }
    },

    // ------------------- PDF 导出闭环核心引擎 -------------------

    async exportPDF() {
        actions.addLog("启动高清 PDF 生成，进入无玻璃化扫描模式...");
        const element = document.getElementById('pdf-report-area');
        if (!element) return actions.addLog("未找到扫描区域", "error");

        actions.showDialog({ title: '📸 正在生成PDF', message: '系统正在剥离特效以确保画面清晰度，屏幕闪烁属于正常扫描现象...' });

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            // ECharts图表转换为纯图片，防止 Canvas 在导出时错位或发虚
            const chartBoxes = element.querySelectorAll('.chart-box');
            const tempImages = [];
            chartBoxes.forEach((box) => {
                const chartInstance = echarts.getInstanceByDom(box);
                if (chartInstance) {
                    const imgUrl = chartInstance.getDataURL({ pixelRatio: 2, backgroundColor: store.isDarkMode ? '#1f1f2e' : '#ffffff' });
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';

                    const canvasDiv = box.querySelector('div');
                    if (canvasDiv) canvasDiv.style.display = 'none';

                    box.appendChild(img);
                    tempImages.push({ box, canvasDiv, img });
                }
            });

            // 强力注入 CSS，瞬间剔除页面毛玻璃和透明特效
            const isDark = store.isDarkMode;
            const printStyle = document.createElement('style');
            printStyle.id = 'pdf-print-style';
            printStyle.innerHTML = `
                #pdf-report-area, .content-area { background: ${isDark ? '#14141f' : '#f0f2f5'} !important; }
                .glass-card, .glass-inner, .glass-table {
                    background: ${isDark ? '#1f1f2e' : '#ffffff'} !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    box-shadow: none !important;
                    border: 1px solid ${isDark ? '#33334d' : '#e8e8e8'} !important;
                }
                .glass-table th { background: ${isDark ? '#2a2a40' : '#fafafa'} !important; }
                .glass-table td, .glass-table th { border-bottom: 1px solid ${isDark ? '#3c3c5c' : '#f0f0f0'} !important; }
                * { text-shadow: none !important; }
            `;
            document.head.appendChild(printStyle);

            // 强制滚动回顶部，防止截图产生空白截断
            const originalScrollY = window.scrollY;
            window.scrollTo(0, 0);
            const elOverflow = element.style.overflow;
            const elHeight = element.style.height;
            element.style.overflow = 'visible';
            element.style.height = 'auto';

            // 调用 html2canvas 执行全景长截图
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: isDark ? '#14141f' : '#f0f2f5',
                windowHeight: element.scrollHeight
            });

            // 扫描完毕，撤销注入的 CSS 样式，恢复页面原始模样
            document.head.removeChild(printStyle);
            element.style.overflow = elOverflow;
            element.style.height = elHeight;
            window.scrollTo(0, originalScrollY);

            tempImages.forEach(({ box, canvasDiv, img }) => {
                if (canvasDiv) canvasDiv.style.display = 'block';
                box.removeChild(img);
            });

            // 生成 PDF 并动态适配长宽
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            const timeStr = new Date().toLocaleTimeString().replace(/:/g, '');
            pdf.save(`PDF数据报_${timeStr}.pdf`);

            store.dialog.show = false;
            actions.addLog("🎉  PDF 生成完毕！", "success");

        } catch (error) {
            store.dialog.show = false;
            actions.addLog(`PDF 引擎渲染失败: ${error.message}`, "error");
            const printStyle = document.getElementById('pdf-print-style');
            if (printStyle) document.head.removeChild(printStyle);
        }
    },

    /**
     * 系统级清理缓存
     */
    async triggerCleanup() {
        actions.showDialog({
            type: 'confirm',
            title: '🧹 清理系统缓存',
            message: '确定要清理吗？',
            onConfirm: async () => {
                actions.addLog("发出清空指令，销毁内存中的文件碎片...");
                try {
                    await axios.post('http://127.0.0.1:5000/api/cleanup');
                    actions.resetSystemState();
                    store.isEntered = false;
                    store.logs = [];
                } catch (err) {}
            }
        });
    }
};