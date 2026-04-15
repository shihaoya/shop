<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingTenants }}</div>
              <div class="stat-label">待审核运营方</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon approved">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approvedTenants }}</div>
              <div class="stat-label">已通过运营方</div>
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
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayLogins }}</div>
              <div class="stat-label">今日登录</div>
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
              <span>最近待审核申请</span>
              <el-button type="primary" text @click="$router.push('/admin/audit')">
                查看全部
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-table :data="recentApplications" style="width: 100%" v-loading="loading">
            <el-table-column prop="username" label="申请人" />
            <el-table-column prop="description" label="申请说明" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="申请时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="handleApprove(row.id)">
                  通过
                </el-button>
                <el-button type="danger" size="small" @click="handleReject(row.id)">
                  拒绝
                </el-button>
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
            <div class="action-item" @click="$router.push('/admin/audit')">
              <div class="action-icon audit">
                <el-icon :size="24"><DocumentChecked /></el-icon>
              </div>
              <div class="action-text">审核运营方</div>
            </div>
            
            <div class="action-item" @click="$router.push('/admin/users')">
              <div class="action-icon users">
                <el-icon :size="24"><UserFilled /></el-icon>
              </div>
              <div class="action-text">用户管理</div>
            </div>
            
            <div class="action-item">
              <div class="action-icon logs">
                <el-icon :size="24"><Document /></el-icon>
              </div>
              <div class="action-text">查看日志</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingTenants, approveTenant, rejectTenant } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  Clock,
  CircleCheck,
  User,
  TrendCharts,
  ArrowRight,
  DocumentChecked,
  UserFilled,
  Document
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  pendingTenants: 0,
  approvedTenants: 0,
  totalUsers: 0,
  todayLogins: 0
})

const recentApplications = ref([])

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    // 获取待审核列表
    const res = await getPendingTenants({ page: 1, pageSize: 5 })
    recentApplications.value = res.data.list
    stats.value.pendingTenants = res.data.total
    
    // TODO: 加载其他统计数据
    stats.value.approvedTenants = 0
    stats.value.totalUsers = 0
    stats.value.todayLogins = 0
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleApprove = async (id) => {
  try {
    await ElMessageBox.confirm('确定要通过该申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await approveTenant(id)
    ElMessage.success('审核通过')
    loadDashboardData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
    }
  }
}

const handleReject = async (id) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请填写拒绝原因'
    })
    
    await rejectTenant(id, { reason })
    ElMessage.success('已拒绝')
    loadDashboardData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error)
    }
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

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.approved {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.today {
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

.action-icon.audit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.users {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.logs {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-text {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}
</style>
