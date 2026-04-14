import axios from 'axios'

/**
 * 【API 网关】：统一的 HTTP 客户端实例
 * 所有模块共享此实例，baseURL 只需在此处配置一次。
 */
const api = axios.create({
    baseURL: 'http://127.0.0.1:5000',
    timeout: 30000
})

export default api
