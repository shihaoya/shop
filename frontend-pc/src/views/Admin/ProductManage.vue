<template>
  <div class="product-manage-page page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>上架商品管理</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称"
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
      
      <el-table :data="productList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="pointsRequired" label="所需积分" width="120">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.pointsRequired }} 积分</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            {{ row.category || '未分类' }}
          </template>
        </el-table-column>
        <el-table-column label="所属租户" min-width="200">
          <template #default="{ row }">
            <div v-if="row.tenant">
              <div>{{ row.tenant.name }}</div>
              <div v-if="row.tenant.user" style="font-size: 12px; color: #999;">
                运营方: {{ row.tenant.user.nickname || row.tenant.user.username }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'on_shelf' ? 'success' : 'info'">
              {{ row.status === 'on_shelf' ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
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

    <!-- 商品详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="商品详情" width="700px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-descriptions :column="1" border v-if="currentProduct">
        <el-descriptions-item label="商品ID">{{ currentProduct.id }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentProduct.name }}</el-descriptions-item>
        <el-descriptions-item label="商品描述">
          {{ currentProduct.description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品图片">
          <el-image 
            v-if="currentProduct.imageUrl" 
            :src="currentProduct.imageUrl" 
            fit="contain"
            style="width: 200px; height: 200px"
          />
          <span v-else>无图片</span>
        </el-descriptions-item>
        <el-descriptions-item label="所需积分">
          <el-tag type="warning">{{ currentProduct.pointsRequired }} 积分</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="库存">{{ currentProduct.stock }}</el-descriptions-item>
        <el-descriptions-item label="分类">
          {{ currentProduct.category || '未分类' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentProduct.status === 'on_shelf' ? 'success' : 'info'">
            {{ currentProduct.status === 'on_shelf' ? '已上架' : '已下架' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属租户">
          <div v-if="currentProduct.tenant">
            <div><strong>{{ currentProduct.tenant.name }}</strong></div>
            <div v-if="currentProduct.tenant.user" style="margin-top: 5px; font-size: 13px; color: #666;">
              运营方: {{ currentProduct.tenant.user.nickname || currentProduct.tenant.user.username }}
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="排序权重">{{ currentProduct.sortOrder }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentProduct.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(currentProduct.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOnShelfProducts } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const productList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

// 详情相关
const showDetailDialog = ref(false)
const currentProduct = ref(null)

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getOnShelfProducts({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    })
    productList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleViewDetail = (product) => {
  currentProduct.value = product
  showDetailDialog.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.product-manage-page {
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

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
