<template>
  <div class="applications-page">
    <el-card>
      <template #header>
        <span>我的申请</span>
      </template>

      <el-table :data="applicationList" v-loading="loading" border stripe>
        <el-table-column prop="tenant.name" label="运营方名称" width="200" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pointsBalance" label="积分余额" width="120" />
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'approved'" 
              link 
              type="primary" 
              size="small"
              @click="handleSwitch(row.tenantId)"
            >
              进入
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="applicationList.length === 0" description="暂无申请记录" />

      <el-pagination
        v-if="pagination.total > 0"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyApplications, switchTenant } from '@/api'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const applicationList = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getMyApplications(params)
    if (res.code === 200) {
      applicationList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取申请列表失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const handleSwitch = async (tenantId) => {
  try {
    await switchTenant(tenantId)
    ElMessage.success('切换成功')
    // 这里可以跳转到用户首页或其他页面
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '切换失败')
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.applications-page {
  padding: 20px;
}
</style>
