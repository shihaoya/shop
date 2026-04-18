<template>
  <div class="orders-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的订单</span>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :inline="true" class="search-form" style="margin-bottom: 20px;">
        <el-form-item label="订单状态">
          <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleFilterChange" style="width: 150px">
            <el-option label="待处理" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="orderList" stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column label="运营方" width="150">
          <template #default="{ row }">
            {{ row.tenant?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <el-image 
                v-if="row.product?.image" 
                :src="row.product.image" 
                fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px; margin-right: 10px"
              />
              <div>
                <div>{{ row.productName }}</div>
                <div class="text-secondary">{{ row.quantity }} x {{ row.pointsCost }} 积分</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总积分" width="120">
          <template #default="{ row }">
            <span class="points-text">{{ row.totalPoints }} 积分</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row.id)">
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              link
              type="danger" 
              size="small" 
              @click="handleCancel(row.id)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-descriptions v-if="orderDetail" :column="1" border>
        <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="运营方">{{ orderDetail.tenant?.name }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ orderDetail.productName }}</el-descriptions-item>
        <el-descriptions-item label="兑换数量">{{ orderDetail.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ orderDetail.pointsCost }} 积分</el-descriptions-item>
        <el-descriptions-item label="总积分">
          <span class="points-text">{{ orderDetail.totalPoints }} 积分</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTagType(orderDetail.status)">
            {{ getStatusText(orderDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收货人" v-if="orderDetail.recipientName">
          {{ orderDetail.recipientName }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话" v-if="orderDetail.recipientPhone">
          {{ orderDetail.recipientPhone }}
        </el-descriptions-item>
        <el-descriptions-item label="收货地址" v-if="orderDetail.recipientAddress">
          {{ orderDetail.recipientAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" v-if="orderDetail.remark">
          {{ orderDetail.remark }}
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatTime(orderDetail.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyOrders, getOrderDetail, cancelOrder } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const orderList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref('')

const detailVisible = ref(false)
const orderDetail = ref(null)

// 加载订单列表
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await getMyOrders(params)
    orderList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  } finally {
    loading.value = false
  }
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  loadData()
}

// 页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

// 查看详情
const handleViewDetail = async (id) => {
  try {
    const res = await getOrderDetail(id)
    orderDetail.value = res.data
    detailVisible.value = true
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 取消订单
const handleCancel = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？取消后积分将退还', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelOrder(id)
    ElMessage.success('订单已取消')
    loadData()
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 格式化时间
const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || ''
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.orders-container {
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

.product-info {
  display: flex;
  align-items: center;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.points-text {
  color: #f56c6c;
  font-weight: 600;
}
</style>
