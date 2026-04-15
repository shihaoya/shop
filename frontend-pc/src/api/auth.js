import request from '@/utils/request'

// 用户注册
export const register = (data) => {
  return request.post('/auth/register', data)
}

// 用户登录
export const login = (data) => {
  return request.post('/auth/login', data)
}

// 刷新Token
export const refreshToken = () => {
  return request.post('/auth/refresh')
}

// 退出登录
export const logout = () => {
  return request.post('/auth/logout')
}
