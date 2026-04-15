<template>
  <div class="audit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运营方审核</span>
        </div>
      </template>
      
      <el-table :data="tenantList" v-loading="loading" style="width: 100%">
        <el-table-column prop="user.username" label="申请人" width="150" />
        <el-table-column prop="name" label="租户名称" width="200" />
        <el-table-column prop="description" label="申请说明" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row.id)">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row.id)">
              拒绝
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
import { getPendingTenants, approveTenant, rejectTenant } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const tenantList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPendingTenants({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    tenantList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.audit-page {
  max-width: 1400px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
