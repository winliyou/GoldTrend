/**
 * 新闻分析器类型定义
 */

// 新闻来源选择器配置
export interface NewsSourceSelector {
  name: string;
  url: string;
  selectors: string[];
  titleSelector: string;
  urlSelector: string;
  timeSelector: string;
  baseUrl: string;
}

// 新闻项
export interface NewsItem {
  id: number;
  title: string;
  url: string;
  time: string;
  source: string;
  type: 'political' | 'financial';
  content: string;
}

// API响应
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// 新闻内容响应
export interface NewsContentResponse {
  content: string;
} 