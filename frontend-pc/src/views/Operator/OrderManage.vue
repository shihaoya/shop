<template>
  <div class="order-manage page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待处理" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出订单</el-button>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table :data="orderList" v-loading="loading" border stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div>{{ row.user?.nickname || row.user?.username }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.productName }}</div>
            <div style="color: #909399; font-size: 12px">
              {{ row.pointsCost }} 积分 × {{ row.quantity }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总积分" width="120" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold">{{ row.totalPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="200">
          <template #default="{ row }">
            <div v-if="row.recipientName">
              <div>{{ row.recipientName }} {{ row.recipientPhone }}</div>
              <div style="color: #909399; font-size: 12px">{{ row.recipientAddress }}</div>
            </div>
            <span v-else style="color: #909399">未填写</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'"
              link
              type="success" 
              size="small"
              @click="handleComplete(row)"
            >
              完成
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              link
              type="danger" 
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button 
              link
              type="primary" 
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="600px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.user?.nickname || currentOrder.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ currentOrder.productName }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ currentOrder.pointsCost }} 积分</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentOrder.quantity }}</el-descriptions-item>
        <el-descriptions-item label="总积分" :span="2">
          <span style="color: #f56c6c; font-weight: bold">{{ currentOrder.totalPoints }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="收货人">{{ currentOrder.recipientName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.recipientPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.recipientAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ formatTime(currentOrder.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { exportOrders } from '@/api'

const loading = ref(false)
const orderList = ref([])
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const res = await request.get('/operator/orders', { params })
    
    if (res.code === 200) {
      orderList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

// 重置
const handleReset = () => {
  searchForm.status = ''
  pagination.page = 1
  fetchOrders()
}

// 导出订单
const handleExport = async () => {
  try {
    const params = {}
    
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const res = await exportOrders(params)
    
    // 创建 Blob 对象
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    const date = new Date().toISOString().slice(0, 10)
    link.download = `订单导出_${date}.csv`
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('订单导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await request.get(`/orders/${row.id}`)
    if (res.code === 200) {
      currentOrder.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 完成订单
const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm('确认将此订单标记为已完成？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await request.put(`/operator/orders/${row.id}/status`, {
      status: 'completed'
    })

    if (res.code === 200) {
      ElMessage.success('订单已完成')
      fetchOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 取消订单
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确认取消此订单？取消后积分将退还给用户。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await request.put(`/operator/orders/${row.id}/status`, {
      status: 'cancelled'
    })

    if (res.code === 200) {
      ElMessage.success('订单已取消')
      fetchOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || ''
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

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchOrders()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-manage {
  /* 响应式由 .page-container 处理 */
}

.card-header {
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
