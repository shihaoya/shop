<template>
  <div class="points-manage page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>积分管理</span>
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

      <!-- 用户积分列表 -->
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" min-width="150" />
        <el-table-column prop="pointsBalance" label="积分余额" width="120">
          <template #default="{ row }">
            <el-tag type="success">{{ row.pointsBalance }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showAddDialog(row)">增加</el-button>
            <el-button link type="warning" size="small" @click="showSubtractDialog(row)">减少</el-button>
            <el-button link type="info" size="small" @click="showModifyDialog(row)">修改</el-button>
            <el-button link type="success" size="small" @click="viewTransactions(row)">流水</el-button>
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

    <!-- 增加积分对话框 -->
    <el-dialog v-model="addDialogVisible" title="增加积分" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="addForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-tag type="success">{{ addForm.currentBalance }}</el-tag>
        </el-form-item>
        <el-form-item label="增加积分" prop="points">
          <el-input-number v-model="addForm.points" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 减少积分对话框 -->
    <el-dialog v-model="subtractDialogVisible" title="减少积分" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="subtractFormRef" :model="subtractForm" :rules="subtractRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="subtractForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-tag type="success">{{ subtractForm.currentBalance }}</el-tag>
        </el-form-item>
        <el-form-item label="减少积分" prop="points">
          <el-input-number v-model="subtractForm.points" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="subtractForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subtractDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSubtract" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改积分对话框 -->
    <el-dialog v-model="modifyDialogVisible" title="修改积分" width="500px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-form ref="modifyFormRef" :model="modifyForm" :rules="modifyRules" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="modifyForm.username" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-tag type="success">{{ modifyForm.currentBalance }}</el-tag>
        </el-form-item>
        <el-form-item label="新积分值" prop="newPoints">
          <el-input-number v-model="modifyForm.newPoints" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="modifyForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitModify" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 积分流水对话框 -->
    <el-dialog v-model="transactionsVisible" title="积分流水" width="800px" :close-on-click-modal="true" :close-on-press-escape="false">
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
      <el-pagination
        :current-page="transactionsPagination.page"
        :page-size="transactionsPagination.pageSize"
        :total="transactionsPagination.total"
        layout="total, prev, pager, next"
        @current-change="handleTransactionsPageChange"
        style="margin-top: 20px; justify-content: center"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPointsUsers, addPoints, subtractPoints, modifyPoints, getPointTransactions } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitLoading = ref(false)
const transactionsLoading = ref(false)

const addDialogVisible = ref(false)
const subtractDialogVisible = ref(false)
const modifyDialogVisible = ref(false)
const transactionsVisible = ref(false)

const addFormRef = ref(null)
const subtractFormRef = ref(null)
const modifyFormRef = ref(null)

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])

const addForm = reactive({
  userId: null,
  username: '',
  currentBalance: 0,
  points: 1,
  reason: ''
})

const subtractForm = reactive({
  userId: null,
  username: '',
  currentBalance: 0,
  points: 1,
  reason: ''
})

const modifyForm = reactive({
  userId: null,
  username: '',
  currentBalance: 0,
  newPoints: 0,
  reason: ''
})

const addRules = {
  points: [{ required: true, message: '请输入积分数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

const subtractRules = {
  points: [{ required: true, message: '请输入积分数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

const modifyRules = {
  newPoints: [{ required: true, message: '请输入新积分值', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

const transactionsData = ref([])
const transactionsPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  userId: null
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
    const res = await getPointsUsers(params)
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

// 显示增加积分对话框
const showAddDialog = (row) => {
  Object.assign(addForm, {
    userId: row.id,
    username: row.username,
    currentBalance: row.pointsBalance,
    points: 1,
    reason: ''
  })
  addDialogVisible.value = true
}

// 显示减少积分对话框
const showSubtractDialog = (row) => {
  Object.assign(subtractForm, {
    userId: row.id,
    username: row.username,
    currentBalance: row.pointsBalance,
    points: 1,
    reason: ''
  })
  subtractDialogVisible.value = true
}

// 显示修改积分对话框
const showModifyDialog = (row) => {
  Object.assign(modifyForm, {
    userId: row.id,
    username: row.username,
    currentBalance: row.pointsBalance,
    newPoints: row.pointsBalance,
    reason: ''
  })
  modifyDialogVisible.value = true
}

// 提交增加积分
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await addPoints(addForm.userId, {
        points: addForm.points,
        reason: addForm.reason
      })
      ElMessage.success('增加成功')
      addDialogVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 提交减少积分
const submitSubtract = async () => {
  if (!subtractFormRef.value) return
  
  await subtractFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await subtractPoints(subtractForm.userId, {
        points: subtractForm.points,
        reason: subtractForm.reason
      })
      ElMessage.success('减少成功')
      subtractDialogVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 提交修改积分
const submitModify = async () => {
  if (!modifyFormRef.value) return
  
  await modifyFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await modifyPoints(modifyForm.userId, {
        newPoints: modifyForm.newPoints,
        reason: modifyForm.reason
      })
      ElMessage.success('修改成功')
      modifyDialogVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 查看流水
const viewTransactions = async (row) => {
  transactionsPagination.userId = row.id
  transactionsPagination.page = 1
  transactionsVisible.value = true
  await fetchTransactions()
}

const fetchTransactions = async () => {
  transactionsLoading.value = true
  try {
    const params = {
      page: transactionsPagination.page,
      pageSize: transactionsPagination.pageSize
    }
    const res = await getPointTransactions(transactionsPagination.userId, params)
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

const handleTransactionsPageChange = (page) => {
  transactionsPagination.page = page
  fetchTransactions()
}

// 获取交易类型标签
const getTransactionTypeTag = (type) => {
  const map = {
    add: 'success',
    subtract: 'danger',
    modify: 'warning',
    exchange: 'info'
  }
  return map[type] || ''
}

// 获取交易类型文本
const getTransactionTypeText = (type) => {
  const map = {
    add: '增加',
    subtract: '减少',
    modify: '修改',
    exchange: '兑换'
  }
  return map[type] || type
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
.points-manage {
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
</style>
