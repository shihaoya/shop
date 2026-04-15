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
          
          <!-- 普通用户：运营方切换下拉框 -->
          <el-select 
            v-if="userStore.userRole === 'user'" 
            v-model="selectedTenantId" 
            placeholder="选择运营方" 
            @change="handleTenantChange"
            style="width: 180px; margin-right: 16px"
          >
            <el-option
              v-for="tenant in approvedTenants"
              :key="tenant.tenant.id"
              :label="tenant.tenant.name"
              :value="tenant.tenant.id"
            />
          </el-select>
          
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
import { useTenantStore } from '@/store/tenant'
import { ElMessageBox, ElMessage } from 'element-plus'
import ChangePassword from '@/components/Common/ChangePassword.vue'
import { getMyApplications } from '@/api'
import { getUnreadCount } from '@/api/message'
import { routes } from '@/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Fold, Expand, Bell, ArrowDown, Lock, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const tenantStore = useTenantStore()

const isCollapse = ref(false)
const showChangePassword = ref(false)
const selectedTenantId = ref(null)
const approvedTenants = ref([])
const unreadCount = ref(0)

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

// 加载已通过的运营方列表
const loadApprovedTenants = async () => {
  if (userStore.userRole !== 'user') return
  
  try {
    const res = await getMyApplications({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      approvedTenants.value = res.data.list.filter(item => item.status === 'approved')
      
      // 如果当前没有选中运营方，默认选中第一个
      if (!tenantStore.currentTenantId && approvedTenants.value.length > 0) {
        const firstTenant = approvedTenants.value[0]
        selectedTenantId.value = firstTenant.tenant.id
        tenantStore.setCurrentTenant(firstTenant.tenant.id, firstTenant.tenant)
      } else {
        selectedTenantId.value = tenantStore.currentTenantId
      }
    }
  } catch (error) {
    console.error('加载运营方列表失败:', error)
  }
}

// 切换运营方
const handleTenantChange = (tenantId) => {
  const tenant = approvedTenants.value.find(item => item.tenant.id === tenantId)
  if (tenant) {
    tenantStore.setCurrentTenant(tenantId, tenant.tenant)
    ElMessage.success(`已切换到：${tenant.tenant.name}`)
    // 可以在这里触发全局事件或刷新页面数据
  }
}

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

onMounted(() => {
  loadApprovedTenants()
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
  try {
    const res = await getUnreadCount()
    if (res.code === 200) {
      unreadCount.value = res.data.unreadCount
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 跳转到消息中心
const goToMessages = () => {
  const role = userStore.userRole
  router.push(`/${role}/messages`)
}

// 初始化
onMounted(() => {
  if (userStore.userRole === 'user') {
    loadApprovedTenants()
  }
  // 获取未读消息数量
  fetchUnreadCount()
  // 每30秒刷新一次未读数量
  setInterval(fetchUnreadCount, 30000)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-weight: 600;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white;
}

:deep(.el-menu-item.is-active) {
  position: relative;
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: white;
  border-radius: 0 4px 4px 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
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
  color: #667eea;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.message-badge {
  cursor: pointer;
}

.message-icon {
  color: #606266;
  transition: color 0.3s;
}

.message-icon:hover {
  color: #667eea;
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
  background: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.username {
  color: #303133;
  font-size: 14px;
}

.main-content {
  padding: 24px;
  background: #f0f2f5;
  overflow-y: auto;
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
