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

// 用户端获取商品列表（根据租户ID）
export function getTenantProducts(tenantId, params) {
  return request({
    url: `/tenants/${tenantId}/products`,
    method: 'get',
    params
  })
}

// 申请加入运营方（带理由）
export function applyJoinTenantWithReason(tenantId, data) {
  return request({
    url: `/user/tenants/${tenantId}/apply`,
    method: 'post',
    data
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

// 获取可添加的用户列表（用于下拉选择）
export function getAvailableUsers(params) {
  return request({
    url: '/operator/users/available',
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

// 运营方用户管理
export function getOperatorUsers(params) {
  return request({
    url: '/operator/users',
    method: 'get',
    params
  })
}

// 申请审核
export function getPendingApplications(params) {
  return request({
    url: '/operator/users/applications/pending',
    method: 'get',
    params
  })
}

export function approveApplication(relationId) {
  return request({
    url: `/operator/users/applications/${relationId}/approve`,
    method: 'post'
  })
}

export function rejectApplication(relationId, data) {
  return request({
    url: `/operator/users/applications/${relationId}/reject`,
    method: 'post',
    data
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

// 订单相关
export function createOrder(data) {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export function getMyOrders(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

export function cancelOrder(id) {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'post'
  })
}

// 运营方订单管理
export function getOperatorOrders(params) {
  return request({
    url: '/operator/orders',
    method: 'get',
    params
  })
}

export function updateOrderStatus(id, data) {
  return request({
    url: `/operator/orders/${id}/status`,
    method: 'put',
    data
  })
}
