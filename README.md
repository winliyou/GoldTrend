# 金价趋势分析系统

一个集成了前端和代理服务器的新闻分析工具，可以抓取时政和金融新闻，并使用DeepSeek API进行分析，预测金价走势。

## 项目结构

```
GoldTrend/
├── .env               # 环境变量配置文件
├── package.json       # 项目依赖和脚本
├── src/               # 前端Vue项目源代码
│   ├── api/           # API调用相关代码
│   ├── assets/        # 静态资源
│   ├── store/         # 状态管理
│   ├── types/         # 类型定义
│   ├── utils/         # 工具函数
│   ├── views/         # 视图组件
│   ├── App.vue        # 主应用组件
│   ├── config.ts      # 前端配置
│   └── main.ts        # 应用入口
└── proxy_server/      # 代理服务器
    └── src/           # 服务器源代码
        ├── server.ts  # 服务器主代码
        ├── config.ts  # 服务器配置
        └── types.ts   # 类型定义
```

## 功能特点

- 抓取多个来源的时政新闻和金融新闻
- 自动获取新闻内容
- 支持自定义新闻源和手动添加新闻内容
- 使用DeepSeek API分析新闻内容
- 自定义分析目标和设置
- 预测金价走势
- 一键启动前端和后端服务

## 安装

安装项目依赖：

```bash
pnpm install
```

或者使用yarn/pnpm：

```bash
yarn install
# 或
pnpm install
```

## 配置

项目使用环境变量进行配置，主要配置文件为根目录的`.env`：

```
# 代理服务器配置
VITE_PROXY_SERVER_PORT=9999                  # 代理服务器端口
VITE_PROXY_SERVER_API_PATH=/api              # API路径前缀
VITE_PROXY_SERVER_API_TIMEOUT=15000          # API超时时间(毫秒)

# 新闻抓取配置
VITE_PROXY_SERVER_MAX_NEWS_PER_SOURCE=5      # 每个来源最多抓取的新闻数量
VITE_PROXY_SERVER_MAX_TOTAL_NEWS=10          # 总共返回的新闻最大数量
VITE_PROXY_SERVER_FETCH_CONTENT_WITH_LIST=true  # 是否在获取列表时同时获取内容

# 前端配置
VITE_FRONTEND_PORT=5173                      # 前端服务端口

# API配置
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions  # DeepSeek API地址
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key  # DeepSeek API密钥
```

## 运行

启动开发服务器：

```bash
pnpm run dev #启动前端页面服务器
pnpm run start-server #启动代理服务器从信息源获取新闻
```

这将同时启动前端服务器和代理服务器。

## 使用方法

1. 打开浏览器访问：`http://localhost:5173`
2. 在页面上方设置DeepSeek API密钥（如果未在.env文件中设置）
3. 点击"刷新"按钮获取最新新闻
4. 选择感兴趣的新闻
5. 点击"分析设置"按钮自定义分析目标和参数（可选）
6. 点击"分析"按钮进行分析
7. 查看分析结果和预测

### 自定义新闻源

您可以通过以下方式添加自定义新闻：

1. 点击"添加"按钮
2. 在弹出的对话框中输入新闻标题、来源和内容
3. 点击"添加"按钮将新闻添加到列表中
4. 添加的自定义新闻将显示在相应的新闻列表中，可以像其他新闻一样选择和分析

### 导入新闻内容

您还可以通过以下方式导入新闻内容：

1. 点击"导入新闻"按钮
2. 在弹出的对话框中，您可以：
   - 粘贴新闻URL，系统将尝试抓取内容
   - 直接粘贴新闻内容
   - 上传包含新闻内容的文本文件
3. 设置新闻标题和类型
4. 点击"导入"按钮将新闻添加到列表中

### 自定义分析设置

您可以通过以下方式自定义分析设置：

1. 选择要分析的新闻后，点击"分析设置"按钮
2. 在弹出的对话框中，您可以设置：
   - 分析目标：金价走势预测、股市影响、经济政策分析、地缘政治影响或自定义目标
   - 分析重点：选择关注的因素，如经济因素、政治因素、国际关系等
   - 时间范围：短期（1-7天）、中期（1-3个月）或长期（3个月以上）
   - 分析深度：从简要到深入的五个级别
   - 附加说明：任何其他分析要求或说明
3. 点击"保存设置"按钮保存您的设置
4. 点击"分析"按钮时，系统将根据您的设置进行分析

## 注意事项

- 代理服务器需要能够访问互联网以抓取新闻
- 真实的分析功能需要有效的DeepSeek API密钥
- 环境变量`VITE_PROXY_SERVER_FETCH_CONTENT_WITH_LIST`设置为`true`时，会在获取新闻列表的同时获取内容，这可能会增加响应时间
- 自定义新闻和导入的新闻仅在当前会话中有效，刷新页面后将丢失
- 分析设置会影响分析结果的内容和深度，请根据您的需求进行调整 