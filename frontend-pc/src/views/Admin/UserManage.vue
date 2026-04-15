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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserList, resetUserPassword, updateUserStatus } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

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
