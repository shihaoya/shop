import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo as getUserInfoApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // 用户角色
  const userRole = computed(() => userInfo.value?.role || '')

  // 登录
  const login = async (loginForm) => {
    try {
      const res = await loginApi(loginForm)
      token.value = res.data.token
      userInfo.value = res.data.user
      
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      return res
    } catch (error) {
      throw error
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  // 获取用户信息
  const getUserInfo = async (params) => {
    try {
      const res = await getUserInfoApi(params)
      userInfo.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    login,
    logout,
    getUserInfo
  }
})
