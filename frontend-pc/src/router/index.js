import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Login/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/admin/dashboard'
  },
  // 管理员路由
  {
    path: '/admin',
    component: () => import('@/components/Layout/index.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'audit',
        name: 'TenantAudit',
        component: () => import('@/views/Admin/TenantAudit.vue'),
        meta: { title: '运营方审核' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/Admin/UserManage.vue'),
        meta: { title: '用户管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 积分兑换系统` : '积分兑换系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      return '/login'
    }
    
    // 检查角色权限
    if (to.meta.role && userStore.userRole !== to.meta.role) {
      return '/'
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && userStore.isLoggedIn) {
    return '/'
  }
  
  // 返回 true 或 undefined 允许导航
  return true
})

export default router
