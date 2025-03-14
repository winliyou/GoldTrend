<script setup>
import Home from './views/Home.vue'
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="app-title">新闻分析与金价预测系统</h1>
      </div>
    </el-header>
    <el-main class="app-main">
      <Home />
    </el-main>
    <el-footer class="app-footer">
      <p>© 2025 新闻分析与金价预测系统 - 基于DeepSeek API</p>
    </el-footer>
  </el-container>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}

.app-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #409eff, #007bff);
  color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.app-footer {
  background-color: #f5f7fa;
  color: #909399;
  text-align: center;
  font-size: 0.8rem;
  padding: 15px 0;
  border-top: 1px solid #e4e7ed;
  height: auto;
}

.el-main {
  padding: 0;
  overflow-x: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 10px;
  }
  
  .app-title {
    font-size: 1.2rem;
  }
  
  .app-main {
    padding: 10px;
  }
}
</style>
