<template>
  <div class="user-manage-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="searchForm.nickname" placeholder="请输入昵称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部角色" clearable style="width: 150px">
            <el-option label="管理员" value="admin" />
            <el-option label="运营方" value="operator" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 操作按钮 -->
      <div style="margin-bottom: 20px;">
        <el-button type="primary" @click="handleShowCreateDialog">
          <el-icon><Plus /></el-icon>
          创建用户
        </el-button>
      </div>
      
      <el-table :data="userList" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="handleResetPassword(row.id)">
              重置密码
            </el-button>
            <el-button 
              v-if="row.role !== 'admin'"
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
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

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户信息" width="700px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="运营方" value="operator" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 如果是运营方，显示租户审核状态 -->
        <template v-if="editForm.role === 'operator' && editForm.tenantInfo">
          <el-divider content-position="left">租户审核信息</el-divider>
          <el-form-item label="租户名称">
            <el-input v-model="editForm.tenantInfo.name" disabled />
          </el-form-item>
          <el-form-item label="审核状态">
            <el-select v-model="editForm.tenantInfo.status" placeholder="请选择审核状态" style="width: 100%">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="拒绝原因" v-if="editForm.tenantInfo.status === 'rejected'">
            <el-input v-model="editForm.tenantInfo.rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEdit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新用户" width="600px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码（至少8位）" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="运营方" value="operator" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="createForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCreate" :loading="creating">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserList, resetUserPassword, updateUserStatus, getUserDetail, updateUserInfo, updateTenantStatus, createUser, deleteUser } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = ref({
  username: '',
  nickname: '',
  role: '',
  dateRange: []
})

// 编辑相关
const showEditDialog = ref(false)
const submitting = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  id: null,
  username: '',
  nickname: '',
  role: '',
  status: 1,
  tenantInfo: null
})

// 创建用户相关
const showCreateDialog = ref(false)
const creating = ref(false)
const createFormRef = ref(null)
const createForm = ref({
  username: '',
  password: '',
  nickname: '',
  role: 'user',
  status: 1
})

const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const editRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getRoleType = (role) => {
  const types = {
    admin: 'danger',
    operator: 'warning',
    user: 'success'
  }
  return types[role] || ''
}

const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    operator: '运营方',
    user: '普通用户'
  }
  return texts[role] || role
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      username: searchForm.value.username,
      nickname: searchForm.value.nickname,
      role: searchForm.value.role
    }
    
    // 处理日期范围
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.startDate = searchForm.value.dateRange[0]
      params.endDate = searchForm.value.dateRange[1]
    }
    
    const res = await getUserList(params)
    userList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    username: '',
    nickname: '',
    role: '',
    dateRange: []
  }
  currentPage.value = 1
  loadData()
}

const handleResetPassword = async (id) => {
  try {
    const res = await resetUserPassword(id)
    await ElMessageBox.alert(
      `新密码为：<strong>${res.data.newPassword}</strong><br/>请线下告知用户：${res.data.username}`,
      '密码重置成功',
      {
        confirmButtonText: '确定',
        dangerouslyUseHTMLString: true
      }
    )
  } catch (error) {
    console.error('重置密码失败:', error)
  }
}

const handleStatusChange = async (user) => {
  try {
    await updateUserStatus(user.id, { status: user.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 恢复原状态
    user.status = user.status === 1 ? 0 : 1
    console.error('更新状态失败:', error)
  }
}

const handleEdit = async (user) => {
  try {
    const res = await getUserDetail(user.id)
    const userData = res.data
    
    editForm.value = {
      id: userData.id,
      username: userData.username,
      nickname: userData.nickname || '',
      role: userData.role,
      status: userData.status,
      tenantInfo: userData.tenantInfo
    }
    
    showEditDialog.value = true
  } catch (error) {
    console.error('获取用户详情失败:', error)
  }
}

const handleSubmitEdit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 更新用户基本信息
        await updateUserInfo(editForm.value.id, {
          nickname: editForm.value.nickname,
          role: editForm.value.role,
          status: editForm.value.status
        })
        
        // 如果是运营方且有租户信息，更新租户审核状态
        if (editForm.value.role === 'operator' && editForm.value.tenantInfo) {
          await updateTenantStatus(editForm.value.tenantInfo.id, {
            status: editForm.value.tenantInfo.status,
            rejectReason: editForm.value.tenantInfo.rejectReason
          })
        }
        
        ElMessage.success('更新成功')
        showEditDialog.value = false
        loadData()
      } catch (error) {
        console.error('更新失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 显示创建对话框
const handleShowCreateDialog = () => {
  createForm.value = {
    username: '',
    password: '',
    nickname: '',
    role: 'user',
    status: 1
  }
  showCreateDialog.value = true
}

// 提交创建用户
const handleSubmitCreate = async () => {
  if (!createFormRef.value) return
  
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true
      try {
        await createUser(createForm.value)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        loadData()
      } catch (error) {
        console.error('创建失败:', error)
      } finally {
        creating.value = false
      }
    }
  })
}

// 删除用户
const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.username} 吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteUser(user.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-manage-page {
  max-width: 1400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
