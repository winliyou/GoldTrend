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
    <el-main>
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
}

#app {
  height: 100vh;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.app-footer {
  background-color: #f5f7fa;
  color: #909399;
  text-align: center;
  font-size: 0.8rem;
  padding: 15px 0;
  border-top: 1px solid #e4e7ed;
}

.el-main {
  padding: 0;
  overflow-x: hidden;
}
</style>
