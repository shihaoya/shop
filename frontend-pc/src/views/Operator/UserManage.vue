<template>
  <div class="user-manage page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>

      <!-- 操作按钮 -->
      <div v-if="isApproved" style="margin-bottom: 20px;">
        <el-button type="success" @click="showCreateNewDialog">
          <el-icon><UserFilled /></el-icon>
          创建新用户
        </el-button>
        <el-button type="primary" @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-upload
          ref="uploadRef"
          :http-request="handleUploadRequest"
          :before-upload="beforeUpload"
          :show-file-list="false"
          accept=".xlsx,.xls,.csv"
          style="display: inline-block; margin-left: 10px;"
        >
          <el-button type="warning">
            <el-icon><Upload /></el-icon>
            导入用户
          </el-button>
        </el-upload>
      </div>
      <el-alert
        v-else
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #title>
          您的运营方账号尚未通过审核，暂无法添加用户。请先通过审核后再进行操作。
        </template>
      </el-alert>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.keyword" placeholder="请输入用户名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户列表 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="pointsBalance" label="积分余额" width="120" />
        <el-table-column label="申请状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status" :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请理由" min-width="200">
          <template #default="{ row }">
            {{ row.applyReason || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'"
              link 
              type="success" 
              size="small" 
              @click="handleAudit(row, 'approve')"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              link 
              type="danger" 
              size="small" 
              @click="handleAudit(row, 'reject')"
            >
              拒绝
            </el-button>
            <el-button 
              v-if="row.status === 'rejected'"
              link 
              type="warning" 
              size="small" 
              @click="handleAudit(row, 'revoke')"
            >
              撤销拒绝
            </el-button>
            <el-button link type="primary" size="small" @click="showAddPointsDialog(row)">增加积分</el-button>
            <el-button link type="warning" size="small" @click="showSubtractPointsDialog(row)">减少积分</el-button>
            <el-button link type="info" size="small" @click="viewTransactions(row)">流水</el-button>
            <el-button link type="warning" size="small" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button link type="danger" size="small" @click="handleRemove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 创建新用户对话框 -->
    <el-dialog v-model="createNewVisible" title="创建新用户" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="createNewFormRef" :model="createNewForm" :rules="createNewRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createNewForm.username" placeholder="3-50个字符，系统唯一" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createNewForm.nickname" placeholder="可选" />
        </el-form-item>
        <el-form-item label="初始积分" prop="initialPoints">
          <el-input-number v-model="createNewForm.initialPoints" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createNewVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateNew" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditVisible" :title="auditTitle" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <div v-if="auditAction === 'reject'" class="audit-form">
        <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
          <el-form-item label="拒绝理由" prop="reason">
            <el-input 
              v-model="auditForm.reason" 
              type="textarea" 
              :rows="4"
              placeholder="请填写拒绝理由（必填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <div v-else class="audit-confirm">
        <p>确定{{ auditAction === 'approve' ? '通过' : '撤销拒绝' }}该用户的申请吗？</p>
      </div>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button 
          :type="auditAction === 'approve' ? 'success' : 'danger'" 
          @click="submitAudit" 
          :loading="submitLoading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 增加积分对话框 -->
    <el-dialog v-model="addPointsVisible" title="增加积分" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="addPointsFormRef" :model="addPointsForm" :rules="pointsRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="addPointsForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-tag type="success">{{ addPointsForm.currentBalance }}</el-tag>
        </el-form-item>
        <el-form-item label="增加积分" prop="points">
          <el-input-number v-model="addPointsForm.points" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="addPointsForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addPointsVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddPoints" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 减少积分对话框 -->
    <el-dialog v-model="subtractPointsVisible" title="减少积分" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="subtractPointsFormRef" :model="subtractPointsForm" :rules="pointsRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="subtractPointsForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-tag type="success">{{ subtractPointsForm.currentBalance }}</el-tag>
        </el-form-item>
        <el-form-item label="减少积分" prop="points">
          <el-input-number v-model="subtractPointsForm.points" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="subtractPointsForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subtractPointsVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSubtractPoints" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 积分流水对话框 -->
    <el-dialog v-model="transactionsVisible" title="积分流水" width="900px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-table :data="transactionsData" v-loading="transactionsLoading" border stripe max-height="400">
        <el-table-column prop="transactionType" label="类型" width="120">
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
        <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="transactionsPagination.page"
        :page-size="transactionsPagination.pageSize"
        :total="transactionsPagination.total"
        layout="total, prev, pager, next"
        @current-change="handleTransactionsPageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-dialog>

    <!-- 重置密码结果对话框 -->
    <el-dialog v-model="resetPasswordResultVisible" title="密码重置成功" width="600px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-alert type="success" :closable="false" style="margin-bottom: 20px;">
        <template #title>
          用户 <strong>{{ resetPasswordResult?.username }}</strong> 的密码已重置
        </template>
      </el-alert>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{ resetPasswordResult?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ resetPasswordResult?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="新密码">
          <el-tag type="danger" size="large">{{ resetPasswordResult?.password }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-alert type="warning" :closable="false" style="margin-top: 20px;">
        <template #title>
          请妥善保管此密码，并告知用户。关闭后将无法再次查看！
        </template>
      </el-alert>
      <template #footer>
        <el-button @click="resetPasswordResultVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入结果对话框 -->
    <el-dialog v-model="importResultVisible" title="导入结果" width="800px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-alert type="success" :closable="false" style="margin-bottom: 20px;">
        <template #title>
          导入成功！共导入 {{ importResult.count }} 个用户
        </template>
      </el-alert>
      
      <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">导入的用户列表：</span>
        <el-button type="primary" size="small" @click="downloadImportResult">
          <el-icon><Download /></el-icon>
          下载结果
        </el-button>
      </div>
      <el-table :data="importResult.users" border stripe max-height="400">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="密码" width="150">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.password }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pointsBalance" label="初始积分" width="100" />
      </el-table>

      <template #footer>
        <el-button @click="importResultVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入失败对话框 -->
    <el-dialog v-model="importErrorVisible" title="导入失败" width="700px" :close-on-click-modal="false" :close-on-press-escape="false">
      <el-alert type="error" :closable="false" style="margin-bottom: 20px;">
        <template #title>
          {{ importError.message }}
        </template>
      </el-alert>
      
      <el-table :data="importError.errors" border stripe max-height="400">
        <el-table-column prop="row" label="行号" width="80" align="center" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="error" label="错误原因" min-width="200">
          <template #default="{ row }">
            <span style="color: #f56c6c;">{{ row.error }}</span>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button type="primary" @click="importErrorVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Download, Upload } from '@element-plus/icons-vue'
import { 
  getOperatorUsers, 
  createNewUser, 
  removeUser,
  approveApplication,
  rejectApplication,
  resetUserPassword,
  getMyTenantStatus,
  addPoints,
  subtractPoints,
  getPointTransactions,
  importUsers,
  downloadUserTemplate
} from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitLoading = ref(false)
const createNewVisible = ref(false)
const auditVisible = ref(false)
const addPointsVisible = ref(false)
const subtractPointsVisible = ref(false)
const transactionsVisible = ref(false)
const resetPasswordResultVisible = ref(false)
const importResultVisible = ref(false)
const createNewFormRef = ref(null)
const auditFormRef = ref(null)
const addPointsFormRef = ref(null)
const subtractPointsFormRef = ref(null)
const uploadRef = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const currentAuditUser = ref(null)
const auditAction = ref('approve') // approve, reject, revoke
const isApproved = ref(false) // 运营方审核状态
const resetPasswordResult = ref(null)
const transactionsData = ref([])
const transactionsLoading = ref(false)
const transactionsPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})
const currentPointsUser = ref(null)

const importResult = reactive({
  count: 0,
  users: []
})

// 导入失败对话框
const importErrorVisible = ref(false)
const importError = reactive({
  message: '',
  errors: []
})

const createNewForm = reactive({
  username: '',
  nickname: '',
  initialPoints: 0
})

const auditForm = reactive({
  reason: ''
})

const addPointsForm = reactive({
  userId: null,
  username: '',
  currentBalance: 0,
  points: 1,
  reason: ''
})

const subtractPointsForm = reactive({
  userId: null,
  username: '',
  currentBalance: 0,
  points: 1,
  reason: ''
})

const createNewRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在3-50个字符之间', trigger: 'blur' }
  ],
  initialPoints: [{ required: true, message: '请输入初始积分', trigger: 'blur' }]
}

const auditRules = {
  reason: [
    { required: true, message: '请填写拒绝理由', trigger: 'blur' },
    { min: 5, message: '拒绝理由至少5个字符', trigger: 'blur' }
  ]
}

const pointsRules = {
  points: [
    { required: true, message: '请输入积分数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '积分数量必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入原因', trigger: 'blur' }
  ]
}

const auditTitle = computed(() => {
  const titles = {
    approve: '审核通过',
    reject: '拒绝申请',
    revoke: '撤销拒绝'
  }
  return titles[auditAction.value]
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getOperatorUsers(params)
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 分页
const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

// 显示创建新用户对话框
const showCreateNewDialog = () => {
  Object.assign(createNewForm, {
    username: '',
    nickname: '',
    initialPoints: 0
  })
  createNewVisible.value = true
}

// 提交创建新用户
const submitCreateNew = async () => {
  if (!createNewFormRef.value) return
  
  await createNewFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const res = await createNewUser(createNewForm)
      ElMessage.success(`创建成功！用户密码为：${res.data.password}，请妥善保管并告知用户`)
      createNewVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 重置密码
const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${row.username} 的密码吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await resetUserPassword(row.userId || row.user?.id)
    
    // 显示结果对话框
    resetPasswordResult.value = {
      username: row.username,
      nickname: row.nickname,
      password: res.data.password
    }
    resetPasswordResultVisible.value = true
  } catch (error) {
    if (error !== 'cancel') {
      // 响应拦截器已统一处理错误提示
    }
  }
}

// 审核操作
const handleAudit = (row, action) => {
  currentAuditUser.value = row
  auditAction.value = action
  
  if (action === 'reject') {
    auditForm.reason = ''
    auditVisible.value = true
  } else if (action === 'approve' || action === 'revoke') {
    auditVisible.value = true
  }
}

// 提交审核
const submitAudit = async () => {
  if (!currentAuditUser.value) return
  
  if (auditAction.value === 'reject') {
    if (!auditFormRef.value) return
    
    await auditFormRef.value.validate(async (valid) => {
      if (!valid) return
      
      submitLoading.value = true
      try {
        await rejectApplication(currentAuditUser.value.id, { reason: auditForm.reason })
        ElMessage.success('已拒绝')
        auditVisible.value = false
        fetchData()
      } catch (error) {
        // 响应拦截器已统一处理错误提示
      } finally {
        submitLoading.value = false
      }
    })
  } else if (auditAction.value === 'approve' || auditAction.value === 'revoke') {
    submitLoading.value = true
    try {
      await approveApplication(currentAuditUser.value.id)
      ElMessage.success(auditAction.value === 'approve' ? '审核通过' : '已撤销拒绝')
      auditVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  }
}

// 移除用户
const handleRemove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要移除用户 ${row.username} 吗？移除后可在回收站恢复`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await removeUser(row.id)
    ElMessage.success('移除成功')
    fetchData()
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// ==================== 积分管理相关方法 ====================

// 显示增加积分对话框
const showAddPointsDialog = (row) => {
  currentPointsUser.value = row
  Object.assign(addPointsForm, {
    userId: row.userId || row.user?.id,
    username: row.username,
    currentBalance: row.pointsBalance || 0,
    points: 1,
    reason: ''
  })
  addPointsVisible.value = true
}

// 提交增加积分
const submitAddPoints = async () => {
  if (!addPointsFormRef.value) return
  
  await addPointsFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await addPoints(addPointsForm.userId, {
        points: addPointsForm.points,
        reason: addPointsForm.reason
      })
      ElMessage.success('积分增加成功')
      addPointsVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 显示减少积分对话框
const showSubtractPointsDialog = (row) => {
  currentPointsUser.value = row
  Object.assign(subtractPointsForm, {
    userId: row.userId || row.user?.id,
    username: row.username,
    currentBalance: row.pointsBalance || 0,
    points: 1,
    reason: ''
  })
  subtractPointsVisible.value = true
}

// 提交减少积分
const submitSubtractPoints = async () => {
  if (!subtractPointsFormRef.value) return
  
  await subtractPointsFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (subtractPointsForm.points > subtractPointsForm.currentBalance) {
      ElMessage.error('减少的积分不能大于当前余额')
      return
    }
    
    submitLoading.value = true
    try {
      await subtractPoints(subtractPointsForm.userId, {
        points: subtractPointsForm.points,
        reason: subtractPointsForm.reason
      })
      ElMessage.success('积分减少成功')
      subtractPointsVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 查看积分流水
const viewTransactions = async (row) => {
  currentPointsUser.value = row
  transactionsPagination.page = 1
  await fetchTransactions(row.userId || row.user?.id)
  transactionsVisible.value = true
}

// 获取积分流水
const fetchTransactions = async (userId) => {
  transactionsLoading.value = true
  try {
    const res = await getPointTransactions(userId, {
      page: transactionsPagination.page,
      pageSize: transactionsPagination.pageSize
    })
    if (res.code === 200) {
      transactionsData.value = res.data.list
      transactionsPagination.total = res.data.total
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  } finally {
    transactionsLoading.value = false
  }
}

// 流水分页变化
const handleTransactionsPageChange = (page) => {
  transactionsPagination.page = page
  if (currentPointsUser.value) {
    fetchTransactions(currentPointsUser.value.userId || currentPointsUser.value.user?.id)
  }
}

// 获取流水类型标签
const getTransactionTypeTag = (type) => {
  const map = {
    add: 'success',
    subtract: 'danger',
    exchange: 'warning',
    modify: 'info'
  }
  return map[type] || ''
}

// 获取流水类型文本
const getTransactionTypeText = (type) => {
  const map = {
    add: '增加',
    subtract: '减少',
    exchange: '兑换',
    modify: '修改'
  }
  return map[type] || type
}

// ==================== 导入导出相关方法 ====================

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const res = await downloadUserTemplate()
    
    // 创建 Blob 对象
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `用户导入模板_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('模板下载成功')
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 上传前验证
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') ||
                  file.name.endsWith('.xls') ||
                  file.name.endsWith('.csv')
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 或 CSV 文件！')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过 5MB！')
    return false
  }
  return true
}

// 自定义上传请求
const handleUploadRequest = async (options) => {
  const { file } = options
  
  try {
    const res = await importUsers(file)
    
    if (res.code === 200) {
      // 设置结果
      importResult.count = res.data.count || 0
      importResult.users = res.data.users || []
      
      // 显示结果对话框
      importResultVisible.value = true
      
      // 刷新列表
      fetchData()
    }
  } catch (error) {
    // 导入失败，显示错误信息（表格形式）
    console.log('========== 导入错误调试信息 ==========')
    console.log('完整 error 对象:', error)
    console.log('error.response:', error.response)
    console.log('error.response?.data:', error.response?.data)
    console.log('========================================')
    
    // 尝试从多个位置获取错误数据
    let errorData = {}
    
    if (error.response?.data) {
      // 如果 data 是字符串，尝试解析 JSON
      if (typeof error.response.data === 'string') {
        try {
          errorData = JSON.parse(error.response.data)
        } catch (e) {
          errorData = { message: error.response.data }
        }
      } else if (typeof error.response.data === 'object') {
        errorData = error.response.data
      }
    }
    
    // 后端 error 函数把 errors 数组放在 data 字段中
    const errors = errorData.data || []
    const errorMsg = errorData.message || error.message || '导入失败'
    
    console.log('解析后的 errorData:', errorData)
    console.log('解析后的 errors:', errors)
    console.log('errors 类型:', typeof errors, Array.isArray(errors))
    console.log('errors.length:', errors.length)
    console.log('errorMsg:', errorMsg)
    
    if (errors.length > 0) {
      // 设置错误数据并显示对话框
      importError.message = errorMsg
      importError.errors = errors
      importErrorVisible.value = true
    } else {
      // 没有详细错误信息，使用 ElMessageBox
      ElMessageBox.alert(
        errorMsg,
        '导入失败',
        {
          confirmButtonText: '知道了',
          type: 'error',
          closeOnClickModal: false,
          closeOnPressEscape: false
        }
      )
    }
  }
}

// 下载导入结果（Excel 格式）
const downloadImportResult = async () => {
  if (!importResult.users || importResult.users.length === 0) {
    ElMessage.warning('没有可下载的数据')
    return
  }
  
  try {
    // 调用后端接口生成 Excel 文件
    const { downloadImportResult } = await import('@/api')
    const res = await downloadImportResult(importResult.users)
    
    // 创建 Blob 对象
    const blob = new Blob([res], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `用户导入结果_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

// 格式化时间
const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(async () => {
  // 获取运营方审核状态
  try {
    const res = await getMyTenantStatus()
    if (res.code === 200 && res.data) {
      isApproved.value = res.data.status === 'approved'
    }
  } catch (error) {
    console.error('获取审核状态失败:', error)
  }
  
  fetchData()
})
</script>

<style scoped>
.user-manage {
  /* 响应式由 .page-container 处理 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 18px;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.search-form {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 搜索表单中的选择框圆角 */
.search-form :deep(.el-select .el-input__wrapper),
.search-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.audit-form {
  margin-top: 10px;
}

.audit-confirm {
  padding: 20px;
  text-align: center;
  font-size: 16px;
}

/* 导入错误弹框样式 */
:deep(.import-error-dialog) {
  width: 700px !important;
}

:deep(.import-error-dialog .el-message-box__content) {
  padding: 20px;
}

/* 错误表格样式 */
:deep(.import-error-dialog table.el-table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
}

:deep(.import-error-dialog table.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  border: 1px solid #ebeef5;
  padding: 12px 0;
}

:deep(.import-error-dialog table.el-table td.el-table__cell) {
  border: 1px solid #ebeef5;
  padding: 12px 0;
}

:deep(.import-error-dialog table.el-table tr.el-table__row--striped) {
  background-color: #fafafa;
}

:deep(.import-error-dialog table.el-table tr.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
