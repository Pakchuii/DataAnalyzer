import api from '@/core/api.js'

export function setupFile(store, actions) {
    return {
        // 【事件代理机制】：拖拽上传事件拦截与分发
        handleDrop(e) {
            store.isDragging = false;
            if (e.dataTransfer.files.length > 0) actions.uploadFile(e.dataTransfer.files[0]);
        },

        handleFileSelect(e) {
            if (e.target.files.length > 0) actions.uploadFile(e.target.files[0]);
        },

        // 【I/O 引擎】：Multipart 异步文件流传输与挂载
        async uploadFile(file) {
            actions.resetSystemState();
            actions.addLog(`开始读取文件: ${file.name}...`);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await api.post('/api/upload', formData);
                if (res.data.status === 'success') {
                    // 数据挂载与特征字典注册
                    store.fileInfo = res.data.data;
                    store.uploadedFileName = res.data.data.original_filename;
                    store.currentDataFile = res.data.data.filename;
                    store.selectedVars = [...res.data.data.numeric_columns];

                    if (res.data.data.binary_columns.length > 0) {
                        store.selectedGroupVar = res.data.data.binary_columns[0];
                    }
                    store.showUploadModal = true;
                    actions.addLog(`文件读取完成！识别出 ${store.fileInfo.row_count} 行数据，${store.fileInfo.numeric_columns.length} 个分析变量。`, "success");
                    
                    // 核心修复：同步拉取完整预览数据，确保管理系统编辑器同步刷新
                    try {
                        const dataRes = await api.post('/api/data/get_full', { filename: store.currentDataFile });
                        if (dataRes.data.status === 'success') {
                            store.previewData = { headers: dataRes.data.headers, rows: dataRes.data.rows };
                            actions.addLog("数据集预览已同步至内存手术台。", "info");
                        }
                    } catch (e) {
                        console.error("数据预加载失败:", e);
                    }
                }
            } catch (err) {
                actions.addLog(`上传解析失败: ${err.message}`, "error");
                actions.showDialog({ title: '❌ 文件解析失败', message: err.response?.data?.message || '请检查文件格式是否正确。' });
            }
        },

        // 【前端内存计算】：手动表格的二维矩阵构造器
        openManualEditor() {
            actions.resetSystemState();
            store.manualGrid = [
                ["字段1", "字段2", "字段3"],
                ["", "", ""]
            ];
            store.showManualModal = true;
            actions.addLog("已开启在线表格虚拟编辑器");
        },

        // 【数据序列化】：将前端内存矩阵下发至后端持久化
        async submitManualGrid() {
            actions.addLog("正在封装内存表格数据并提交...");
            try {
                const res = await api.post('/api/upload_manual', { grid: store.manualGrid });
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

                    // 核心修复：同步拉取完整预览数据
                    try {
                        const dataRes = await api.post('/api/data/get_full', { filename: store.currentDataFile });
                        if (dataRes.data.status === 'success') {
                            store.previewData = { headers: dataRes.data.headers, rows: dataRes.data.rows };
                        }
                    } catch (e) {
                        console.error("手工数据预加载失败:", e);
                    }
                }
            } catch(err) {
                actions.addLog("表格提交失败", "error");
                actions.showDialog({ title: '❌ 提交失败', message: err.response?.data?.message || '后端服务异常' });
            }
        },

        // 【垃圾回收】：资源缓存释放指令
        async triggerCleanup() {
            actions.showDialog({
                type: 'confirm', title: '🧹 清理系统缓存', message: '确定要清理吗？这将清除所有上传的文件和分析结果。',
                onConfirm: async () => {
                    actions.addLog("发出清空指令...");
                    try {
                        await api.post('/api/cleanup');
                        actions.resetSystemState();
                        store.isEntered = false;
                        store.logs = [];
                    } catch (err) {
                        actions.addLog(`❌ 清理失败: ${err.message}`, "error");
                    }
                }
            });
        }
    };
}
