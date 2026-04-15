<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div>
            <el-button type="primary" @click="showAddExistingDialog">
              <el-icon><Plus /></el-icon>
              添加已注册用户
            </el-button>
            <el-button type="success" @click="showCreateNewDialog">
              <el-icon><UserFilled /></el-icon>
              创建新用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.keyword" placeholder="请输入用户名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户列表 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
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

    <!-- 添加已注册用户对话框 -->
    <el-dialog v-model="addExistingVisible" title="添加已注册用户" width="600px">
      <el-form ref="addExistingFormRef" :model="addExistingForm" :rules="addExistingRules" label-width="100px">
        <el-form-item label="选择用户" prop="userId">
          <el-select
            v-model="addExistingForm.userId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入用户名搜索"
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.username}${user.nickname ? '(' + user.nickname + ')' : ''}`"
              :value="user.id"
            >
              <span style="float: left">{{ user.username }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ user.nickname || '' }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="初始积分" prop="initialPoints">
          <el-input-number v-model="addExistingForm.initialPoints" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addExistingVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddExisting" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建新用户对话框 -->
    <el-dialog v-model="createNewVisible" title="创建新用户" width="500px">
      <el-form ref="createNewFormRef" :model="createNewForm" :rules="createNewRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createNewForm.username" placeholder="3-50个字符" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createNewForm.password" type="password" placeholder="留空则使用默认密码123456" show-password />
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
    <el-dialog v-model="auditVisible" :title="auditTitle" width="500px">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UserFilled } from '@element-plus/icons-vue'
import { 
  getOperatorUsers, 
  addExistingUser, 
  createNewUser, 
  removeUser,
  approveApplication,
  rejectApplication,
  getAvailableUsers
} from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitLoading = ref(false)
const addExistingVisible = ref(false)
const createNewVisible = ref(false)
const auditVisible = ref(false)
const addExistingFormRef = ref(null)
const createNewFormRef = ref(null)
const auditFormRef = ref(null)

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

// 用户搜索相关
const availableUsers = ref([])
const userSearchLoading = ref(false)

const addExistingForm = reactive({
  userId: null,
  initialPoints: 0
})

const createNewForm = reactive({
  username: '',
  password: '',
  nickname: '',
  initialPoints: 0
})

const auditForm = reactive({
  reason: ''
})

const addExistingRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  initialPoints: [{ required: true, message: '请输入初始积分', trigger: 'blur' }]
}

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
    ElMessage.error('获取用户列表失败')
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

// 显示添加已注册用户对话框
const showAddExistingDialog = () => {
  Object.assign(addExistingForm, { userId: null, initialPoints: 0 })
  availableUsers.value = []
  addExistingVisible.value = true
}

// 远程搜索用户
const searchUsers = async (query) => {
  if (!query || query.trim() === '') {
    availableUsers.value = []
    return
  }
  
  userSearchLoading.value = true
  try {
    const res = await getAvailableUsers({ keyword: query, pageSize: 20 })
    if (res.code === 200) {
      // 过滤掉已经在本租户中的用户
      const existingUserIds = tableData.value.map(u => u.id)
      availableUsers.value = res.data.list.filter(user => !existingUserIds.includes(user.id))
    }
  } catch (error) {
    ElMessage.error('搜索用户失败')
  } finally {
    userSearchLoading.value = false
  }
}

// 显示创建新用户对话框
const showCreateNewDialog = () => {
  Object.assign(createNewForm, {
    username: '',
    password: '',
    nickname: '',
    initialPoints: 0
  })
  createNewVisible.value = true
}

// 提交添加已注册用户
const submitAddExisting = async () => {
  if (!addExistingFormRef.value) return
  
  await addExistingFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      // 获取选中的用户信息
      const selectedUser = availableUsers.value.find(u => u.id === addExistingForm.userId)
      if (!selectedUser) {
        ElMessage.error('请选择有效的用户')
        return
      }
      
      await addExistingUser({
        userId: addExistingForm.userId,
        initialPoints: addExistingForm.initialPoints
      })
      ElMessage.success('添加成功')
      addExistingVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '添加失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 提交创建新用户
const submitCreateNew = async () => {
  if (!createNewFormRef.value) return
  
  await createNewFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await createNewUser(createNewForm)
      ElMessage.success('创建成功')
      createNewVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '创建失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 查看详情
const handleViewDetail = (row) => {
  ElMessage.info(`查看用户 ${row.username} 的详情（功能待完善）`)
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
        ElMessage.error(error.response?.data?.message || '操作失败')
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
      ElMessage.error(error.response?.data?.message || '操作失败')
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
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '移除失败')
    }
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.audit-form {
  margin-top: 10px;
}

.audit-confirm {
  padding: 20px;
  text-align: center;
  font-size: 16px;
}
</style>
