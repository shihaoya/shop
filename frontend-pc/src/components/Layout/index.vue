<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
      <div class="logo">
        <el-icon v-if="!isCollapse" :size="32" color="#fff">
          <component :is="ElementPlusIconsVue['ShoppingBag']" />
        </el-icon>
        <span v-if="!isCollapse" class="logo-text">积分系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item 
          v-for="item in menuItems" 
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="ElementPlusIconsVue[item.icon]" />
          </el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            @click="toggleCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        
        <div class="header-right">
          <!-- 运营方：显示店铺名称 -->
          <div v-if="userStore.userRole === 'operator'" class="tenant-name">
            <el-icon :size="16"><Shop /></el-icon>
            <span>{{ currentTenantName || '加载中...' }}</span>
          </div>
          
          <!-- 消息通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
            <el-icon 
              class="message-icon" 
              @click="goToMessages"
              :size="20"
            >
              <Bell />
            </el-icon>
          </el-badge>
          
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="36" class="user-avatar">
                {{ displayNickname.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePassword">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    
    <!-- 修改密码对话框 -->
    <ChangePassword v-model="showChangePassword" @success="handlePasswordSuccess" />
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { ElMessageBox, ElMessage } from 'element-plus'
import ChangePassword from '@/components/Common/ChangePassword.vue'
import { routes } from '@/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Fold, Expand, Bell, ArrowDown, Lock, SwitchButton, Shop } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const isCollapse = ref(false)
const showChangePassword = ref(false)

// 使用 message store 中的未读数量
const unreadCount = computed(() => messageStore.unreadCount)

// 显示名称：昵称(用户名)
const displayName = computed(() => {
  const userInfo = userStore.userInfo
  if (!userInfo) return ''
  
  const nickname = userInfo.nickname
  const username = userInfo.username
  
  if (nickname && nickname !== username) {
    return `${nickname}(${username})`
  }
  return username
})

// 显示昵称（用于头像）
const displayNickname = computed(() => {
  const userInfo = userStore.userInfo
  if (!userInfo) return '?'
  return userInfo.nickname || userInfo.username || '?'
})

// 运营方店铺名称
const currentTenantName = computed(() => {
  if (userStore.userRole === 'operator') {
    return userStore.userInfo?.currentTenantName || null
  }
  return null
})

const activeMenu = computed(() => route.path)

// 动态生成菜单
const menuItems = computed(() => {
  const role = userStore.userRole
  const roleRoute = routes.find(r => r.meta?.role === role && r.children)
  if (!roleRoute?.children) return []
  
  return roleRoute.children
    .filter(child => child.meta?.title) // 只保留有 title 的路由
    .map(child => ({
      path: `${roleRoute.path}/${child.path}`,
      title: child.meta.title,
      icon: child.meta.icon || 'Document'
    }))
})

onMounted(() => {
  // 获取未读消息数量
  fetchUnreadCount()
  // 每30秒刷新一次未读数量
  setInterval(fetchUnreadCount, 30000)
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await userStore.logout()
      router.push('/login')
    } catch {
      // 取消操作
    }
  } else if (command === 'changePassword') {
    showChangePassword.value = true
  }
}

const handlePasswordSuccess = () => {
  ElMessage.success('密码修改成功，3秒后自动退出登录')
  setTimeout(async () => {
    await userStore.logout()
    router.push('/login')
  }, 3000)
}

// 获取未读消息数量
const fetchUnreadCount = async () => {
  await messageStore.fetchUnreadCount()
}

// 跳转到消息中心
const goToMessages = () => {
  const role = userStore.userRole
  router.push(`/${role}/messages`)
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}

.logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
}

.logo-text {
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 4px 8px;
  border-radius: 8px;
  font-weight: 500;
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: white;
  transform: translateX(4px);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.05) 100%) !important;
  color: #38bdf8;
  position: relative;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: linear-gradient(180deg, #38bdf8 0%, #06b6d4 100%);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03);
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: #0ea5e9;
  transform: scale(1.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tenant-name {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.message-badge {
  cursor: pointer;
}

.message-icon {
  color: #606266;
  transition: color 0.3s;
}

.message-icon:hover {
  color: #0ea5e9;
  transform: scale(1.15);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.user-avatar {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
  transition: all 0.3s ease;
}

.user-info:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

.username {
  color: #303133;
  font-size: 14px;
}

.main-content {
  padding: 28px 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
  overflow-y: auto;
  min-height: calc(100vh - 72px);
}

/* 路由过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
