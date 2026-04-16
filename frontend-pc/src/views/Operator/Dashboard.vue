<template>
  <div class="dashboard page-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon products">
              <el-icon :size="32"><ShoppingBag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalProducts }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.onlineProducts }}</div>
              <div class="stat-label">在售商品</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon points">
              <el-icon :size="32"><Coin /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPoints }}</div>
              <div class="stat-label">发放积分</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="recent-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近商品</span>
              <el-button type="primary" text @click="$router.push('/operator/products')" style="color: white;">
                查看全部
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-table :data="recentProducts" style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="pointsRequired" label="所需积分" width="120" />
            <el-table-column prop="stock" label="库存" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="quick-card" shadow="hover">
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/operator/products')">
              <div class="action-icon products">
                <el-icon :size="24"><ShoppingBag /></el-icon>
              </div>
              <div class="action-text">商品管理</div>
            </div>
            
            <div class="action-item" @click="$router.push('/operator/users')">
              <div class="action-icon users">
                <el-icon :size="24"><UserFilled /></el-icon>
              </div>
              <div class="action-text">用户管理</div>
            </div>
            
            <div class="action-item" @click="$router.push('/operator/points')">
              <div class="action-icon points">
                <el-icon :size="24"><Coin /></el-icon>
              </div>
              <div class="action-text">积分管理</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/index'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  ShoppingBag,
  CircleCheck,
  User,
  Coin,
  ArrowRight,
  UserFilled
} from '@element-plus/icons-vue'

const loading = ref(false)

const stats = ref({
  totalProducts: 0,
  onlineProducts: 0,
  totalUsers: 0,
  totalPoints: 0
})

const recentProducts = ref([])

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    // 获取商品列表
    const res = await getProducts({ page: 1, pageSize: 5 })
    recentProducts.value = res.data.list
    stats.value.totalProducts = res.data.total
    
    // 计算在售商品数量
    stats.value.onlineProducts = res.data.list.filter(p => p.status === 1).length
    
    // TODO: 加载其他统计数据
    stats.value.totalUsers = 0
    stats.value.totalPoints = 0
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  /* 响应式由 .page-container 处理 */
}

.stats-row {
  margin-bottom: 28px;
}

.stat-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04);
  border-color: rgba(14, 165, 233, 0.2);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}

.stat-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  position: relative;
  overflow: hidden;
}

.stat-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-icon::before {
  opacity: 1;
}

.stat-icon.products {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
}

.stat-icon.online {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.stat-icon.points {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.content-row {
  margin-bottom: 28px;
}

.recent-card,
.quick-card {
  border-radius: 16px;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: all 0.3s ease;
}

.recent-card:hover,
.quick-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #0f172a;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.action-item {
  padding: 24px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.action-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-item:hover::before {
  opacity: 1;
}

.action-item:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(14, 165, 233, 0.2);
}

.action-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.action-icon.products {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
}

.action-icon.users {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
}

.action-icon.points {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.action-text {
  font-size: 14px;
  color: #334155;
  font-weight: 600;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 1;
}
</style>
