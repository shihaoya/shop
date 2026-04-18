import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 标记是否正在处理认证错误，防止重复跳转
let isHandlingAuthError = false

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 如果是 Blob 类型（文件下载），直接返回原始响应
    if (response.config.responseType === 'blob') {
      return response.data
    }
    
    const res = response.data
    
    // 检查业务 code
    if (res.code === 200) {
      return res
    } else {
      // 业务错误：如果配置了 skipErrorToast，则不自动显示错误
      const skipErrorToast = response.config?.skipErrorToast
      
      // 特殊处理认证错误（Token 过期或无效）
      if (res.code === 401 && res.type === 'auth') {
        if (!isHandlingAuthError) {
          isHandlingAuthError = true
          ElMessage.error(res.message || '登录已过期，请重新登录')
          
          // 清除所有本地存储
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('currentTenantId')
          localStorage.removeItem('currentTenantInfo')
          
          // 延迟跳转，确保用户看到提示
          setTimeout(() => {
            isHandlingAuthError = false
            // 如果当前不在登录页，才跳转
            if (router.currentRoute.value.path !== '/login') {
              router.push('/login')
            }
          }, 500)
        }
      } else {
        // 其他业务错误，仅显示提示
        if (!skipErrorToast) {
          ElMessage.error(res.message || '请求失败')
        }
      }
      
      // 保留完整的错误数据，包括 errors 数组
      const err = new Error(res.message || '请求失败')
      err.response = response
      err.config = response.config
      return Promise.reject(err)
    }
  },
  error => {
    console.error('响应错误:', error)
    console.error('error.response:', error.response)
    console.error('error.response.data:', error.response?.data)
    
    // 如果请求配置了 skipErrorToast，则不自动显示错误
    const skipErrorToast = error.config?.skipErrorToast
    
    // 只有真正的网络错误或服务器崩溃才进入这里
    if (error.response) {
      // HTTP 状态码非 2xx 的情况（如服务器崩溃、网络错误）
      const { status, data } = error.response
      console.error('HTTP Status:', status, 'Data:', data)
      
      if (!skipErrorToast) {
        if (status === 500) {
          ElMessage.error('服务器内部错误')
        } else if (status === 502 || status === 503 || status === 504) {
          ElMessage.error('服务不可用，请稍后重试')
        } else {
          ElMessage.error(data?.message || '网络错误')
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      if (!skipErrorToast) {
        ElMessage.error('请求超时，请检查网络连接')
      }
    } else {
      if (!skipErrorToast) {
        ElMessage.error('网络错误，请检查网络连接')
      }
    }
    
    return Promise.reject(error)
  }
)

export default request
