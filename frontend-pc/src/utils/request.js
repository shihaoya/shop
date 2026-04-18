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
    const res = response.data
    
    if (res.code === 200) {
      return res
    } else {
      // 业务错误：显示错误提示
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    console.error('响应错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      const errorType = data?.type || 'business'  // 默认为业务错误
      
      switch (status) {
        case 401:
          // 根据错误类型区分处理
          if (errorType === 'auth') {
            // 认证错误：Token 过期或无效，需要跳转登录页
            if (!isHandlingAuthError) {
              isHandlingAuthError = true
              ElMessage.error(data?.message || '登录已过期，请重新登录')
              
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
            // 业务错误：如登录失败、密码错误等，仅显示提示
            ElMessage.error(data?.message || '操作失败')
          }
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request
