import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTenantStore = defineStore('tenant', () => {
  // 当前选中的运营方 ID
  const currentTenantId = ref(parseInt(localStorage.getItem('currentTenantId')) || null)
  
  // 当前选中的运营方信息
  const currentTenantInfo = ref(JSON.parse(localStorage.getItem('currentTenantInfo') || 'null'))
  
  // 当前运营方名称
  const currentTenantName = computed(() => currentTenantInfo.value?.name || '')
  
  // 是否已选择运营方
  const hasSelectedTenant = computed(() => !!currentTenantId.value)
  
  /**
   * 设置当前运营方
   */
  const setCurrentTenant = (tenantId, tenantInfo) => {
    currentTenantId.value = tenantId
    currentTenantInfo.value = tenantInfo
    
    // 持久化到 localStorage
    localStorage.setItem('currentTenantId', tenantId)
    if (tenantInfo) {
      localStorage.setItem('currentTenantInfo', JSON.stringify(tenantInfo))
    }
  }
  
  /**
   * 清空当前运营方
   */
  const clearCurrentTenant = () => {
    currentTenantId.value = null
    currentTenantInfo.value = null
    localStorage.removeItem('currentTenantId')
    localStorage.removeItem('currentTenantInfo')
  }
  
  return {
    currentTenantId,
    currentTenantInfo,
    currentTenantName,
    hasSelectedTenant,
    setCurrentTenant,
    clearCurrentTenant
  }
})
