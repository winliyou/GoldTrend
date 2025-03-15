import axios from 'axios';
import { NewsItem } from '../types';
import config from '../config';

// 设置基础API URL
const API_URL = config.apiUrl;

/**
 * 获取时政新闻列表
 * @returns 时政新闻列表
 */
export async function fetchPoliticalNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${config.apiUrl}/political`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 检查是否支持流式传输
    const reader = response.body?.getReader();
    if (reader) {
      // 处理流式响应
      return await processStreamResponse(reader);
    } else {
      // 回退到普通JSON响应
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('获取时政新闻失败:', error);
    throw error;
  }
}

/**
 * 获取金融新闻列表
 * @returns 金融新闻列表
 */
export async function fetchFinancialNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${config.apiUrl}/financial`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 检查是否支持流式传输
    const reader = response.body?.getReader();
    if (reader) {
      // 处理流式响应
      return await processStreamResponse(reader);
    } else {
      // 回退到普通JSON响应
      const data = await response.json();
      console.log("++++++++ data: ", data)
      return data;
    }
  } catch (error) {
    console.error('获取金融新闻失败:', error);
    throw error;
  }
}

// 处理流式响应
async function processStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<NewsItem[]> {
  const decoder = new TextDecoder();
  let allNews: NewsItem[] = [];
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码二进制数据
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // 处理可能包含多个JSON对象的buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最后一行可能不完整，保留到下一次处理
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const data = JSON.parse(line);
          console.log("++++ data: ", data)
          
          // 处理部分数据
          if (data.partial && data.news) {
            // 发布部分数据更新事件
            window.dispatchEvent(new CustomEvent('news-partial-update', { 
              detail: { 
                source: data.source,
                news: data.news,
                total: data.total
              } 
            }));
            
            // 添加到总列表
            allNews = [...allNews, ...data.news];
          }
          
          // 处理完整数据
          if (data.complete && data.news) {
            allNews = data.news; // 使用服务器返回的最终列表
          }
        } catch (e) {
          console.error('解析JSON失败:', e, 'Line:', line);
        }
      }
    }
    
    // 处理最后可能剩余的数据
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        
        // 处理完整数据
        if (data.complete && data.news) {
          allNews = data.news; // 使用服务器返回的最终列表
        }
      } catch (e) {
        console.error('解析最后的JSON失败:', e);
      }
    }
    
    return allNews;
  } catch (error) {
    console.error('处理流式响应失败:', error);
    throw error;
  }
}

/**
 * 获取新闻内容
 * @param idOrNewsItem 新闻ID或新闻对象
 * @param type 新闻类型（当第一个参数为ID时必须提供）
 * @returns 包含内容的新闻项
 */
export async function fetchNewsContent(
  idOrNewsItem: string | NewsItem, 
  type?: 'political' | 'financial'
): Promise<NewsItem> {
  try {
    let id: string;
    let newsType: 'political' | 'financial';
    let url: string;
    let originalNewsItem: Partial<NewsItem> = {};
    
    // 判断第一个参数是ID还是NewsItem对象
    if (typeof idOrNewsItem === 'string') {
      // 如果是ID，则需要type参数
      if (!type) {
        throw new Error('当提供ID时，必须指定新闻类型');
      }
      id = idOrNewsItem;
      newsType = type;
      // 注意：这种情况下我们没有URL，可能会导致后端API调用失败
      url = '';
      originalNewsItem = { id, type: newsType };
    } else {
      // 如果是NewsItem对象，则从对象中获取ID、type和url
      id = idOrNewsItem.id;
      newsType = idOrNewsItem.type as 'political' | 'financial';
      url = idOrNewsItem.url || '';
      originalNewsItem = { ...idOrNewsItem };
    }
    
    console.log(`获取${newsType === 'political' ? '时政' : '金融'}新闻内容，ID: ${id}`);
    
    // 调用后端API，传递URL参数
    const response = await axios.get(`${API_URL}/${newsType}/content/${id}`, {
      params: { url }
    });
    
    // 确保响应数据包含内容
    if (!response.data || !response.data.content) {
      console.error('后端返回的数据不包含内容:', response.data);
      throw new Error('获取的新闻内容为空');
    }
    
    // 合并原始新闻项和响应数据
    const result: NewsItem = {
      ...originalNewsItem,
      ...response.data,
      // 确保必要的字段存在
      id: id,
      type: newsType,
      content: response.data.content || '获取内容失败'
    };
    
    // 使用非空断言或条件检查
    const contentPreview = result.content ? result.content.substring(0, 100) + '...' : '内容为空';
    console.log('新闻内容获取成功:', contentPreview);
    return result;
  } catch (error) {
    console.error('获取新闻内容失败:', error);
    throw error;
  }
} 