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
    redirect: () => {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        return '/login'
      }
      
      // 根据角色自动获取对应的第一个子路由作为首页
      const role = userStore.userRole
      for (const route of routes) {
        if (route.children && route.meta?.role === role) {
          return route.path + '/' + route.children[0].path
        }
      }
      
      return '/login'
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
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'audit',
        name: 'TenantAudit',
        component: () => import('@/views/Admin/TenantAudit.vue'),
        meta: { title: '运营方审核', icon: 'UserFilled' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/Admin/UserManage.vue'),
        meta: { title: '用户管理', icon: 'Avatar' }
      },
      {
        path: 'products',
        name: 'AdminProductManage',
        component: () => import('@/views/Admin/ProductManage.vue'),
        meta: { title: '上架商品管理', icon: 'ShoppingBag' }
      },
      {
        path: 'messages',
        name: 'AdminMessages',
        component: () => import('@/views/Common/MessageCenter.vue'),
        meta: { title: '消息中心', icon: 'Bell' }
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
        path: 'dashboard',
        name: 'OperatorDashboard',
        component: () => import('@/views/Operator/Dashboard.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'products',
        name: 'ProductManage',
        component: () => import('@/views/Operator/ProductManage.vue'),
        meta: { title: '商品管理', icon: 'ShoppingBag' }
      },
      {
        path: 'users',
        name: 'OperatorUserManage',
        component: () => import('@/views/Operator/UserManage.vue'),
        meta: { title: '用户管理', icon: 'Avatar' }
      },
      {
        path: 'points',
        name: 'PointsManage',
        component: () => import('@/views/Operator/PointsManage.vue'),
        meta: { title: '积分管理', icon: 'UserFilled' }
      },
      {
        path: 'orders',
        name: 'OperatorOrderManage',
        component: () => import('@/views/Operator/OrderManage.vue'),
        meta: { title: '订单管理', icon: 'DocumentChecked' }
      },
      {
        path: 'profile',
        name: 'OperatorProfile',
        component: () => import('@/views/User/Profile.vue'),
        meta: { title: '个人中心', icon: 'Avatar' }
      },
      {
        path: 'messages',
        name: 'OperatorMessages',
        component: () => import('@/views/Common/MessageCenter.vue'),
        meta: { title: '消息中心', icon: 'Bell' }
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
        meta: { title: '运营方列表', icon: 'HomeFilled' }
      },
      {
        path: 'products',
        name: 'UserProducts',
        component: () => import('@/views/User/ProductsList.vue'),
        meta: { title: '商品列表', icon: 'ShoppingBag' }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('@/views/User/Orders.vue'),
        meta: { title: '我的订单', icon: 'DocumentChecked' }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue'),
        meta: { title: '个人中心', icon: 'Avatar' }
      },
      {
        path: 'messages',
        name: 'UserMessages',
        component: () => import('@/views/Common/MessageCenter.vue'),
        meta: { title: '消息中心', icon: 'Bell' }
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

// 导出路由配置，供 Layout 组件动态生成菜单使用
export { routes }

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
      // 根据角色重定向到对应的首页
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
