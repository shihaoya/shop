<template>
  <div class="audit-status">
    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span>审核状态</span>
        </div>
      </template>

      <div v-loading="loading" class="status-content">
        <template v-if="tenant">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="租户名称">
              {{ tenant.name }}
            </el-descriptions-item>
            <el-descriptions-item label="申请描述">
              {{ tenant.description || '暂无描述' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusType" size="large">
                {{ statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="拒绝原因" v-if="tenant.status === 'rejected'">
              <el-alert
                type="error"
                :closable="false"
                show-icon
              >
                {{ tenant.rejectReason || '无具体原因' }}
              </el-alert>
            </el-descriptions-item>
            <el-descriptions-item label="申请时间">
              {{ formatDate(tenant.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDate(tenant.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 重新提交按钮 -->
          <div v-if="tenant.status === 'rejected'" class="action-bar">
            <el-button type="primary" size="large" @click="showResubmitDialog = true">
              <el-icon><Refresh /></el-icon>
              重新提交审核
            </el-button>
          </div>
        </template>

        <el-empty v-else description="暂无租户信息" />
      </div>
    </el-card>

    <!-- 重新提交审核对话框 -->
    <el-dialog
      v-model="showResubmitDialog"
      title="重新提交审核"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="resubmitFormRef"
        :model="resubmitForm"
        :rules="resubmitRules"
        label-width="100px"
      >
        <el-form-item label="租户名称" prop="name">
          <el-input
            v-model="resubmitForm.name"
            placeholder="请输入租户名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="申请描述" prop="description">
          <el-input
            v-model="resubmitForm.description"
            type="textarea"
            :rows="5"
            placeholder="请详细说明您的运营计划"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResubmitDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleResubmit">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyTenantStatus, resubmitAudit } from '@/api/index'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const tenant = ref(null)
const showResubmitDialog = ref(false)

const resubmitFormRef = ref(null)
const resubmitForm = ref({
  name: '',
  description: ''
})

const resubmitRules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入申请描述', trigger: 'blur' }
  ]
}

// 状态类型
const statusType = computed(() => {
  if (!tenant.value) return 'info'
  const statusMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    disabled: 'info'
  }
  return statusMap[tenant.value.status] || 'info'
})

// 状态文本
const statusText = computed(() => {
  if (!tenant.value) return ''
  const textMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    disabled: '已禁用'
  }
  return textMap[tenant.value.status] || tenant.value.status
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadTenantStatus = async () => {
  loading.value = true
  try {
    const res = await getMyTenantStatus()
    tenant.value = res.data
  } catch (error) {
    console.error('加载租户状态失败:', error)
    ElMessage.error('加载租户状态失败')
  } finally {
    loading.value = false
  }
}

const handleResubmit = async () => {
  if (!resubmitFormRef.value) return
  
  await resubmitFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await resubmitAudit(resubmitForm.value)
        ElMessage.success('重新提交成功，请等待审核')
        showResubmitDialog.value = false
        // 重新加载状态
        await loadTenantStatus()
      } catch (error) {
        console.error('重新提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadTenantStatus()
})
</script>

<style scoped>
.audit-status {
  max-width: 800px;
}

.status-card {
  border-radius: 12px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.status-content {
  min-height: 300px;
}

.action-bar {
  margin-top: 24px;
  text-align: center;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  width: 120px;
}
</style>
