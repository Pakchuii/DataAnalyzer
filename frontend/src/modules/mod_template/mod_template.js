/**
 * 【积木模板逻辑层：业务逻辑定义的工业化标准】
 * 演示如何定义一个新的功能模块 Actions 并注入全局总线。
 */
export function setupTemplate(store, actions) {
    return {
        // 演示 Action 1: 打印日志并修改状态
        demoAction(msg) {
            actions.addLog(`[Template Module] 接收到指令: ${msg}`, 'info');
            store.templateData = {
                timestamp: new Date().toLocaleTimeString(),
                message: msg,
                status: 'Active'
            };
        },
        
        // 演示 Action 2: 触发一个全局弹窗
        triggerTemplateDialog() {
            actions.openAlert("积木模板演示", "这是一个通过模块化 Actions 触发的全局对话框！<br>您可以将其作为开发新功能的蓝图。");
        }
    };
}
