<template>
  <div class="product-manage page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="searchForm.category" placeholder="请输入分类" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="商品名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div style="margin-bottom: 20px;">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
      </div>

      <!-- 商品列表 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.imageUrl" 
              :src="getImageUrl(row.imageUrl)" 
              style="width: 60px; height: 60px"
              fit="cover"
              :preview-src-list="[getImageUrl(row.imageUrl)]"
              preview-teleported
            />
            <span v-else class="no-image">暂无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="pointsRequired" label="所需积分" width="120" />
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'on_shelf' ? 'success' : 'info'">
              {{ row.status === 'on_shelf' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              link 
              :type="row.status === 'on_shelf' ? 'warning' : 'success'" 
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'on_shelf' ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="true"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="product-form"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="category">
          <el-input v-model="formData.category" placeholder="请输入分类" />
        </el-form-item>
        <el-form-item label="所需积分" prop="pointsRequired">
          <el-input-number v-model="formData.pointsRequired" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="formData.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="商品图片">
          <div class="upload-wrapper">
            <div class="product-image-uploader avatar-uploader">
              <el-upload
                name="image"
                action="/api/v1/operator/products/upload"
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
                :headers="uploadHeaders"
              >
                <img v-if="formData.imageUrl" :src="getImageUrl(formData.imageUrl)" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </div>
            <div class="upload-tip">支持 jpg、png 格式，大小不超过 5MB</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProducts, createProduct, updateProduct, updateProductStatus, deleteProduct } from '@/api'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const formRef = ref(null)

const searchForm = reactive({
  status: '',
  category: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])

const formData = reactive({
  id: null,
  name: '',
  category: '',
  pointsRequired: 0,
  stock: 0,
  description: '',
  imageFileId: null // 图片文件ID
})

const formRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  pointsRequired: [{ required: true, message: '请输入所需积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getProducts(params)
    if (res.code === 200) {
      tableData.value = res.data.list
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
  searchForm.status = ''
  searchForm.category = ''
  searchForm.keyword = ''
  handleSearch()
}

// 分页大小变化
const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

// 新增
const handleCreate = () => {
  dialogTitle.value = '新增商品'
  Object.assign(formData, {
    id: null,
    name: '',
    category: '',
    pointsRequired: 0,
    stock: 0,
    description: '',
    imageFileId: null,
    imageUrl: '' // 清空图片URL
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑商品'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    category: row.category || '',
    pointsRequired: row.pointsRequired,
    stock: row.stock,
    description: row.description || '',
    imageFileId: row.imageFileId || null,
    imageUrl: row.imageUrl || '' // 用于显示图片
  })
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const data = { ...formData }
      // 删除 imageUrl 字段，只提交 imageFileId
      delete data.imageUrl
      
      if (formData.id) {
        await updateProduct(formData.id, data)
        ElMessage.success('更新成功')
      } else {
        await createProduct(data)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch (error) {
      // 响应拦截器已统一处理错误提示
    } finally {
      submitLoading.value = false
    }
  })
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  // 清空图片相关数据
  formData.imageFileId = null
  formData.imageUrl = ''
}

// 切换上下架状态
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'on_shelf' ? 'off_shelf' : 'on_shelf'
  const action = newStatus === 'on_shelf' ? '上架' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await updateProductStatus(row.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchData()
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    // 响应拦截器已统一处理错误提示
  }
}

// 格式化时间
const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 上传请求头（携带Token）
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 图片上传前验证
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 图片上传成功
const handleImageSuccess = (response) => {
  if (response.code === 200) {
    // 保存文件ID和图片URL
    formData.imageFileId = response.data.id
    formData.imageUrl = response.data.url
    nextTick(() => {
      console.log('图片文件ID已设置:', formData.imageFileId)
    })
    ElMessage.success('图片上传成功')
  } else {
    // 响应拦截器已统一处理错误提示
  }
}

// 获取完整的图片URL
const getImageUrl = (url) => {
  if (!url) return ''
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 否则拼接后端地址
  return `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${url}`
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.product-manage {
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

/* 搜索表单中的选择框圆角 */
.search-form :deep(.el-select .el-input__wrapper),
.search-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

/* 商品表单垂直布局（仅针对弹框中的表单） */
.product-form :deep(.el-form-item__content) {
  flex-direction: column;
  align-items: flex-start;
}

/* 图片上传样式 */
.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.product-image-uploader {
  display: inline-block;
}

:deep(.product-image-uploader .el-upload) {
  width: 120px !important;
  height: 120px !important;
  border: 2px dashed #e4e7ed !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  position: relative !important;
  overflow: hidden !important;
  transition: all 0.3s ease !important;
  background-color: #fafafa !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.product-image-uploader .el-upload:hover) {
  border-color: #409eff !important;
  background-color: #f5f7fa !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
}

.avatar-uploader-icon {
  font-size: 24px !important;
  color: #c0c4cc !important;
  transition: all 0.3s ease !important;
}

:deep(.product-image-uploader .el-upload:hover .avatar-uploader-icon) {
  color: #409eff !important;
  transform: scale(1.1) !important;
}

.avatar {
  width: 120px !important;
  height: 120px !important;
  display: block !important;
  object-fit: cover !important;
  border-radius: 8px !important;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  text-align: left;
}
</style>
