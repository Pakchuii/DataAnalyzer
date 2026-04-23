import api from '@/core/api.js'

export function setupFilter(store, actions) {
    return {
        // 打开/关闭筛选面板
        toggleFilterPanel() {
            store.showFilterPanel = !store.showFilterPanel;
            if (store.showFilterPanel && !store.filterColumnInfo) {
                // 面板第一次打开时，重置状态
                store.activeFilters = [];
            }
        },

        // 获取某列的范围/值信息
        async fetchColumnFilterInfo(column) {
            if (!store.fileInfo) return;
            try {
                const res = await api.post('/api/filter/column_info', {
                    filename: store.currentDataFile,
                    column: column
                });
                if (res.data.status === 'success') {
                    store.filterColumnInfo = res.data.data;
                    actions.addLog(`已获取字段 [${column}] 的筛选范围信息`, "success");
                }
            } catch (err) {
                actions.addLog(`获取列信息失败: ${err.message}`, "error");
            }
        },

        // 执行筛选操作
        async applyFilters() {
            if (!store.fileInfo || store.activeFilters.length === 0) return;
            actions.addLog("正在执行数据筛选...");
            try {
                const res = await api.post('/api/filter/range', {
                    filename: store.currentDataFile,
                    filters: store.activeFilters
                });
                if (res.data.status === 'success') {
                    const result = res.data.data;
                    store.currentDataFile = result.filtered_filename;
                    store.showPreview = false;
                    store.previewStatsData = null;

                    actions.openAlert(
                        '🎯 数据筛选完成',
                        `原始数据 ${result.original_count} 行\n筛选后保留 ${result.filtered_count} 行\n移除了 ${result.removed_count} 条不匹配记录`
                    );
                    actions.addLog(`筛选完成: ${result.original_count} → ${result.filtered_count} 行`, "success");
                }
            } catch (err) {
                actions.addLog(`筛选失败: ${err.message}`, "error");
            }
        },

        // 重置筛选（恢复原始数据）
        resetFilters() {
            if (!store.fileInfo) return;
            store.currentDataFile = store.cleanResult
                ? store.cleanResult.cleaned_filename
                : store.fileInfo.filename;
            store.activeFilters = [];
            store.filterColumnInfo = null;
            store.showPreview = false;
            store.previewStatsData = null;
            actions.addLog("筛选条件已重置，数据已恢复。", "info");
        }
    };
}
