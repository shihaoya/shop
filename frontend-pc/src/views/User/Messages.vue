<template>
  <div class="message-center page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息中心</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleMarkAllRead">
              全部标记已读
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="消息类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="系统消息" value="system" />
            <el-option label="订单消息" value="order" />
            <el-option label="积分消息" value="point" />
            <el-option label="审核消息" value="audit" />
            <el-option label="公告" value="announcement" />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读状态">
          <el-select v-model="searchForm.isRead" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 消息列表 -->
      <el-table 
        :data="messageList" 
        v-loading="loading"
        border
        stripe
        @row-click="handleRowClick"
        style="cursor: pointer"
      >
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-badge is-dot :hidden="row.isRead === 1">
              <el-icon :color="row.isRead === 1 ? '#909399' : '#409eff'" size="18">
                <CircleCheck v-if="row.isRead === 1" />
                <Bell v-else />
              </el-icon>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMessageTypeColor(row.type)" size="small">
              {{ getMessageTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <span :style="{ fontWeight: row.isRead === 0 ? 'bold' : 'normal' }">
              {{ row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.content }}
          </template>
        </el-table-column>
        <el-table-column label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.isRead === 0"
              type="primary" 
              size="small"
              link
              @click.stop="handleMarkRead(row)"
            >
              标记已读
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              link
              @click.stop="handleDelete(row)"
            >
              删除
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

    <!-- 消息详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="消息详情" width="600px" :close-on-click-modal="true" :close-on-press-escape="false">
      <el-descriptions :column="1" border v-if="currentMessage">
        <el-descriptions-item label="消息类型">
          <el-tag :type="getMessageTypeColor(currentMessage.type)">
            {{ getMessageTypeName(currentMessage.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标题">{{ currentMessage.title }}</el-descriptions-item>
        <el-descriptions-item label="内容">
          <div style="white-space: pre-wrap">{{ currentMessage.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="发送时间">
          {{ formatTime(currentMessage.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="阅读状态">
          <el-tag :type="currentMessage.isRead === 1 ? 'success' : 'warning'">
            {{ currentMessage.isRead === 1 ? '已读' : '未读' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useMessageStore } from '@/store/message'

const messageStore = useMessageStore()

const loading = ref(false)
const messageList = ref([])
const detailDialogVisible = ref(false)
const currentMessage = ref(null)

const searchForm = reactive({
  type: '',
  isRead: undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取消息列表
const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.type) {
      params.type = searchForm.type
    }
    
    if (searchForm.isRead !== undefined && searchForm.isRead !== null) {
      params.isRead = searchForm.isRead
    }

    const res = await request.get('/messages', { params })
    
    if (res.code === 200) {
      messageList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchMessages()
}

// 重置
const handleReset = () => {
  searchForm.type = ''
  searchForm.isRead = undefined
  pagination.page = 1
  fetchMessages()
}

// 标记单条已读
const handleMarkRead = async (row) => {
  try {
    const res = await request.put(`/messages/${row.id}/read`)
    if (res.code === 200) {
      ElMessage.success('标记成功')
      row.isRead = 1
      // 刷新未读数量
      messageStore.fetchUnreadCount()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 全部标记已读
const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确认将所有消息标记为已读？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const res = await request.put('/messages/mark-read')
    if (res.code === 200) {
      ElMessage.success(`成功标记${res.data.count}条消息为已读`)
      fetchMessages()
      // 刷新未读数量
      messageStore.fetchUnreadCount()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除消息
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除此消息？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await request.delete(`/messages/${row.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchMessages()
      // 刷新未读数量
      messageStore.fetchUnreadCount()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 点击行查看详情
const handleRowClick = (row) => {
  currentMessage.value = row
  detailDialogVisible.value = true
  
  // 如果未读，自动标记为已读
  if (row.isRead === 0) {
    handleMarkRead(row)
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchMessages()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchMessages()
}

// 获取消息类型名称
const getMessageTypeName = (type) => {
  const map = {
    system: '系统',
    order: '订单',
    point: '积分',
    audit: '审核',
    announcement: '公告'
  }
  return map[type] || type
}

// 获取消息类型颜色
const getMessageTypeColor = (type) => {
  const map = {
    system: 'info',
    order: 'success',
    point: 'warning',
    audit: 'danger',
    announcement: ''
  }
  return map[type] || ''
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

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.message-center {
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

:deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}
</style>
