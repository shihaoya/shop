import request from '@/utils/request'

// 租户相关
export function getTenants(params) {
  return request({
    url: '/tenants',
    method: 'get',
    params
  })
}

export function getTenantById(id) {
  return request({
    url: `/tenants/${id}`,
    method: 'get'
  })
}

// 商品管理
export function getProducts(params) {
  return request({
    url: '/operator/products',
    method: 'get',
    params
  })
}

export function getProductById(id) {
  return request({
    url: `/operator/products/${id}`,
    method: 'get'
  })
}

export function createProduct(data) {
  return request({
    url: '/operator/products',
    method: 'post',
    data
  })
}

export function updateProduct(id, data) {
  return request({
    url: `/operator/products/${id}`,
    method: 'put',
    data
  })
}

export function updateProductStatus(id, data) {
  return request({
    url: `/operator/products/${id}/status`,
    method: 'put',
    data
  })
}

export function deleteProduct(id) {
  return request({
    url: `/operator/products/${id}`,
    method: 'delete'
  })
}

export function getTrashProducts(params) {
  return request({
    url: '/operator/products/trash/list',
    method: 'get',
    params
  })
}

export function restoreProduct(id) {
  return request({
    url: `/operator/products/${id}/restore`,
    method: 'post'
  })
}

// 用户管理
export function getUsers(params) {
  return request({
    url: '/operator/users',
    method: 'get',
    params
  })
}

export function getUserDetail(userId) {
  return request({
    url: `/operator/users/${userId}`,
    method: 'get'
  })
}

export function addExistingUser(data) {
  return request({
    url: '/operator/users/add-existing',
    method: 'post',
    data
  })
}

export function createNewUser(data) {
  return request({
    url: '/operator/users/create-new',
    method: 'post',
    data
  })
}

export function removeUser(userId) {
  return request({
    url: `/operator/users/${userId}`,
    method: 'delete'
  })
}

export function restoreUser(userId) {
  return request({
    url: `/operator/users/${userId}/restore`,
    method: 'post'
  })
}

export function getTrashUsers(params) {
  return request({
    url: '/operator/users/trash/list',
    method: 'get',
    params
  })
}

// 积分管理
export function getPointsUsers(params) {
  return request({
    url: '/operator/points/users',
    method: 'get',
    params
  })
}

export function addPoints(userId, data) {
  return request({
    url: `/operator/points/${userId}/add`,
    method: 'post',
    data
  })
}

export function subtractPoints(userId, data) {
  return request({
    url: `/operator/points/${userId}/subtract`,
    method: 'post',
    data
  })
}

export function modifyPoints(userId, data) {
  return request({
    url: `/operator/points/${userId}/modify`,
    method: 'post',
    data
  })
}

export function batchAdjustPoints(data) {
  return request({
    url: '/operator/points/batch-adjust',
    method: 'post',
    data
  })
}

export function getPointTransactions(userId, params) {
  return request({
    url: `/operator/points/${userId}/transactions`,
    method: 'get',
    params
  })
}

// 普通用户功能
export function getUserTenants(params) {
  return request({
    url: '/user/tenants',
    method: 'get',
    params
  })
}

export function applyJoinTenant(tenantId) {
  return request({
    url: `/user/tenants/${tenantId}/apply`,
    method: 'post'
  })
}

export function getMyApplications(params) {
  return request({
    url: '/user/applications',
    method: 'get',
    params
  })
}

export function switchTenant(tenantId) {
  return request({
    url: `/user/tenants/${tenantId}/switch`,
    method: 'post'
  })
}

export function getCurrentPoints(tenantId) {
  return request({
    url: '/user/points',
    method: 'get',
    params: { tenantId }
  })
}

export function getUserPointTransactions(params) {
  return request({
    url: '/user/points/transactions',
    method: 'get',
    params
  })
}

// 租户审核状态（运营方专用）
export function getMyTenantStatus() {
  return request({
    url: '/tenants/my-status',
    method: 'get'
  })
}

export function resubmitAudit(data) {
  return request({
    url: '/tenants/resubmit',
    method: 'put',
    data
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}
