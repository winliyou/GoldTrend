# 新闻分析器

一个集成了前端和代理服务器的新闻分析工具，可以抓取时政和金融新闻，并使用DeepSeek API进行分析，预测金价走势。

## 项目结构

```
news_analyzer/
├── config.js           # 后端配置文件
├── package.json        # 根项目依赖和脚本
├── frontend/           # 前端Vue项目
│   ├── public/         
│   │   └── config.js   # 前端配置文件
│   ├── src/            # 前端源代码
│   └── package.json    # 前端依赖
└── proxyserver/        # 代理服务器
    ├── server.js       # 服务器代码
    └── package.json    # 服务器依赖
```

## 功能特点

- 抓取多个来源的时政新闻和金融新闻
- 自动获取新闻内容
- 使用DeepSeek API分析新闻内容
- 预测金价走势
- 一键启动前端和后端服务

## 安装

1. 安装根项目依赖：

```bash
pnpm install
```

2. 安装所有子项目依赖：

```bash
pnpm run install:all
```

## 配置

项目有两个配置文件：

1. 根目录的`config.js`：后端配置，包括：
   - 代理服务器端口
   - 超时设置
   - 新闻获取配置

2. 前端的`frontend/public/config.js`：前端配置，包括：
   - API基础URL
   - UI配置
   - 默认API密钥

## 运行

启动整个项目（前端和代理服务器）：

```bash
pnpm run dev
```

或者分别启动：

1. 启动代理服务器：

```bash
cd proxyserver && pnpm run dev
```

2. 启动前端：

```bash
cd frontend && pnpm run dev
```

## 使用方法

1. 打开浏览器访问：`http://localhost:5173`
2. 在页面上方设置DeepSeek API密钥（可选，使用"demo"可以查看模拟数据）
3. 点击"刷新"按钮获取最新新闻
4. 选择感兴趣的新闻
5. 点击"分析"按钮进行分析

## 注意事项

- 代理服务器需要能够访问互联网以抓取新闻
- 真实的分析功能需要有效的DeepSeek API密钥
- 配置文件中的`fetchContentWithList`设置为`true`时，会在获取新闻列表的同时获取内容，这可能会增加响应时间 