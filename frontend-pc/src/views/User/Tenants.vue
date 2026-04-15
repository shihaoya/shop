<template>
  <div class="tenants-page">
    <el-card>
      <template #header>
        <span>运营方列表</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="tenant in tenantList" :key="tenant.id">
          <el-card class="tenant-card" shadow="hover">
            <h3>{{ tenant.name }}</h3>
            <p class="description">{{ tenant.description || '暂无描述' }}</p>
            <div class="operator-info">
              <span>运营方：{{ tenant.user?.nickname || tenant.user?.username }}</span>
            </div>
            <el-button type="primary" style="width: 100%; margin-top: 15px" @click="handleViewProducts(tenant)">
              查看商品
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="tenantList.length === 0" description="暂无运营方" />

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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserTenants } from '@/api'

const router = useRouter()

const tenantList = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 9,
  total: 0
})

const fetchData = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getUserTenants(params)
    if (res.code === 200) {
      tenantList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取运营方列表失败')
  }
}

const handleViewProducts = (tenant) => {
  router.push(`/user/products/${tenant.id}`)
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.tenants-page {
  padding: 20px;
}

.tenant-card {
  margin-bottom: 20px;
  min-height: 200px;
}

.tenant-card h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.description {
  color: #909399;
  font-size: 14px;
  min-height: 40px;
}

.operator-info {
  color: #606266;
  font-size: 13px;
  margin-top: 10px;
}
</style>
