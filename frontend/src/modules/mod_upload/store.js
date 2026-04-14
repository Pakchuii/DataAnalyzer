import api from '@/core/api.js'

export function setupFile(store, actions) {
    return {
        handleFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;
            actions.uploadFile(file);
        },
        handleDrop(e) {
            store.isDragging = false;
            const file = e.dataTransfer.files[0];
            if (file) actions.uploadFile(file);
        },
        async uploadFile(file) {
            actions.addLog(`正在将 [${file.name}] 传输至后端数据管道...`, "info");
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await api.post('/api/upload', formData);
                if (res.data.status === 'success') {
                    store.fileInfo = res.data.data;
                    store.currentDataFile = res.data.data.filename;
                    store.uploadedFileName = file.name;
                    store.selectedVars = [];
                    store.cleanResult = null;
                    store.isStandardized = false;
                    store.isMasked = false;
                    actions.addLog(`✅ 数据注册成功: ${file.name}`, "success");
                } else {
                    actions.addLog(`❌ 上传失败: ${res.data.message}`, "error");
                }
            } catch (err) {
                actions.addLog(`❌ 网络异常: ${err.message}`, "error");
            }
        },
        openManualEditor() {
            store.manualGrid = Array.from({ length: 6 }, () => Array(4).fill(''));
            store.showManualModal = true;
        },
        async submitManualGrid() {
            actions.addLog("正在向后端提交手工录入的矩阵数据...", "info");
            try {
                const res = await api.post('/api/upload_manual', { grid: store.manualGrid });
                if (res.data.status === 'success') {
                    store.fileInfo = res.data.data;
                    store.currentDataFile = res.data.data.filename;
                    store.uploadedFileName = "在线创建数据.csv";
                    store.showManualModal = false;
                    actions.addLog("✅ 手工表格已成功装载至系统", "success");
                }
            } catch (err) { actions.addLog(`❌ 提交失败: ${err.message}`, "error"); }
        },
        async triggerCleanup() {
            actions.addLog("正在向后端发送缓存清理指令...", "info");
            try {
                const res = await api.post('/api/cleanup');
                if (res.data.status === 'success') {
                    actions.resetSystemState();
                    actions.addLog("✅ 系统缓存已完全清空", "success");
                }
            } catch (err) { actions.addLog(`❌ 清理失败: ${err.message}`, "error"); }
        }
    };
}
