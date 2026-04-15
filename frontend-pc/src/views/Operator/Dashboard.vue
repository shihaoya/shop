<template>
  <div class="dashboard">
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
              <el-button type="primary" text @click="$router.push('/operator/products')">
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
  max-width: 1400px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.products {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.online {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.points {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

.content-row {
  margin-bottom: 24px;
}

.recent-card,
.quick-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-item {
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.action-item:hover {
  background: #edf2f7;
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.action-icon.products {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.users {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.points {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-text {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}
</style>
