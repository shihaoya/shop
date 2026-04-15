import request from '@/utils/request'

/**
 * 获取我的消息列表
 */
export function getMyMessages(params) {
  return request({
    url: '/messages/my-messages',
    method: 'get',
    params
  })
}

/**
 * 获取未读消息数量
 */
export function getUnreadCount() {
  return request({
    url: '/messages/unread-count',
    method: 'get'
  })
}

/**
 * 获取消息详情
 */
export function getMessageDetail(messageId) {
  return request({
    url: `/messages/${messageId}`,
    method: 'get'
  })
}

/**
 * 标记消息为已读
 */
export function markAsRead(messageId) {
  return request({
    url: `/messages/${messageId}/read`,
    method: 'put'
  })
}

/**
 * 批量标记消息为已读
 */
export function markAllAsRead(data) {
  return request({
    url: '/messages/mark-all-read',
    method: 'put',
    data
  })
}

/**
 * 删除消息
 */
export function deleteMessage(messageId) {
  return request({
    url: `/messages/${messageId}`,
    method: 'delete'
  })
}

/**
 * 批量删除消息
 */
export function batchDeleteMessages(data) {
  return request({
    url: '/messages/batch-delete',
    method: 'post',
    data
  })
}

/**
 * 发送系统消息（管理员）
 */
export function sendSystemMessage(data) {
  return request({
    url: '/messages/send',
    method: 'post',
    data
  })
}

/**
 * 广播消息（管理员）
 */
export function broadcastMessage(data) {
  return request({
    url: '/messages/broadcast',
    method: 'post',
    data
  })
}
