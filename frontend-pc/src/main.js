import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import router from './router'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { 
  locale: zhCn,
  // 全局配置：禁止 ESC 和点击遮罩关闭弹框
  ElMessageBox: {
    closeOnClickModal: false,
    closeOnPressEscape: false
  },
  ElDialog: {
    closeOnClickModal: false,
    closeOnPressEscape: false
  },
  ElDrawer: {
    closeOnClickModal: false,
    closeOnPressEscape: false
  }
})
app.mount('#app')
