/**
 * 新闻分析器后端配置文件
 */
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface NewsSourcesConfig {
  maxNewsPerSource: number;
  maxTotalNews: number;
  fetchContentWithList: boolean;
}

export interface Config {
  port: number;
  baseUrl: string;
  apiPath: string;
  timeout: number;
  newsSources: NewsSourcesConfig;
}

const config: Config = {
  // 代理服务器配置
  port: parseInt(process.env.VITE_PROXY_SERVER_PORT || '6000', 10),
  baseUrl: process.env.VITE_PROXY_SERVER_API_BASE_URL || 'http://localhost:6000',
  apiPath: '/api',
  timeout: parseInt(process.env.VITE_PROXY_SERVER_API_TIMEOUT || '15000', 10),
  
  // 新闻来源配置
  newsSources: {
    // 每个来源最多获取的新闻数量
    maxNewsPerSource: parseInt(process.env.VITE_PROXY_SERVER_MAX_NEWS_PER_SOURCE || '5', 10),
    // 总共最多获取的新闻数量
    maxTotalNews: parseInt(process.env.VITE_PROXY_SERVER_MAX_TOTAL_NEWS || '10', 10),
    // 是否在获取新闻列表时同时获取内容
    fetchContentWithList: process.env.VITE_PROXY_SERVER_FETCH_CONTENT_WITH_LIST === 'true'
  }
};

export default config; 