import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadCount } from '@/api/message'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)
  
  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount()
      if (res.code === 200) {
        unreadCount.value = res.data.count
        return res.data.count
      }
    } catch (error) {
      console.error('获取未读消息数量失败:', error)
    }
    return 0
  }
  
  // 重置未读数量（用于退出登录时）
  const resetUnreadCount = () => {
    unreadCount.value = 0
  }
  
  return {
    unreadCount,
    fetchUnreadCount,
    resetUnreadCount
  }
})
