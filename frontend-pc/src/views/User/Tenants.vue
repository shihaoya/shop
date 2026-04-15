<template>
  <div class="tenants-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运营方列表</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="运营方名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入运营方名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 运营方列表表格 -->
      <el-table :data="tenantList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="运营方名称" min-width="150" />
        <el-table-column label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '暂无描述' }}
          </template>
        </el-table-column>
        <el-table-column label="运营方" width="150">
          <template #default="{ row }">
            {{ row.user?.nickname || row.user?.username }}
          </template>
        </el-table-column>
        <el-table-column label="我的状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.myStatus" :type="getStatusType(row.myStatus)">
              {{ getStatusText(row.myStatus) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.myStatus || row.myStatus === 'rejected'" 
              type="primary" 
              size="small" 
              @click="handleApply(row)"
            >
              {{ row.myStatus === 'rejected' ? '重新申请' : '申请加入' }}
            </el-button>
            <el-button 
              v-else-if="row.myStatus === 'pending'" 
              size="small" 
              disabled
            >
              审核中
            </el-button>
            <el-button 
              v-else-if="row.myStatus === 'approved'" 
              type="success" 
              size="small" 
              @click="handleViewProducts(row)"
            >
              查看商品
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="pagination.total > 0"
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

    <!-- 申请加入对话框 -->
    <el-dialog v-model="applyVisible" title="申请加入运营方" width="500px">
      <div v-if="selectedTenant" class="apply-info">
        <p><strong>运营方：</strong>{{ selectedTenant.name }}</p>
      </div>
      <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="100px" style="margin-top: 20px">
        <el-form-item label="申请理由" prop="reason">
          <el-input 
            v-model="applyForm.reason" 
            type="textarea" 
            :rows="4"
            placeholder="请填写申请理由（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply" :loading="submitting">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserTenants, getMyApplications, applyJoinTenantWithReason } from '@/api'
import { useTenantStore } from '@/store/tenant'
import dayjs from 'dayjs'

const router = useRouter()
const tenantStore = useTenantStore()
const loading = ref(false)
const submitting = ref(false)
const applyVisible = ref(false)
const applyFormRef = ref(null)

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tenantList = ref([])
const selectedTenant = ref(null)

const applyForm = reactive({
  reason: ''
})

const applyRules = {
  reason: [
    { max: 500, message: '申请理由不能超过500个字符', trigger: 'blur' }
  ]
}

// 获取运营方列表
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword
    }
    const res = await getUserTenants(params)
    if (res.code === 200) {
      tenantList.value = res.data.list
      pagination.total = res.data.total
      
      // 获取当前用户的申请状态
      await loadMyApplicationsStatus()
    }
  } catch (error) {
    ElMessage.error('获取运营方列表失败')
  } finally {
    loading.value = false
  }
}

// 加载我的申请状态
const loadMyApplicationsStatus = async () => {
  try {
    const res = await getMyApplications({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      const applicationsMap = {}
      res.data.list.forEach(app => {
        applicationsMap[app.tenantId] = app.status
      })
      
      // 为每个运营方添加状态
      tenantList.value.forEach(tenant => {
        tenant.myStatus = applicationsMap[tenant.id] || null
      })
    }
  } catch (error) {
    console.error('获取申请状态失败:', error)
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

// 申请加入
const handleApply = (tenant) => {
  selectedTenant.value = tenant
  applyForm.reason = ''
  applyVisible.value = true
}

// 提交申请
const submitApply = async () => {
  if (!selectedTenant.value) return
  
  submitting.value = true
  try {
    await applyJoinTenantWithReason(selectedTenant.value.id, {
      reason: applyForm.reason || null
    })
    ElMessage.success('申请已提交，请等待审核')
    applyVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '申请失败')
  } finally {
    submitting.value = false
  }
}

// 查看商品
const handleViewProducts = (tenant) => {
  // 设置当前运营方
  tenantStore.setCurrentTenant(tenant.id, tenant)
  // 跳转到商品列表页
  router.push('/user/products')
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
.tenants-page {
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

.apply-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.apply-info p {
  margin: 0;
}
</style>
