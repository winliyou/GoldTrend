import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import config from './config.js';
import { NewsSourceSelector, NewsItem } from './types.js';

const app = express();
const PORT = config.port || 6000;

// 配置CORS选项
const corsOptions = {
  origin: '*',  // 允许任何来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};

// 启用CORS
app.use(cors(corsOptions));

// 添加预检请求处理
app.options('*', cors(corsOptions));

// 添加一个简单的健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '代理服务器正常运行' });
});

// 设置axios默认配置
axios.defaults.timeout = config.timeout || 15000;
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// 时政新闻来源列表
const politicalNewsSources: NewsSourceSelector[] = [
  {
    name: '新华网国内',
    url: 'http://www.news.cn/domestic/',
    selectors: [
      '.dataList ul li',
      '.news-item',
      '.headnews',
      '.partL_01 ul li',
      '.partR_01 ul li',
      '.partR_02 ul li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.news.cn'
  },
  {
    name: '人民网国内',
    url: 'http://politics.people.com.cn/GB/1024/index.html',
    selectors: [
      '.p2_left li',
      '.headnews',
      '.list_16 li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://politics.people.com.cn'
  },
  {
    name: '中国政府网',
    url: 'http://www.gov.cn/xinwen/index.htm',
    selectors: [
      '.news_box li',
      '.list li',
      '.listBox li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.gov.cn'
  },
  {
    name: '央视网新闻',
    url: 'https://news.cctv.com/china/',
    selectors: [
      '.con li',
      '.image li',
      '.text li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: ''
  }
];

// 金融新闻来源列表
const financialNewsSources: NewsSourceSelector[] = [
  {
    name: '东方财富网',
    url: 'https://finance.eastmoney.com/',
    selectors: [
      '.news-list li',
      '.news_item',
      '.news-hot li',
      '.news_list li',
      '.content-list li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'https://finance.eastmoney.com'
  },
  {
    name: '中国证券网',
    url: 'https://www.cnstock.com/',
    selectors: [
      '.new-list li',
      '.hotNews-list li',
      '.content-list li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'https://www.cnstock.com'
  },
  {
    name: '金融时报中文网',
    url: 'http://www.ftchinese.com/',
    selectors: [
      '.item-container',
      '.news-item',
      '.list-item'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.ftchinese.com'
  },
  {
    name: '第一财经',
    url: 'https://www.yicai.com/',
    selectors: [
      '.m-list li',
      '.news-list li',
      '.hot-news li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'https://www.yicai.com'
  }
];

// 获取新闻内容
async function fetchNewsContent(url: string): Promise<string> {
  try {
    console.log(`开始获取新闻内容: ${url}`);

    const response = await axios.get(url);
    console.log('成功获取新闻页面');

    const $ = cheerio.load(response.data);

    // 尝试提取新闻内容，不同网站的结构可能不同
    let content = '';

    // 尝试更多可能的容器
    const possibleContainers = [
      '.article-content', '.article', '.content', '#article_content',
      '.news-content', '.detail-content', '.main-content', '.article-body',
      '.article_content', '.text', '.detail', '.art_content', '.artical-content',
      '#Content', '.contentMain', '.article-text', '.article-main', '#p-detail',
      '.TRS_Editor', '.text_con', '.text_show', '.text-content', '.article-con',
      '.article-text', '.article_body', '.article-box', '.art_content', '.text_c',
      '.content-article', '.main-text', '.text-box', '.content_area', '.con_txt'
    ];

    for (const container of possibleContainers) {
      const $container = $(container);
      if ($container.length > 0) {
        // 移除不需要的元素
        $container.find('script, style, iframe, .share, .ad, .relate, .recommend, .footer, .toolbar, .tool-bar, .copyright').remove();
        content = $container.text().trim();
        break;
      }
    }

    // 如果没有找到内容，尝试获取所有段落
    if (!content) {
      content = $('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
    }

    // 如果仍然没有内容，尝试获取整个body的文本
    if (!content) {
      content = $('body').text().trim();

      // 简单清理一下内容
      content = content.replace(/\s+/g, ' ').substring(0, 5000);
    }

    console.log(`成功获取新闻内容，长度: ${content.length}`);
    return content;
  } catch (error) {
    console.error('获取新闻内容失败:', error);
    return '获取内容失败';
  }
}

// 从多个来源抓取新闻
async function fetchNewsFromMultipleSources(sources: NewsSourceSelector[], type: 'political' | 'financial'): Promise<NewsItem[]> {
  let allNews: NewsItem[] = [];
  let newsId = 0;

  for (const source of sources) {
    try {
      console.log(`尝试从 ${source.name} 抓取新闻...`);
      const response = await axios.get(source.url);
      const $ = cheerio.load(response.data);

      for (const selector of source.selectors) {
        console.log(`尝试选择器: ${selector}`);
        $(selector).each((index, element) => {
          const $element = $(element);
          let title = $element.find(source.titleSelector).text().trim();
          let url = $element.find(source.urlSelector).attr('href') || '';
          let time = $element.find(source.timeSelector).text().trim() || new Date().toLocaleString();

          // 如果没有找到标题，尝试其他方式
          if (!title) {
            title = $element.text().trim();
          }

          if (title && url) {
            // 确保URL是完整的
            if (!url.startsWith('http')) {
              url = url.startsWith('/')
                ? `${source.baseUrl}${url}`
                : `${source.baseUrl}/${url}`;
            }

            // 避免重复新闻
            if (!allNews.some(news => news.title === title)) {
              allNews.push({
                id: newsId++,
                title,
                url,
                time,
                source: source.name,
                type,
                content: '' // 内容将在后面获取
              });
            }
          }
        });

        // 如果找到了足够的新闻，就停止尝试其他选择器
        if (allNews.length >= config.newsSources.maxNewsPerSource) {
          break;
        }
      }

      // 如果从这个来源获取到了足够的新闻，就不再尝试其他来源
      if (allNews.length >= config.newsSources.maxTotalNews) {
        console.log(`已从 ${source.name} 获取足够的新闻，停止尝试其他来源`);
        break;
      }
    } catch (error) {
      console.error(`从 ${source.name} 抓取新闻失败:`, error instanceof Error ? error.message : String(error));
      // 继续尝试下一个来源
    }
  }

  // 如果配置了获取内容，则同时获取新闻内容
  if (config.newsSources.fetchContentWithList && allNews.length > 0) {
    console.log('开始获取新闻内容...');

    // 使用Promise.all并行获取所有新闻内容
    const contentPromises = allNews.map(async (news) => {
      try {
        news.content = await fetchNewsContent(news.url);
        return news;
      } catch (error) {
        console.error(`获取新闻 "${news.title}" 的内容失败:`, error);
        news.content = '获取内容失败';
        return news;
      }
    });

    allNews = await Promise.all(contentPromises);
    console.log('所有新闻内容获取完成');
  }

  return allNews;
}

// 创建路由器
const router = express.Router();

// 代理时政新闻请求
router.get('/political', async (req, res) => {
  try {
    console.log('开始抓取时政新闻...');

    const newsList = await fetchNewsFromMultipleSources(politicalNewsSources, 'political');

    if (newsList.length > 0) {
      console.log(`成功获取 ${newsList.length} 条时政新闻`);
      res.json(newsList);
    } else {
      console.error('无法从任何来源获取时政新闻');
      res.status(500).json({ error: '无法获取时政新闻，请稍后再试' });
    }
  } catch (error) {
    console.error('抓取时政新闻失败:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: '抓取时政新闻失败', message: error instanceof Error ? error.message : String(error) });
  }
});

// 代理金融新闻请求
router.get('/financial', async (req, res) => {
  try {
    console.log('开始抓取金融新闻...');

    const newsList = await fetchNewsFromMultipleSources(financialNewsSources, 'financial');

    if (newsList.length > 0) {
      console.log(`成功获取 ${newsList.length} 条金融新闻`);
      res.json(newsList);
    } else {
      console.error('无法从任何来源获取金融新闻');
      res.status(500).json({ error: '无法获取金融新闻，请稍后再试' });
    }
  } catch (error) {
    console.error('抓取金融新闻失败:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: '抓取金融新闻失败', message: error instanceof Error ? error.message : String(error) });
  }
});


// 注册路由
app.use(config.apiPath, router);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
  console.log(`API路径: ${config.baseUrl}${config.apiPath}`);
});

// 处理进程退出信号
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 优雅关闭函数
function gracefulShutdown() {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
  
  // 如果10秒内无法关闭，则强制退出
  setTimeout(() => {
    console.error('无法优雅关闭，强制退出');
    process.exit(1);
  }, 10000);
} 