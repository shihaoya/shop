import request from '@/utils/request'

// 获取待审核的运营方列表
export const getPendingTenants = (params) => {
  return request.get('/admin/tenants/pending', { params })
}

// 通过审核
export const approveTenant = (id) => {
  return request.post(`/admin/tenants/${id}/approve`)
}

// 拒绝审核
export const rejectTenant = (id, data) => {
  return request.post(`/admin/tenants/${id}/reject`, data)
}

// 获取用户列表
export const getUserList = (params) => {
  return request.get('/admin/users', { params })
}

// 重置用户密码
export const resetUserPassword = (id) => {
  return request.post(`/admin/users/${id}/reset-password`)
}

// 修改用户状态
export const updateUserStatus = (id, data) => {
  return request.put(`/admin/users/${id}/status`, data)
}
