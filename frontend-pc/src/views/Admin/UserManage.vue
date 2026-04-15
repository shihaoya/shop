<template>
  <div class="user-manage-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名或昵称"
            style="width: 300px"
            clearable
            @clear="loadData"
            @keyup.enter="loadData"
          >
            <template #append>
              <el-button :icon="Search" @click="loadData" />
            </template>
          </el-input>
        </div>
      </template>
      
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="handleResetPassword(row.id)">
              重置密码
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserList, resetUserPassword, updateUserStatus, getUserDetail, updateUserInfo, updateTenantStatus } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

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
    const res = await getUserList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    })
    userList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
