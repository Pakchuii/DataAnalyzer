import axios from 'axios'

export function setupFile(store, actions) {
    return {
        handleDrop(e) { store.isDragging = false; if (e.dataTransfer.files.length > 0) actions.uploadFile(e.dataTransfer.files[0]); },
        handleFileSelect(e) { if (e.target.files.length > 0) actions.uploadFile(e.target.files[0]); },
        async uploadFile(file) {
            actions.resetSystemState(); actions.addLog(`开始读取文件: ${file.name}...`);
            const formData = new FormData(); formData.append('file', file);
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/upload', formData);
                if (res.data.status === 'success') {
                    store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename;
                    store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns];
                    if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0];
                    store.showUploadModal = true;
                    actions.addLog(`文件读取完成！识别出 ${store.fileInfo.row_count} 行数据，${store.fileInfo.numeric_columns.length} 个分析变量。`, "success");
                }
            } catch (err) { actions.addLog(`文件解析失败: ${err.message}`, "error"); actions.showDialog({ title: '❌ 上传失败', message: '文件解析失败。' }); }
        },
        openManualEditor() { store.manualGrid = [['姓名', '数学', '英语', '性别'], ['张三', '85', '78', '男'], ['李四', '92', '88', '女'], ['王五', '60', '75', '男']]; store.showManualModal = true; },
        addGridRow() { store.manualGrid.push(new Array(store.manualGrid[0].length).fill('')); },
        addGridCol() { const newColName = `新变量${store.manualGrid[0].length + 1}`; store.manualGrid[0].push(newColName); for (let i = 1; i < store.manualGrid.length; i++) store.manualGrid[i].push(''); },
        removeGridRow(idx) { if (store.manualGrid.length > 2) store.manualGrid.splice(idx, 1); },
        removeGridCol(idx) { if (store.manualGrid[0].length > 1) store.manualGrid.forEach(row => row.splice(idx, 1)); },
        async submitManualGrid() {
            if (store.manualGrid.length < 2) return actions.showDialog({ title: '提示', message: '请至少输入一行数据！' });
            actions.resetSystemState(); actions.addLog("开始提交在线表格数据...");
            try {
                const res = await axios.post('http://127.0.0.1:5000/api/upload_manual', { grid: store.manualGrid });
                if (res.data.status === 'success') {
                    store.fileInfo = res.data.data; store.uploadedFileName = res.data.data.original_filename;
                    store.currentDataFile = res.data.data.filename; store.selectedVars = [...res.data.data.numeric_columns];
                    if (res.data.data.binary_columns.length > 0) store.selectedGroupVar = res.data.data.binary_columns[0];
                    store.showManualModal = false; store.showUploadModal = true; actions.addLog("在线表格构建成功并已存入缓存！", "success");
                }
            } catch(err) { actions.addLog("表格提交失败", "error"); actions.showDialog({ title: '❌ 提交失败', message: err.response?.data?.message || '后端服务异常' }); }
        },
        async triggerCleanup() {
            actions.showDialog({
                type: 'confirm', title: '🧹 清理系统缓存', message: '确定要清理吗？',
                onConfirm: async () => {
                    actions.addLog("发出清空指令...");
                    try { await axios.post('http://127.0.0.1:5000/api/cleanup'); actions.resetSystemState(); store.isEntered = false; store.logs = []; } catch (err) {}
                }
            });
        },
        confirmExitToMainMenu() {
            store.showExitConfirm = false; actions.resetSystemState(); store.isEntered = false; actions.addLog("🚪 已返回主菜单", "info");
        }
    };
}