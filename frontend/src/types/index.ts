/**
 * 新闻分析器前端类型定义
 */

// 新闻类型
export type NewsType = 'political' | 'financial';

// 新闻项目接口
export interface NewsItem {
  id: string;
  title: string;
  source?: string;
  date: string;
  content?: string;
  summary?: string;
  type: NewsType;
  selected?: boolean;
}

// 新闻分析结果接口
export interface AnalysisResult {
  analysis: NewsAnalysis[];
  gold_price_prediction: GoldPricePrediction;
  need_more_info: boolean;
  missing_info: string[];
}

// 单条新闻分析
export interface NewsAnalysis {
  news_id: string;
  title: string;
  key_points: string[];
  implications: string;
}

// 金价预测
export interface GoldPricePrediction {
  trend: '上涨' | '下跌' | '稳定';
  confidence: number;
  reasoning: string;
  key_factors: string[];
}

// API响应通用接口
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// 配置接口
export interface Config {
  apiUrl: string;
  deepseekApiUrl?: string;
}

// 加载状态
export interface LoadingState {
  politicalNews: boolean;
  financialNews: boolean;
  newsContent: boolean;
  analysis: boolean;
}

// 应用状态
export interface AppState {
  politicalNews: NewsItem[];
  financialNews: NewsItem[];
  selectedNews: NewsItem[];
  analysisResult: AnalysisResult | null;
  loading: LoadingState;
  error: string | null;
  apiKey: string;
}

// 应用操作
export interface AppActions {
  fetchPoliticalNews: () => Promise<void>;
  fetchFinancialNews: () => Promise<void>;
  fetchNewsContent: (news: NewsItem) => Promise<string>;
  toggleSelectNews: (news: NewsItem) => void;
  clearSelectedNews: () => void;
  analyzeNews: () => Promise<void>;
  setApiKey: (key: string) => void;
}

// 应用存储
export interface AppStore {
  state: AppState;
  fetchPoliticalNews: () => Promise<void>;
  fetchFinancialNews: () => Promise<void>;
  fetchNewsContent: (news: NewsItem) => Promise<string>;
  toggleSelectNews: (news: NewsItem) => void;
  clearSelectedNews: () => void;
  analyzeNews: () => Promise<void>;
  setApiKey: (key: string) => void;
} 