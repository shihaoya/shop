<template>
  <div class="dashboard page-container">
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

.stat-icon.pending {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
}

.stat-icon.approved {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.stat-icon.today {
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

.action-icon.audit {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
}

.action-icon.users {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
}

.action-icon.logs {
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
