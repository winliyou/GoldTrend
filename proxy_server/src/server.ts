import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import config from './config.js';
import { NewsSourceSelector, NewsItem } from './types.js';
import iconv from 'iconv-lite';

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

// 设置解析JSON请求体的中间件
app.use(express.json());

// 设置axios默认配置
axios.defaults.timeout = config.timeout || 15000;

// 随机User-Agent列表
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

// 获取随机User-Agent
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 创建带有浏览器特征的请求头
function createBrowserLikeHeaders(referer = '') {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': referer || 'https://www.google.com/',
    'Accept-Charset': 'utf-8, gb2312, gbk, big5;q=0.7, *;q=0.3'
  };
}

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

// 金融新闻来源列表（优化版）
const financialNewsSources: NewsSourceSelector[] = [
  // 新增国内源
  {
    name: '和讯网',
    url: 'http://www.hexun.com/',
    selectors: [
      '.newsList li',
      '.articleList li',
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.hexun.com'
  },
  {
    name: '证券时报网',
    url: 'http://www.stcn.com/',
    selectors: [
      '.top-news-list li',
      '.cc-list li',
      '.cc-list',
      '.news-box li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.stcn.com'
  },
  {
    name: '每日经济新闻',
    url: 'http://www.nbd.com.cn/',
    selectors: [
      '#toutiao h3',
      '.news-list li',
      '.normal-list li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://www.nbd.com.cn'
  },
  {
    name: '中国经济网金融频道',
    url: 'http://finance.ce.cn/',
    selectors: [
      '.pictxt1',
      '.txt2 h4',
      '.list_1 li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'http://finance.ce.cn'
  },
  // 新增专业投资社区
  {
    name: '格隆汇',
    url: 'https://www.gelonghui.com/',
    selectors: [
      '.article-item',
      '.infinite-content li'
    ],
    titleSelector: 'a',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'https://www.gelonghui.com'
  },
  {
    name: '金十数据',
    url: 'https://www.jin10.com/',
    selectors: [
      '.vip-rank-list_main'
    ],
    titleSelector: '.title',
    urlSelector: 'a',
    timeSelector: '.time',
    baseUrl: 'https://www.jin10.com'
  }
];

// 获取新闻内容
async function fetchNewsContent(url: string): Promise<string> {
  try {
    console.log(`开始获取新闻内容: ${url}`);

    // 使用arraybuffer类型获取原始数据
    const response = await axios.get(url, {
      headers: createBrowserLikeHeaders(url),
      timeout: 30000,
      responseType: 'arraybuffer' // 修改响应类型为arraybuffer
    });

    console.log('成功获取新闻页面');

    // 检测编码类型
    const encoding = detectEncoding(response);
    console.log(`检测到编码格式: ${encoding}`);

    // 直接使用检测到的编码进行解码
    const decodedData = iconv.decode(Buffer.from(response.data), encoding);
    const $ = cheerio.load(decodedData);

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
    console.log(`原始URL: ${url}`);
    console.log(`最终使用编码: ${encoding}`);
    console.log(`解码后前50字符: ${decodedData.substring(0, 50)}`);
    return content;
  } catch (error) {
    // 简化错误处理
    let errorMessage = '获取新闻内容失败';
    if (axios.isAxiosError(error)) {
      errorMessage += error.code ? `: ${error.code}` :
        error.response ? `: ${error.response.status}` :
          ': 网络错误';
    } else {
      errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
    }
    console.error(errorMessage);
    return '获取内容失败';
  }
}

// 修改detectEncoding函数
function detectEncoding(response: AxiosResponse): string {
  try {
    // 优先从HTML meta标签获取编码
    const bufferData = Buffer.from(response.data.slice(0, 1024));
    const htmlChunk = bufferData.toString('ascii');

    const charsetMatch = htmlChunk.match(
      /<meta[^>]+charset=["']?([a-zA-Z0-9-]+)/i
    ) || htmlChunk.match(
      /<meta[^>]+content=["'][^;]+;charset=([a-zA-Z0-9-]+)/i
    );

    if (charsetMatch?.[1]) {
      return charsetMatch[1].toLowerCase();
    }

    // 其次从HTTP头获取编码
    const headerCharset = response.headers['content-type']?.match(/charset=([^;]+)/i)?.[1];
    if (headerCharset) {
      return headerCharset.toLowerCase();
    }

    return 'utf-8';
  } catch (e) {
    return 'utf-8';
  }
}

// 从多个来源抓取新闻
async function fetchNewsFromMultipleSources(
  sources: NewsSourceSelector[],
  type: 'political' | 'financial',
  res?: Response, // 可选的响应对象，用于流式传输
  onSourceComplete?: (source: string, news: NewsItem[]) => void // 可选的回调函数，当一个源的新闻获取完成时调用
): Promise<NewsItem[]> {
  let allNews: NewsItem[] = [];
  let newsId = 0;

  try {
    console.log(`开始并行抓取${type === 'political' ? '时政' : '金融'}新闻...`);

    // 创建所有来源的抓取任务
    const fetchTasks = sources.map(async (source) => {
      try {
        console.log(`尝试从 ${source.name} 抓取新闻...`);

        // 使用arraybuffer获取原始数据
        const response = await axios.get(source.url, {
          headers: createBrowserLikeHeaders(source.url),
          timeout: 30000,
          responseType: 'arraybuffer' // 添加响应类型
        });

        // 检测编码并解码
        const encoding = detectEncoding(response);
        console.log("after detectEncoding, encoding:_", encoding)
        console.log("response.data: ", response.data)
        const rawData = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data, 'binary');
        let decodedData = ''
        try {
          decodedData = iconv.decode(rawData, encoding);
        } catch (error) {
          console.log("decode error: ", error)
        }

        console.log("after decode")
        const $ = cheerio.load(decodedData);
        console.log('decodeData:  ', decodedData)

        let sourceNews: NewsItem[] = [];

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
            console.log("+++++ title: ", title)
            if (title && url) {
              // 确保URL是完整的
              if (!url.startsWith('http')) {
                url = url.startsWith('/')
                  ? `${source.baseUrl}${url}`
                  : `${source.baseUrl}/${url}`;
              }

              // 避免重复新闻
              if (!sourceNews.some(news => news.title === title)) {
                sourceNews.push({
                  id: Date.now() + Math.floor(Math.random() * 1000) + sourceNews.length,
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
          if (sourceNews.length >= config.newsSources.maxNewsPerSource) {
            break;
          }
        }

        console.log(`从 ${source.name} 获取到 ${sourceNews.length} 条新闻`);

        // 如果提供了响应对象和回调函数，则立即发送部分数据
        if (res && sourceNews.length > 0) {
          // 将新闻添加到总列表
          allNews = [...allNews, ...sourceNews];

          // 发送部分数据到客户端
          res.write(JSON.stringify({
            partial: true,
            source: source.name,
            news: sourceNews,
            total: allNews.length
          }) + '\n');

          // 调用回调函数
          if (onSourceComplete) {
            onSourceComplete(source.name, sourceNews);
          }
        }

        return sourceNews;
      } catch (error) {
        // 简化错误处理
        let errorMessage = `从 ${source.name} 抓取新闻失败`;
        if (axios.isAxiosError(error)) {
          errorMessage += error.code ? `: ${error.code}` :
            error.response ? `: ${error.response.status}` :
              ': 网络错误';
        } else {
          errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
        }
        console.error(errorMessage);
        // 返回空数组，不影响其他来源
        return [];
      }
    });

    // 并行执行所有抓取任务
    const results = await Promise.allSettled(fetchTasks);

    // 处理结果
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        // 如果没有使用流式传输，则在这里添加新闻到总列表
        if (!res) {
          allNews = [...allNews, ...result.value];
        }
        // 注意：如果使用流式传输，我们已经在每个任务中添加了新闻到allNews
      }
    });

    // 如果配置了获取内容，则同时获取新闻内容
    if (config.newsSources.fetchContentWithList && allNews.length > 0) {
      console.log('开始并行获取新闻内容...');

      // 限制并发数量，避免同时发送太多请求
      const concurrencyLimit = 5;
      const chunks = [];

      // 将新闻分成多个小块
      for (let i = 0; i < allNews.length; i += concurrencyLimit) {
        chunks.push(allNews.slice(i, i + concurrencyLimit));
      }

      // 逐块处理，每块内并行
      for (const chunk of chunks) {
        const contentPromises = chunk.map(async (news) => {
          try {
            news.content = await fetchNewsContent(news.url);
            return news;
          } catch (error) {
            // 这里不需要再处理错误，因为fetchNewsContent已经处理过了
            news.content = '获取内容失败';
            return news;
          }
        });

        // 等待当前块的所有请求完成
        await Promise.allSettled(contentPromises);
      }

      console.log('所有新闻内容获取完成');
    }

    // 限制返回的新闻数量
    if (allNews.length > config.newsSources.maxTotalNews) {
      allNews = allNews.slice(0, config.newsSources.maxTotalNews);
    }

    return allNews;
  } catch (error) {
    // 简化错误处理
    let errorMessage = `抓取${type === 'political' ? '时政' : '金融'}新闻失败`;
    if (axios.isAxiosError(error)) {
      errorMessage += error.code ? `: ${error.code}` :
        error.response ? `: ${error.response.status}` :
          ': 网络错误';
    } else {
      errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
    }
    console.error(errorMessage);
    return allNews; // 返回已获取的新闻，即使出错
  }
}

// 创建路由器
const router = express.Router();

// 代理时政新闻请求
router.get('/political', (req, res) => {
  // 设置响应头，允许流式传输
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 初始化新闻列表
  let allNews: NewsItem[] = [];

  (async () => {
    try {
      console.log('开始抓取时政新闻...');

      // 使用 fetchNewsFromMultipleSources 函数获取新闻
      allNews = await fetchNewsFromMultipleSources(
        politicalNewsSources,
        'political',
        res, // 传递响应对象，用于流式传输
        (source, news) => {
          console.log(`从 ${source} 获取到 ${news.length} 条时政新闻，已发送到客户端`);
        }
      );

      // 限制返回的新闻数量
      if (allNews.length > config.newsSources.maxTotalNews) {
        allNews = allNews.slice(0, config.newsSources.maxTotalNews);
      }

      // 发送最终完整数据
      res.write(JSON.stringify({
        partial: false,
        complete: true,
        news: allNews,
        total: allNews.length
      }));

      // 结束响应
      res.end();

      console.log(`成功获取 ${allNews.length} 条时政新闻`);
    } catch (error) {
      // 简化错误处理
      let errorMessage = '抓取时政新闻失败';
      if (axios.isAxiosError(error)) {
        errorMessage += error.code ? `: ${error.code}` :
          error.response ? `: ${error.response.status}` :
            ': 网络错误';
      } else {
        errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
      }
      console.error(errorMessage);

      // 如果已经有一些新闻，仍然返回它们
      if (allNews.length > 0) {
        res.write(JSON.stringify({
          partial: false,
          complete: true,
          error: '部分新闻源抓取失败',
          news: allNews,
          total: allNews.length
        }));
        res.end();
      } else {
        // 如果没有任何新闻，返回错误
        res.status(500).json({ error: '抓取时政新闻失败' });
      }
    }
  })();
});

// 代理金融新闻请求
router.get('/financial', (req, res) => {
  // 设置响应头，允许流式传输
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 初始化新闻列表
  let allNews: NewsItem[] = [];

  (async () => {
    try {
      console.log('开始抓取金融新闻...');

      // 使用 fetchNewsFromMultipleSources 函数获取新闻
      allNews = await fetchNewsFromMultipleSources(
        financialNewsSources,
        'financial',
        res, // 传递响应对象，用于流式传输
        (source, news) => {
          console.log(`从 ${source} 获取到 ${news.length} 条金融新闻，已发送到客户端`);
        }
      );

      // 限制返回的新闻数量
      if (allNews.length > config.newsSources.maxTotalNews) {
        allNews = allNews.slice(0, config.newsSources.maxTotalNews);
      }

      // 发送最终完整数据
      res.write(JSON.stringify({
        partial: false,
        complete: true,
        news: allNews,
        total: allNews.length
      }));

      // 结束响应
      res.end();

      console.log(`成功获取 ${allNews.length} 条金融新闻`);
    } catch (error) {
      // 简化错误处理
      let errorMessage = '抓取金融新闻失败';
      if (axios.isAxiosError(error)) {
        errorMessage += error.code ? `: ${error.code}` :
          error.response ? `: ${error.response.status}` :
            ': 网络错误';
      } else {
        errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
      }
      console.error(errorMessage);

      // 如果已经有一些新闻，仍然返回它们
      if (allNews.length > 0) {
        res.write(JSON.stringify({
          partial: false,
          complete: true,
          error: '部分新闻源抓取失败',
          news: allNews,
          total: allNews.length
        }));
        res.end();
      } else {
        // 如果没有任何新闻，返回错误
        res.status(500).json({ error: '抓取金融新闻失败' });
      }
    }
  })();
});

// 添加获取新闻内容的路由
router.get('/content', (req, res) => {
  (async () => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: '缺少URL参数' });
        return;
      }

      console.log(`尝试获取URL内容: ${url}`);

      // 获取URL内容
      const content = await fetchNewsContent(url);

      res.json({ content });
    } catch (error) {
      // 简化错误处理
      let errorMessage = '获取URL内容失败';
      if (axios.isAxiosError(error)) {
        errorMessage += error.code ? `: ${error.code}` :
          error.response ? `: ${error.response.status}` :
            ': 网络错误';
      } else {
        errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
      }
      console.error(errorMessage);
      res.status(500).json({ error: '获取URL内容失败' });
    }
  })();
});

// 添加通过ID获取新闻内容的路由 - 支持前端API
router.get('/:type/content/:id', (req, res) => {
  (async () => {
    try {
      const { type, id } = req.params;
      const { url } = req.query; // 允许直接通过URL参数获取内容

      if (!type || !id) {
        res.status(400).json({ error: '缺少必要参数' });
        return;
      }

      if (type !== 'political' && type !== 'financial') {
        res.status(400).json({ error: '新闻类型无效' });
        return;
      }

      console.log(`尝试获取${type === 'political' ? '时政' : '金融'}新闻内容，ID: ${id}`);

      let content = '';

      // 如果提供了URL，直接获取内容
      if (url && typeof url === 'string') {
        content = await fetchNewsContent(url);
      } else {
        // 否则返回错误，要求提供URL
        res.status(400).json({ error: '缺少URL参数，无法获取内容' });
        return;
      }

      // 构造一个基本的新闻对象返回
      res.json({
        id,
        type,
        content,
        url: url as string
      });
    } catch (error) {
      // 简化错误处理
      let errorMessage = '获取新闻内容失败';
      if (axios.isAxiosError(error)) {
        errorMessage += error.code ? `: ${error.code}` :
          error.response ? `: ${error.response.status}` :
            ': 网络错误';
      } else {
        errorMessage += error instanceof Error ? `: ${error.name}` : ': 未知错误';
      }
      console.error(errorMessage);
      res.status(500).json({ error: '获取新闻内容失败' });
    }
  })();
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
  // 处理Axios错误
  if (axios.isAxiosError(error)) {
    if (error.code) {
      console.error('未捕获的异常:', error.code);
    } else if (error.response) {
      console.error('未捕获的异常:', error.response.status);
    } else {
      console.error('未捕获的异常: AxiosError');
    }
  } else {
    console.error('未捕获的异常:', error instanceof Error ? error.name : 'UnknownError');
  }
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  // 处理Axios错误
  if (axios.isAxiosError(reason)) {
    if (reason.code) {
      console.error('未处理的Promise拒绝:', reason.code);
    } else if (reason.response) {
      console.error('未处理的Promise拒绝:', reason.response.status);
    } else {
      console.error('未处理的Promise拒绝: AxiosError');
    }
  } else {
    console.error('未处理的Promise拒绝:', reason instanceof Error ? reason.name : String(reason));
  }
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