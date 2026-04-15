import api from '@/core/api.js'

/**
 * 【数据持久化模块：基于 RESTful API 的云端同步引擎】
 */
export function setupDataIO(store, actions) {
    return {
        async executeBackendSave(saveMode, isSilent, overwriteConfirmed = false) {
            try {
                const payload = {
                    filename: store.uploadedFileName,
                    old_filename: store.currentDataFile,
                    rows: store.previewData.rows,
                    save_mode: saveMode,
                    is_new_table: store.isNewTable,
                    overwrite_confirmed: overwriteConfirmed
                };
                
                const res = await api.post('/api/data/save', payload);
                
                if (res.data.status === 'exists') {
                    actions.openConfirm("⚠️ 同名文件冲突", res.data.message, () => {
                        actions.executeBackendSave(saveMode, isSilent, true);
                    });
                    return;
                }
                
                if (res.data.status === 'success') {
                    store.currentDataFile = store.uploadedFileName;
                    store.isNewTable = false;
                    store.isRenamed = false;
                    if (!isSilent) actions.openAlert("同步完成", `💾 ${res.data.message}`);
                    if (actions.addLog) actions.addLog(`[Success] 数据集已持久化至云端: ${store.uploadedFileName}`, "success");
                }
            } catch (err) {
                console.error(err);
                if (!isSilent) actions.openAlert("后端异常", "保存被拒绝，请检查 Python 引擎。");
                if (actions.addLog) actions.addLog(`[Error] 持久化链路异常: ${err.message}`, "error");
            }
        }
    };
}
