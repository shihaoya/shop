<template>
  <div class="products-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ tenantName }} - 商品列表</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6" v-for="product in productList" :key="product.id">
          <el-card class="product-card" shadow="hover">
            <el-image 
              v-if="product.imageUrl" 
              :src="product.imageUrl" 
              fit="cover"
              style="width: 100%; height: 200px; border-radius: 4px"
            />
            <div v-else class="image-placeholder">
              <el-icon :size="50"><Picture /></el-icon>
            </div>
            
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-desc">{{ product.description || '暂无描述' }}</p>
            
            <div class="product-info">
              <div class="points">
                <el-icon><Coin /></el-icon>
                <span>{{ product.pointsCost }} 积分</span>
              </div>
              <div class="stock">库存：{{ product.stock }}</div>
            </div>
            
            <el-button 
              type="primary" 
              style="width: 100%; margin-top: 15px" 
              :disabled="product.stock === 0"
              @click="handleExchange(product)"
            >
              {{ product.stock === 0 ? '已售罄' : '立即兑换' }}
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="productList.length === 0" description="暂无商品" />

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

    <!-- 兑换确认对话框 -->
    <el-dialog v-model="exchangeVisible" title="确认兑换" width="500px">
      <el-form v-if="selectedProduct" label-width="100px">
        <el-form-item label="商品名称">
          <span>{{ selectedProduct.name }}</span>
        </el-form-item>
        <el-form-item label="所需积分">
          <span class="points-text">{{ selectedProduct.pointsCost }} 积分</span>
        </el-form-item>
        <el-form-item label="兑换数量">
          <el-input-number 
            v-model="exchangeQuantity" 
            :min="1" 
            :max="selectedProduct.stock"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="总积分">
          <span class="points-text">{{ totalPoints }} 积分</span>
        </el-form-item>
        
        <el-divider />
        
        <el-form-item label="收货人">
          <el-input v-model="exchangeForm.recipientName" placeholder="选填" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="exchangeForm.recipientPhone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="收货地址">
          <el-input 
            v-model="exchangeForm.recipientAddress" 
            type="textarea" 
            :rows="3"
            placeholder="选填，可线下联系运营方"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="exchangeForm.remark" 
            type="textarea" 
            :rows="2"
            placeholder="选填"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="exchangeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExchange" :loading="exchanging">
          确认兑换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture, Coin } from '@element-plus/icons-vue'
import { getTenantProducts, createOrder } from '@/api'
import { useTenantStore } from '@/store/tenant'

const route = useRoute()
const tenantStore = useTenantStore()

const tenantId = ref(route.params.tenantId)
const tenantName = ref('')
const productList = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const exchangeVisible = ref(false)
const selectedProduct = ref(null)
const exchangeQuantity = ref(1)
const exchanging = ref(false)
const exchangeForm = reactive({
  recipientName: '',
  recipientPhone: '',
  recipientAddress: '',
  remark: ''
})

// 计算总积分
const totalPoints = computed(() => {
  if (!selectedProduct.value) return 0
  return selectedProduct.value.pointsCost * exchangeQuantity.value
})

// 加载商品列表
const fetchData = async () => {
  try {
    const res = await getTenantProducts(tenantId.value, {
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    
    if (res.code === 200) {
      productList.value = res.data.list
      pagination.total = res.data.total
      
      // 获取租户名称
      if (productList.value.length > 0) {
        tenantName.value = productList.value[0].tenant?.name || '未知运营方'
      }
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  }
}

// 兑换商品
const handleExchange = (product) => {
  selectedProduct.value = product
  exchangeQuantity.value = 1
  exchangeForm.recipientName = ''
  exchangeForm.recipientPhone = ''
  exchangeForm.recipientAddress = ''
  exchangeForm.remark = ''
  exchangeVisible.value = true
}

// 确认兑换
const confirmExchange = async () => {
  if (!selectedProduct.value) return
  
  exchanging.value = true
  try {
    await createOrder({
      productId: selectedProduct.value.id,
      quantity: exchangeQuantity.value,
      recipientName: exchangeForm.recipientName || null,
      recipientPhone: exchangeForm.recipientPhone || null,
      recipientAddress: exchangeForm.recipientAddress || null,
      remark: exchangeForm.remark || null
    })
    
    ElMessage.success('兑换成功！')
    exchangeVisible.value = false
    
    // 刷新商品列表（更新库存）
    fetchData()
  } catch (error) {
    console.error('兑换失败:', error)
    ElMessage.error(error.response?.data?.message || '兑换失败')
  } finally {
    exchanging.value = false
  }
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
.products-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-card {
  margin-bottom: 20px;
  min-height: 380px;
}

.image-placeholder {
  width: 100%;
  height: 200px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  border-radius: 4px;
}

.product-name {
  margin: 15px 0 10px 0;
  font-size: 16px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  color: #909399;
  font-size: 13px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-info {
  margin-top: 15px;
}

.points {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f56c6c;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stock {
  color: #909399;
  font-size: 13px;
}

.points-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}
</style>
