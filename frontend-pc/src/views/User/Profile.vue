<template>
  <div class="profile-page page-container">
    <el-row :gutter="20">
      <!-- 左侧：用户基本信息 -->
      <el-col :span="8">
        <el-card>
          <div class="user-info">
            <el-avatar :size="80" icon="UserFilled" />
            <h2>{{ userInfo.nickname || userInfo.username }}</h2>
            <p><strong>用户名：</strong>{{ userInfo.username }}</p>
            <p><strong>昵称：</strong>{{ userInfo.nickname || '未设置' }}</p>
            <p><strong>角色：</strong>{{ getRoleText(userInfo.role) }}</p>
            <p><strong>注册时间：</strong>{{ formatTime(userInfo.createdAt) }}</p>
            <el-button type="primary" size="small" style="margin-top: 15px" @click="handleEditClick">
              <el-icon><Edit /></el-icon>
              编辑信息
            </el-button>
          </div>
        </el-card>

        <!-- 运营方审核状态卡片 -->
        <el-card v-if="userInfo.role === 'operator' && tenantInfo" style="margin-top: 20px">
          <template #header>
            <span>审核状态</span>
          </template>
          <div class="audit-status">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="当前状态">
                <el-tag :type="getStatusType(tenantInfo.status)" size="large">
                  {{ getStatusText(tenantInfo.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="租户名称">
                {{ tenantInfo.name }}
              </el-descriptions-item>
              <el-descriptions-item label="申请时间">
                {{ formatTime(tenantInfo.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="拒绝原因" v-if="tenantInfo.status === 'rejected'">
                <el-alert type="error" :closable="false" show-icon>
                  {{ tenantInfo.rejectReason || '无具体原因' }}
                </el-alert>
              </el-descriptions-item>
            </el-descriptions>

            <!-- 重新提交按钮 -->
            <div v-if="tenantInfo.status === 'rejected'" class="action-bar">
              <el-button type="primary" size="small" @click="showResubmitDialog = true">
                <el-icon><Refresh /></el-icon>
                重新提交审核
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：积分和运营方信息 -->
      <el-col :span="16">
        <!-- 普通用户：显示积分信息 -->
        <template v-if="userInfo.role === 'user'">
          <el-card>
            <template #header>
              <span>当前积分</span>
            </template>
            <div class="points-info">
              <div class="points-value">
                <span class="label">积分余额：</span>
                <span class="value">{{ currentPoints }}</span>
              </div>
              <el-button type="primary" @click="viewTransactions">查看积分流水</el-button>
            </div>
          </el-card>

          <el-card style="margin-top: 20px">
            <template #header>
              <span>已加入的运营方</span>
            </template>
            <el-select v-model="selectedTenant" placeholder="请选择运营方" style="width: 100%" @change="handleTenantChange">
              <el-option
                v-for="item in approvedTenants"
                :key="item.tenant.id"
                :label="item.tenant.name"
                :value="item.tenant.id"
              />
            </el-select>
          </el-card>
        </template>

        <!-- 运营方：显示租户信息 -->
        <template v-else-if="userInfo.role === 'operator'">
          <el-card>
            <template #header>
              <span>我的租户</span>
            </template>
            <div v-if="tenantInfo" class="tenant-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="租户名称">{{ tenantInfo.name }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(tenantInfo.status)">
                    {{ getStatusText(tenantInfo.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="申请描述" :span="2">
                  {{ tenantInfo.description || '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="申请时间">{{ formatTime(tenantInfo.createdAt) }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ formatTime(tenantInfo.updatedAt) }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <el-empty v-else description="暂无租户信息" />
          </el-card>
        </template>

        <!-- 管理员：显示统计信息 -->
        <template v-else-if="userInfo.role === 'admin'">
          <el-card>
            <template #header>
              <span>系统概览</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="总用户数" :value="0" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="运营方数量" :value="0" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="待审核申请" :value="0" />
              </el-col>
            </el-row>
          </el-card>
        </template>
      </el-col>
    </el-row>

    <!-- 编辑信息对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑个人信息" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEdit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重新提交审核对话框 -->
    <el-dialog v-model="showResubmitDialog" title="重新提交审核" width="600px">
      <el-form ref="resubmitFormRef" :model="resubmitForm" :rules="resubmitRules" label-width="100px">
        <el-form-item label="申请描述" prop="description">
          <el-input 
            v-model="resubmitForm.description" 
            type="textarea" 
            :rows="5" 
            placeholder="请重新填写您的运营说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResubmitDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitResubmit" :loading="resubmitting">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 积分流水对话框 -->
    <el-dialog v-model="transactionsVisible" title="积分流水" width="800px">
      <el-table :data="transactionsData" v-loading="transactionsLoading" border stripe max-height="400">
        <el-table-column prop="transactionType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransactionTypeTag(row.transactionType)">
              {{ getTransactionTypeText(row.transactionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pointsChange" label="变动数量" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.pointsChange > 0 ? 'green' : 'red' }">
              {{ row.pointsChange > 0 ? '+' : '' }}{{ row.pointsChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceAfter" label="变动后余额" width="120" />
        <el-table-column prop="reason" label="原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Edit, Refresh } from '@element-plus/icons-vue'
import { getMyApplications, getCurrentPoints, getUserPointTransactions, getMyTenantStatus, resubmitAudit } from '@/api'
import { updateUserInfo } from '@/api/auth'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = reactive({
  username: '',
  nickname: '',
  role: '',
  createdAt: null
})

// 初始化用户信息
const initUserInfo = () => {
  if (userStore.userInfo) {
    userInfo.username = userStore.userInfo.username || ''
    userInfo.nickname = userStore.userInfo.nickname || ''
    userInfo.role = userStore.userInfo.role || ''
    userInfo.createdAt = userStore.userInfo.createdAt || null
  }
}

// 编辑资料相关
const showEditDialog = ref(false)
const submitting = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  nickname: ''
})

const editRules = {
  nickname: [
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
  ]
}

// 运营方审核相关
const tenantInfo = ref(null)
const showResubmitDialog = ref(false)
const resubmitting = ref(false)
const resubmitFormRef = ref(null)
const resubmitForm = ref({
  description: ''
})

const resubmitRules = {
  description: [
    { required: true, message: '请填写申请描述', trigger: 'blur' },
    { min: 10, message: '描述至少10个字符', trigger: 'blur' }
  ]
}

const currentPoints = ref(0)
const selectedTenant = ref(null)
const transactionsVisible = ref(false)
const transactionsLoading = ref(false)
const transactionsData = ref([])

const approvedTenants = ref([])

// 加载已通过的申请
const loadApprovedTenants = async () => {
  try {
    const res = await getMyApplications({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      approvedTenants.value = res.data.list.filter(item => item.status === 'approved')
      if (approvedTenants.value.length > 0) {
        selectedTenant.value = approvedTenants.value[0].tenant.id
        await loadCurrentPoints()
      }
    }
  } catch (error) {
    console.error('加载运营方列表失败', error)
  }
}

// 加载运营方租户信息
const loadTenantInfo = async () => {
  if (userInfo.role !== 'operator') return
  
  try {
    const res = await getMyTenantStatus()
    if (res.code === 200) {
      tenantInfo.value = res.data
    }
  } catch (error) {
    console.error('加载租户信息失败', error)
  }
}

// 加载当前积分
const loadCurrentPoints = async () => {
  if (!selectedTenant.value) return
  
  try {
    const res = await getCurrentPoints(selectedTenant.value)
    if (res.code === 200) {
      currentPoints.value = res.data.pointsBalance
    }
  } catch (error) {
    console.error('加载积分失败', error)
  }
}

// 切换运营方
const handleTenantChange = async () => {
  await loadCurrentPoints()
}

// 查看流水
const viewTransactions = async () => {
  if (!selectedTenant.value) {
    ElMessage.warning('请先选择运营方')
    return
  }
  
  transactionsVisible.value = true
  transactionsLoading.value = true
  
  try {
    const res = await getUserPointTransactions({
      tenantId: selectedTenant.value,
      page: 1,
      pageSize: 20
    })
    if (res.code === 200) {
      transactionsData.value = res.data.list
    }
  } catch (error) {
    ElMessage.error('获取流水失败')
  } finally {
    transactionsLoading.value = false
  }
}

// 编辑资料
const handleEditClick = () => {
  editForm.value.nickname = userInfo.nickname || ''
  showEditDialog.value = true
}

const handleSubmitEdit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await updateUserInfo({
          nickname: editForm.value.nickname
        })
        
        // 更新本地状态
        userInfo.nickname = editForm.value.nickname
        
        // 更新 store 中的用户信息
        if (userStore.userInfo) {
          userStore.userInfo.nickname = editForm.value.nickname
          localStorage.setItem('user', JSON.stringify(userStore.userInfo))
        }
        
        ElMessage.success('更新成功')
        showEditDialog.value = false
      } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败：' + (error.message || '未知错误'))
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重新提交审核
const handleSubmitResubmit = async () => {
  if (!resubmitFormRef.value) return
  
  await resubmitFormRef.value.validate(async (valid) => {
    if (valid) {
      resubmitting.value = true
      try {
        await resubmitAudit({
          name: tenantInfo.value.name,
          description: resubmitForm.value.description
        })
        
        ElMessage.success('重新提交成功，请等待审核')
        showResubmitDialog.value = false
        
        // 重新加载租户信息
        await loadTenantInfo()
      } catch (error) {
        console.error('重新提交失败:', error)
      } finally {
        resubmitting.value = false
      }
    }
  })
}

const getRoleText = (role) => {
  const map = {
    admin: '管理员',
    operator: '运营方',
    user: '普通用户'
  }
  return map[role] || role
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    disabled: 'info'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    disabled: '已禁用'
  }
  return map[status] || status
}

const getTransactionTypeTag = (type) => {
  const map = {
    add: 'success',
    subtract: 'danger',
    modify: 'warning',
    exchange: 'info'
  }
  return map[type] || ''
}

const getTransactionTypeText = (type) => {
  const map = {
    add: '增加',
    subtract: '减少',
    modify: '修改',
    exchange: '兑换'
  }
  return map[type] || type
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  // 初始化用户信息
  initUserInfo()
  
  // 加载其他数据
  if (userInfo.role === 'user') {
    loadApprovedTenants()
  } else if (userInfo.role === 'operator') {
    loadTenantInfo()
  }
})
</script>

<style scoped>
.profile-page {
  /* 响应式由 .page-container 处理 */
}

.user-info {
  text-align: center;
}

.user-info h2 {
  margin: 15px 0 10px;
  color: #303133;
}

.user-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.user-info p strong {
  color: #303133;
}

.audit-status {
  padding: 10px 0;
}

.action-bar {
  margin-top: 15px;
  text-align: center;
}

.tenant-info {
  padding: 10px 0;
}

.points-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-value {
  font-size: 18px;
}

.points-value .label {
  color: #606266;
}

.points-value .value {
  color: #67c23a;
  font-weight: bold;
  font-size: 24px;
  margin-left: 10px;
}
</style>
