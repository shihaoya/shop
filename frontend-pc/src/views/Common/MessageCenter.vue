<template>
  <div class="message-center page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息中心</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleMarkAllRead" :disabled="unreadCount === 0">
              全部标记为已读
            </el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选器 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="消息类型">
          <el-select v-model="filterType" placeholder="全部类型" clearable @change="handleFilterChange">
            <el-option label="系统消息" value="system" />
            <el-option label="订单消息" value="order" />
            <el-option label="积分消息" value="point" />
            <el-option label="审核消息" value="audit" />
            <el-option label="公告" value="announcement" />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读状态">
          <el-select v-model="filterIsRead" placeholder="全部状态" clearable @change="handleFilterChange">
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="keyword" 
            placeholder="搜索标题或内容" 
            clearable
            style="width: 200px"
            @clear="handleFilterChange"
            @keyup.enter="handleFilterChange"
          >
            <template #append>
              <el-button @click="handleFilterChange">搜索</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 消息列表 -->
      <el-table 
        :data="messageList" 
        v-loading="loading"
        @row-click="handleRowClick"
        style="cursor: pointer"
      >
        <el-table-column type="index" label="#" width="60" />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <el-badge is-dot :hidden="row.isRead === 1" class="badge">
                <span>{{ row.title }}</span>
              </el-badge>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="handleViewDetail(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 消息详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="消息详情"
      width="600px"
    >
      <div v-if="currentMessage" class="message-detail">
        <div class="detail-header">
          <h3>{{ currentMessage.title }}</h3>
          <div class="detail-meta">
            <el-tag :type="getTypeTagType(currentMessage.type)" size="small">
              {{ getTypeText(currentMessage.type) }}
            </el-tag>
            <el-tag :type="getPriorityType(currentMessage.priority)" size="small" style="margin-left: 10px">
              {{ getPriorityText(currentMessage.priority) }}
            </el-tag>
            <span class="time">{{ formatTime(currentMessage.createdAt) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-content" v-html="currentMessage.content"></div>
        <el-divider />
        <div class="detail-footer">
          <span v-if="currentMessage.senderName">发送者：{{ currentMessage.senderName }}</span>
          <span v-if="currentMessage.readAt" class="read-time">
            阅读时间：{{ formatTime(currentMessage.readAt) }}
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleMarkRead(currentMessage)" v-if="currentMessage && currentMessage.isRead === 0">
          标记为已读
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyMessages, getUnreadCount, markAsRead, markAllAsRead, getMessageDetail } from '@/api/message'
import dayjs from 'dayjs'

// 数据
const loading = ref(false)
const messageList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const unreadCount = ref(0)

// 筛选条件
const filterType = ref('')
const filterIsRead = ref('')
const keyword = ref('')

// 详情对话框
const detailDialogVisible = ref(false)
const currentMessage = ref(null)

// 获取消息列表
const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      type: filterType.value || undefined,
      isRead: filterIsRead.value !== '' ? filterIsRead.value : undefined,
      keyword: keyword.value || undefined
    }
    
    const res = await getMyMessages(params)
    if (res.code === 200) {
      messageList.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  } finally {
    loading.value = false
  }
}

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    if (res.code === 200) {
      unreadCount.value = res.data.unreadCount
    }
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

// 刷新
const handleRefresh = () => {
  fetchMessages()
  fetchUnreadCount()
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchMessages()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchMessages()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMessages()
}

// 行点击
const handleRowClick = (row) => {
  handleViewDetail(row)
}

// 查看详情
const handleViewDetail = async (row) => {
  try {
    const res = await getMessageDetail(row.id)
    if (res.code === 200) {
      currentMessage.value = res.data
      detailDialogVisible.value = true
      // 刷新列表以更新已读状态
      fetchMessages()
      fetchUnreadCount()
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 标记为已读
const handleMarkRead = async (row) => {
  try {
    const res = await markAsRead(row.id)
    if (res.code === 200) {
      ElMessage.success('标记成功')
      fetchMessages()
      fetchUnreadCount()
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 全部标记为已读
const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有消息标记为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await markAllAsRead({ type: filterType.value || undefined })
    if (res.code === 200) {
      ElMessage.success(`已标记 ${res.data.affectedCount} 条消息为已读`)
      fetchMessages()
      fetchUnreadCount()
    }
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    system: '系统消息',
    order: '订单消息',
    point: '积分消息',
    audit: '审核消息',
    announcement: '公告'
  }
  return typeMap[type] || type
}

// 获取类型标签颜色
const getTypeTagType = (type) => {
  const typeMap = {
    system: '',
    order: 'success',
    point: 'warning',
    audit: 'danger',
    announcement: 'info'
  }
  return typeMap[type] || ''
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const priorityMap = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  }
  return priorityMap[priority] || priority
}

// 获取优先级标签颜色
const getPriorityType = (priority) => {
  const priorityMap = {
    low: 'info',
    normal: '',
    high: 'warning',
    urgent: 'danger'
  }
  return priorityMap[priority] || ''
}

// 初始化
onMounted(() => {
  fetchMessages()
  fetchUnreadCount()
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

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-form {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.title-cell {
  display: flex;
  align-items: center;
}

.badge {
  width: 100%;
}

.message-detail {
  .detail-header {
    h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .time {
        color: #999;
        font-size: 14px;
      }
    }
  }

  .detail-content {
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .detail-footer {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 14px;
    
    .read-time {
      color: #67c23a;
    }
  }
}
</style>
