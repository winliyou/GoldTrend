import { reactive, readonly } from 'vue';
import { NewsItem, AnalysisResult, LoadingState, AnalysisSettings } from '../types';
import * as newsApi from '../api/news';
import * as deepseekApi from '../api/deepseek';

// 状态接口
interface State {
  politicalNews: NewsItem[];
  financialNews: NewsItem[];
  selectedNews: NewsItem[];
  analysisResult: AnalysisResult | null;
  analysisSettings: AnalysisSettings;
  loading: LoadingState;
  error: string | null;
  apiKey: string;
}

// 默认分析设置
const defaultAnalysisSettings: AnalysisSettings = {
  analysisTarget: 'gold_price',
  focusAreas: ['经济因素', '政治因素'],
  timeFrame: 'medium',
  analysisDepth: 3,
  additionalNotes: ''
};

// 初始状态
const state = reactive<State>({
  politicalNews: [],
  financialNews: [],
  selectedNews: [],
  analysisResult: null,
  analysisSettings: { ...defaultAnalysisSettings },
  loading: {
    politicalNews: false,
    financialNews: false,
    newsContent: false,
    analysis: false
  },
  error: null,
  apiKey: localStorage.getItem('deepseek_api_key') || ''
});

// 如果本地存储中有API密钥，则设置它
if (state.apiKey) {
  deepseekApi.setApiKey(state.apiKey);
}

// 操作
const actions = {
  // 获取时政新闻
  async fetchPoliticalNews() {
    state.loading.politicalNews = true;
    state.error = null;
    
    try {
      const news = await newsApi.fetchPoliticalNews();
      state.politicalNews = news;
    } catch (error) {
      state.error = `获取时政新闻失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(state.error);
    } finally {
      state.loading.politicalNews = false;
    }
  },
  
  // 获取金融新闻
  async fetchFinancialNews() {
    state.loading.financialNews = true;
    state.error = null;
    
    try {
      const news = await newsApi.fetchFinancialNews();
      state.financialNews = news;
    } catch (error) {
      state.error = `获取金融新闻失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(state.error);
    } finally {
      state.loading.financialNews = false;
    }
  },
  
  // 获取新闻内容
  async fetchNewsContent(newsItem: NewsItem) {
    if (newsItem.content) {
      return; // 如果已经有内容，则不需要再次获取
    }
    
    state.loading.newsContent = true;
    state.error = null;
    
    try {
      // 直接传递NewsItem对象给API函数
      const updatedNews = await newsApi.fetchNewsContent(newsItem);
      
      // 确保返回的对象有内容
      if (!updatedNews || !updatedNews.content) {
        throw new Error('获取的新闻内容为空');
      }
      
      // 更新对应类型的新闻列表中的新闻内容
      if (newsItem.type === 'political') {
        const index = state.politicalNews.findIndex(item => item.id === newsItem.id);
        if (index !== -1) {
          state.politicalNews[index] = { ...state.politicalNews[index], ...updatedNews };
        }
      } else {
        const index = state.financialNews.findIndex(item => item.id === newsItem.id);
        if (index !== -1) {
          state.financialNews[index] = { ...state.financialNews[index], ...updatedNews };
        }
      }
      
      // 如果该新闻在已选择列表中，也更新它
      const selectedIndex = state.selectedNews.findIndex(item => item.id === newsItem.id);
      if (selectedIndex !== -1) {
        state.selectedNews[selectedIndex] = { ...state.selectedNews[selectedIndex], ...updatedNews };
      }
      
      console.log('新闻内容获取成功:', updatedNews.content.substring(0, 100) + '...');
      return updatedNews.content;
    } catch (error) {
      state.error = `获取新闻内容失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(state.error);
      return '';
    } finally {
      state.loading.newsContent = false;
    }
  },
  
  // 选择/取消选择新闻
  toggleSelectNews(newsItem: NewsItem) {
    // 在对应类型的新闻列表中更新选择状态
    if (newsItem.type === 'political') {
      const index = state.politicalNews.findIndex(item => item.id === newsItem.id);
      if (index !== -1) {
        state.politicalNews[index].selected = !state.politicalNews[index].selected;
      }
    } else {
      const index = state.financialNews.findIndex(item => item.id === newsItem.id);
      if (index !== -1) {
        state.financialNews[index].selected = !state.financialNews[index].selected;
      }
    }
    
    // 更新已选择列表
    const selectedIndex = state.selectedNews.findIndex(item => item.id === newsItem.id);
    if (selectedIndex !== -1) {
      // 如果已经在列表中，则移除
      state.selectedNews.splice(selectedIndex, 1);
    } else {
      // 否则添加到列表中
      state.selectedNews.push(newsItem);
    }
  },
  
  // 清空已选择的新闻
  clearSelectedNews() {
    // 重置所有新闻的选择状态
    state.politicalNews.forEach(news => {
      news.selected = false;
    });
    state.financialNews.forEach(news => {
      news.selected = false;
    });
    
    // 清空已选择列表
    state.selectedNews = [];
  },

  
  // 使用流式响应分析新闻
  async analyzeNewsWithProgress(onProgress: (progress: { message?: string; percentage?: number; content?: string }) => void) {
    if (state.selectedNews.length === 0) {
      state.error = '请先选择要分析的新闻';
      return;
    }
    
    // 检查所有选择的新闻是否都有内容
    const newsWithoutContent = state.selectedNews.filter(news => !news.content);
    if (newsWithoutContent.length > 0) {
      // 获取所有缺少内容的新闻的内容
      onProgress({ message: '正在获取新闻内容...', percentage: 10 });
      
      for (const news of newsWithoutContent) {
        await actions.fetchNewsContent(news);
      }
    }
    
    state.loading.analysis = true;
    state.error = null;
    
    try {
      // 将分析设置传递给API，并提供进度回调
      onProgress({ message: '开始分析...', percentage: 20 });
      
      const result = await deepseekApi.analyzeNews(
        state.selectedNews, 
        state.analysisSettings,
        (text) => {
          // 将流式内容传递给进度回调
          onProgress({ content: text });
        }
      );
      
      if (result.success && result.data) {
        state.analysisResult = result.data;
        onProgress({ message: '分析完成', percentage: 100 });
      } else {
        state.error = result.message;
        onProgress({ message: `分析失败: ${result.message}`, percentage: 100 });
      }
      
      return result;
    } catch (error) {
      state.error = `分析新闻失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(state.error);
      onProgress({ message: `分析失败: ${error instanceof Error ? error.message : '未知错误'}`, percentage: 100 });
      throw error;
    } finally {
      state.loading.analysis = false;
    }
  },
  
  // 设置API密钥
  setApiKey(apiKey: string) {
    state.apiKey = apiKey;
    deepseekApi.setApiKey(apiKey);
    localStorage.setItem('deepseek_api_key', apiKey);
  },
  
  // 设置分析设置
  setAnalysisSettings(settings: AnalysisSettings) {
    state.analysisSettings = { ...settings };
    console.log('分析设置已更新:', state.analysisSettings);
  }
};

// 导出存储
export function useStore() {
  return {
    state: readonly(state),
    ...actions
  };
} 