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

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/auth/profile')
}

// 修改密码
export const changePassword = (data) => {
  return request.post('/auth/change-password', data)
}

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.put('/auth/profile', data)
}
