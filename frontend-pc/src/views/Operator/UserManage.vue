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
        <el-table-column prop="createdAt" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
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
    <el-dialog v-model="addExistingVisible" title="添加已注册用户" width="500px">
      <el-form ref="addExistingFormRef" :model="addExistingForm" :rules="addExistingRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addExistingForm.username" placeholder="请输入用户名" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UserFilled } from '@element-plus/icons-vue'
import { getUsers, addExistingUser, createNewUser, removeUser } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitLoading = ref(false)
const addExistingVisible = ref(false)
const createNewVisible = ref(false)
const addExistingFormRef = ref(null)
const createNewFormRef = ref(null)

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])

const addExistingForm = reactive({
  username: '',
  initialPoints: 0
})

const createNewForm = reactive({
  username: '',
  password: '',
  nickname: '',
  initialPoints: 0
})

const addExistingRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  initialPoints: [{ required: true, message: '请输入初始积分', trigger: 'blur' }]
}

const createNewRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在3-50个字符之间', trigger: 'blur' }
  ],
  initialPoints: [{ required: true, message: '请输入初始积分', trigger: 'blur' }]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getUsers(params)
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
  Object.assign(addExistingForm, { username: '', initialPoints: 0 })
  addExistingVisible.value = true
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
      await addExistingUser(addExistingForm)
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
</style>
