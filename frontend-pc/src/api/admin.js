import request from '@/utils/request'

// 获取所有租户列表（支持状态筛选）
export const getTenants = (params) => {
  return request.get('/admin/tenants', { params })
}

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

// 获取用户详情
export const getUserDetail = (id) => {
  return request.get(`/admin/users/${id}`)
}

// 更新用户信息
export const updateUserInfo = (id, data) => {
  return request.put(`/admin/users/${id}`, data)
}

// 更新租户审核状态
export const updateTenantStatus = (id, data) => {
  return request.put(`/admin/tenants/${id}/status`, data)
}

// 获取所有上架商品列表
export const getOnShelfProducts = (params) => {
  return request.get('/admin/products/on-shelf', { params })
}

// 获取租户审核历史
export const getTenantAuditHistory = (id, params) => {
  return request.get(`/admin/tenants/${id}/audit-history`, { params })
}
