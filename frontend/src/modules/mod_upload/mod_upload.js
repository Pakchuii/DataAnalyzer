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
            const executeUpload = async () => {
                actions.resetSystemState();
                actions.addLog(`开始读取文件: ${file.name}...`);

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await api.post('/api/upload', formData);
                    if (res.data.status === 'success') {
                        const fileInfo = res.data.data;
                        
                        try {
                            const dataRes = await api.post('/api/data/get_full', { filename: fileInfo.filename });
                            if (dataRes.data.status === 'success') {
                                const tempHeaders = dataRes.data.headers;
                                const tempRows = dataRes.data.rows;
                                const rCount = tempRows.length;
                                const cCount = tempHeaders.length;

                                const proceedWithRender = () => {
                                    store.fileInfo = fileInfo;
                                    store.uploadedFileName = fileInfo.original_filename || file.name;
                                    store.currentDataFile = fileInfo.filename;
                                    store.selectedVars = [...fileInfo.numeric_columns];
                                    if (fileInfo.binary_columns.length > 0) store.selectedGroupVar = fileInfo.binary_columns[0];
                                    
                                    store.showUploadModal = true;
                                    store.isNewTable = false;
                                    store.isRenamed = false;
                                    store.previewData = { headers: tempHeaders, rows: tempRows };
                                    
                                    actions.addLog(`文件读取完成！识别出 ${rCount} 行数据，${cCount} 个变量。数据源已无缝装载至手术台！`, "success");
                                };

                                const abortRender = () => { actions.addLog("[System] 用户已主动拦截超大体积数据集的渲染", "warning"); };

                                if (rCount * cCount > 1500) {
                                    actions.openChoice("⚠️ 性能降级预警", `您导入的数据集包含 <b>${rCount}</b> 行和 <b>${cCount}</b> 列。<br><br><span style="color:#f5222d;">系统探针检测到数据矩阵过于庞大。在前端强制渲染该表格可能会导致您的浏览器严重卡顿或假死。</span><br><br>您是否确认要继续在手术台中加载此表格？`, "放弃加载并释放内存", "确认风险，强行加载", abortRender, proceedWithRender, abortRender);
                                } else {
                                    proceedWithRender();
                                }
                            }
                        } catch (e) {
                            console.error("数据预加载失败:", e);
                        }
                    }
                } catch (err) {
                    actions.addLog(`上传解析失败: ${err.message}`, "error");
                    actions.openAlert('❌ 文件解析失败', err.response?.data?.message || '请检查文件格式是否正确。');
                }
            };

            if (store.previewData) {
                actions.openConfirm("⚠️ 覆盖警告", `当前工作区已有数据！强制载入将丢失未保存的修改，是否覆盖？`, () => {
                    executeUpload();
                });
            } else {
                executeUpload();
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
                actions.openAlert('❌ 提交失败', err.response?.data?.message || '后端服务异常');
            }
        },

        // 【垃圾回收】：资源缓存释放指令
        async triggerCleanup() {
            actions.openConfirm(
                '🧹 清理系统缓存',
                '确定要清理吗？这将清除所有上传的文件和分析结果。',
                async () => {
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
            );
        }
    };
}
