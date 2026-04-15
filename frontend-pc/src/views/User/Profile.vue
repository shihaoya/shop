<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div class="user-info">
            <el-avatar :size="80" icon="UserFilled" />
            <h2>{{ userInfo.nickname || userInfo.username }}</h2>
            <p>用户名：{{ userInfo.username }}</p>
            <p>角色：{{ getRoleText(userInfo.role) }}</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
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
      </el-col>
    </el-row>

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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { getMyApplications, getCurrentPoints, getUserPointTransactions } from '@/api'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = reactive({
  username: userStore.username,
  nickname: userStore.nickname,
  role: userStore.userRole
})

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

const getRoleText = (role) => {
  const map = {
    admin: '管理员',
    operator: '运营方',
    user: '普通用户'
  }
  return map[role] || role
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
  loadApprovedTenants()
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.user-info {
  text-align: center;
}

.user-info h2 {
  margin: 15px 0 10px;
  color: #303133;
}

.user-info p {
  margin: 5px 0;
  color: #606266;
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
