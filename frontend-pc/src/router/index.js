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
    redirect: (to) => {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        return '/login'
      }
      
      // 根据角色重定向到对应的首页
      return getDefaultHomePage(userStore.userRole)
    }
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
  },
  // 运营方路由
  {
    path: '/operator',
    component: () => import('@/components/Layout/index.vue'),
    meta: { requiresAuth: true, role: 'operator' },
    children: [
      {
        path: 'products',
        name: 'ProductManage',
        component: () => import('@/views/Operator/ProductManage.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'users',
        name: 'OperatorUserManage',
        component: () => import('@/views/Operator/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'points',
        name: 'PointsManage',
        component: () => import('@/views/Operator/PointsManage.vue'),
        meta: { title: '积分管理' }
      }
    ]
  },
  // 普通用户路由
  {
    path: '/user',
    component: () => import('@/components/Layout/index.vue'),
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: 'tenants',
        name: 'UserTenants',
        component: () => import('@/views/User/Tenants.vue'),
        meta: { title: '运营方列表' }
      },
      {
        path: 'applications',
        name: 'MyApplications',
        component: () => import('@/views/User/Applications.vue'),
        meta: { title: '我的申请' }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue'),
        meta: { title: '个人中心' }
      }
    ]
  }
]

// 根据角色自动获取第一个可用路由
const getDefaultHomePage = (role) => {
  // 遍历所有路由，找到匹配角色的第一个子路由
  for (const route of routes) {
    if (route.children && route.meta?.role === role) {
      // 返回该角色的第一个子路由
      return route.path + '/' + route.children[0].path
    }
  }
  return '/login'
}

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
      // 根据角色重定向到对应的首页，避免循环
      return getDefaultHomePage(userStore.userRole)
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
