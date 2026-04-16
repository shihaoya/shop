<template>
  <div class="audit-page page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运营方审核</span>
        </div>
      </template>
      
      <!-- 状态筛选 -->
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="审核状态" clearable @change="handleFilterChange" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
      </div>
      
      <el-table :data="tenantList" v-loading="loading" style="width: 100%">
        <el-table-column prop="user.username" label="申请人" width="150" />
        <el-table-column prop="name" label="租户名称" width="200" />
        <el-table-column prop="description" label="申请说明" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button link type="success" size="small" @click="handleApprove(row.id)">
                通过
              </el-button>
              <el-button link type="danger" size="small" @click="handleReject(row.id)">
                拒绝
              </el-button>
            </template>
            <el-button link type="primary" size="small" @click="handleViewHistory(row)">
              审核历史
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 审核历史对话框 -->
    <el-dialog v-model="showHistoryDialog" title="审核历史记录" width="900px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-table :data="historyList" v-loading="historyLoading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="审核结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.auditResult === 'approved' ? 'success' : 'danger'">
              {{ row.auditResult === 'approved' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态变更" width="180">
          <template #default="{ row }">
            <span>{{ getStatusText(row.previousStatus) }}</span>
            <el-icon style="margin: 0 5px"><Right /></el-icon>
            <span>{{ getStatusText(row.newStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="200">
          <template #default="{ row }">
            {{ row.rejectReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审核人" width="150">
          <template #default="{ row }">
            {{ row.auditor?.nickname || row.auditor?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="审核时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination" v-if="historyTotal > 0">
        <el-pagination
          v-model:current-page="historyPage"
          v-model:page-size="historyPageSize"
          :total="historyTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadHistory"
          @current-change="loadHistory"
        />
      </div>
      <template #footer>
        <el-button @click="showHistoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTenants, approveTenant, rejectTenant, getTenantAuditHistory } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const tenantList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref('')

// 审核历史相关
const showHistoryDialog = ref(false)
const historyLoading = ref(false)
const historyList = ref([])
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)
const currentTenantId = ref(null)

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 如果有状态筛选，添加到参数中
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await getTenants(params)
    tenantList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadData()
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
    loadData()
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
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error)
    }
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    disabled: '已禁用'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    disabled: 'info'
  }
  return typeMap[status] || 'info'
}

const handleViewHistory = async (tenant) => {
  currentTenantId.value = tenant.id
  historyPage.value = 1
  showHistoryDialog.value = true
  await loadHistory()
}

const loadHistory = async () => {
  if (!currentTenantId.value) return
  
  historyLoading.value = true
  try {
    const res = await getTenantAuditHistory(currentTenantId.value, {
      page: historyPage.value,
      pageSize: historyPageSize.value
    })
    historyList.value = res.data.list
    historyTotal.value = res.data.total
  } catch (error) {
    console.error('加载审核历史失败:', error)
    ElMessage.error('加载审核历史失败')
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.audit-page {
  /* 响应式由 .page-container 处理 */
}

.card-header {
  font-weight: 700;
  font-size: 18px;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.filter-bar {
  margin-bottom: 24px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
