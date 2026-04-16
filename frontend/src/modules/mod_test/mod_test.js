import api from '@/core/api.js'

/**
 * 【全栈样板逻辑层】
 * 展示前端如何连接后端 API，并处理响应状态。
 */
export function setupTestModule(store, actions) {
    return {
        // 核心功能：全栈探测数据属性
        async probeDataStructure() {
            if (!store.currentDataFile) {
                actions.openAlert("提示", "请先注入或上传一份数据集！");
                return;
            }

            actions.addLog("🔄 全栈探测请求已发送至后端...", "info");
            store.testLoading = true;

            try {
                // 调用后台刚刚编写好的接口
                const res = await api.post('/api/test/probe', {
                    filename: store.currentDataFile
                });

                if (res.data.status === 'success') {
                    // 将后端返回的统计数据注入全局状态
                    store.testResult = res.data.data;
                    actions.addLog("✅ 后端透视成功！数据结构已解析完毕。", "success");
                } else {
                    actions.addLog(`❌ 后端处理失败: ${res.data.message}`, "error");
                }
            } catch (e) {
                console.error(e);
                actions.addLog("🔥 网络连接异常，无法触达后端接口。", "error");
            } finally {
                store.testLoading = false;
            }
        }
    };
}
