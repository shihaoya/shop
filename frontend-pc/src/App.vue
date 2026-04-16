<template>
  <router-view />
</template>

<script setup>
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 响应式容器 */
.container-fluid {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 32px;
}

@media (min-width: 2560px) {
  .container-fluid {
    max-width: 2400px;
    padding: 0 48px;
  }
}

@media (max-width: 768px) {
  .container-fluid {
    padding: 0 16px;
  }
}
</style>
