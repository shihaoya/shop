<template>
  <div class="products-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="tenant-info">
            <span class="label">当前运营方：</span>
            <span class="value">{{ currentTenantName }}</span>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入商品名称" 
            clearable 
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" clearable style="width: 150px">
            <el-option label="实物商品" value="physical" />
            <el-option label="虚拟商品" value="virtual" />
            <el-option label="服务类" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 商品列表 -->
      <el-table :data="productList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="120">
          <template #default="{ row }">
            <el-image 
              v-if="row.image" 
              :src="row.image" 
              style="width: 80px; height: 80px"
              fit="cover"
              :preview-src-list="[row.image]"
            />
            <span v-else>暂无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" :type="getCategoryType(row.category)">
              {{ getCategoryText(row.category) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="pointsRequired" label="所需积分" width="120">
          <template #default="{ row }">
            <span class="points">{{ row.pointsRequired }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.description || '暂无描述'" placement="top" :show-after="500">
              <div class="description-cell">{{ row.description || '暂无描述' }}</div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleExchange(row)"
              :disabled="row.stock <= 0"
            >
              {{ row.stock > 0 ? '兑换' : '缺货' }}
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

    <!-- 兑换确认对话框 -->
    <el-dialog v-model="exchangeVisible" title="确认兑换" width="500px">
      <div v-if="selectedProduct" class="exchange-info">
        <p><strong>商品名称：</strong>{{ selectedProduct.name }}</p>
        <p><strong>所需积分：</strong><span class="points-highlight">{{ selectedProduct.pointsRequired }}</span></p>
        <p><strong>我的积分：</strong><span class="points-highlight">{{ myPoints }}</span></p>
      </div>
      
      <el-form ref="exchangeFormRef" :model="exchangeForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="兑换数量">
          <el-input-number 
            v-model="exchangeForm.quantity" 
            :min="1" 
            :max="selectedProduct?.stock || 1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="收货人姓名">
          <el-input v-model="exchangeForm.recipientName" placeholder="可选" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="exchangeForm.recipientPhone" placeholder="可选" />
        </el-form-item>
        <el-form-item label="收货地址">
          <el-input 
            v-model="exchangeForm.recipientAddress" 
            type="textarea" 
            :rows="3"
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="exchangeForm.remark" 
            type="textarea" 
            :rows="2"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="exchangeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExchange" :loading="submitting">确认兑换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getTenantProducts, createOrder } from '@/api'
import { useTenantStore } from '@/store/tenant'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const tenantStore = useTenantStore()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const exchangeVisible = ref(false)
const exchangeFormRef = ref(null)

const searchForm = reactive({
  keyword: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const productList = ref([])
const selectedProduct = ref(null)

const exchangeForm = reactive({
  quantity: 1,
  recipientName: '',
  recipientPhone: '',
  recipientAddress: '',
  remark: ''
})

// 当前运营方信息
const currentTenantId = computed(() => tenantStore.currentTenantId)
const currentTenantName = computed(() => tenantStore.currentTenantName || '未选择运营方')

// 我的积分
const myPoints = computed(() => userStore.userInfo?.pointsBalance || 0)

// 获取商品列表
const fetchData = async () => {
  if (!currentTenantId.value) {
    ElMessage.warning('请先选择运营方')
    return
  }

  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      category: searchForm.category
    }
    const res = await getTenantProducts(currentTenantId.value, params)
    if (res.code === 200) {
      productList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
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
  searchForm.category = ''
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

// 兑换商品
const handleExchange = (product) => {
  if (!currentTenantId.value) {
    ElMessage.warning('请先选择运营方')
    return
  }

  selectedProduct.value = product
  exchangeForm.quantity = 1
  exchangeForm.recipientName = ''
  exchangeForm.recipientPhone = ''
  exchangeForm.recipientAddress = ''
  exchangeForm.remark = ''
  exchangeVisible.value = true
}

// 提交兑换
const submitExchange = async () => {
  if (!selectedProduct.value || !currentTenantId.value) return

  const totalPoints = selectedProduct.value.pointsRequired * exchangeForm.quantity
  
  if (totalPoints > myPoints.value) {
    ElMessage.error('积分不足')
    return
  }

  submitting.value = true
  try {
    const orderData = {
      productId: selectedProduct.value.id,
      quantity: exchangeForm.quantity,
      recipientName: exchangeForm.recipientName || null,
      recipientPhone: exchangeForm.recipientPhone || null,
      recipientAddress: exchangeForm.recipientAddress || null,
      remark: exchangeForm.remark || null
    }
    
    await createOrder(orderData)
    ElMessage.success('兑换成功')
    exchangeVisible.value = false
    fetchData()
    // 刷新用户信息以更新积分
    await userStore.getUserInfo()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '兑换失败')
  } finally {
    submitting.value = false
  }
}

// 获取分类类型
const getCategoryType = (category) => {
  const map = {
    physical: '',
    virtual: 'success',
    service: 'warning'
  }
  return map[category] || ''
}

// 获取分类文本
const getCategoryText = (category) => {
  const map = {
    physical: '实物商品',
    virtual: '虚拟商品',
    service: '服务类'
  }
  return map[category] || category
}

onMounted(() => {
  fetchData()
  
  // 监听运营方切换
  tenantStore.$subscribe(() => {
    fetchData()
  })
})
</script>

<style scoped>
.products-list-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tenant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tenant-info .label {
  color: #606266;
  font-size: 14px;
}

.tenant-info .value {
  color: #409EFF;
  font-size: 14px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 20px;
}

.points {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}

.points-highlight {
  color: #E6A23C;
  font-weight: bold;
  font-size: 18px;
}

.description-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.exchange-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.exchange-info p {
  margin: 8px 0;
  line-height: 1.6;
}
</style>
