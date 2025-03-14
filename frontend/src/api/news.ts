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
    console.log('获取时政新闻，API URL:', `${API_URL}/political`);
    const response = await axios.get(`${API_URL}/political`);
    console.log('时政新闻获取成功:', response.data);
    return response.data;
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
    console.log('获取金融新闻，API URL:', `${API_URL}/financial`);
    const response = await axios.get(`${API_URL}/financial`);
    console.log('金融新闻获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取金融新闻失败:', error);
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
    
    // 判断第一个参数是ID还是NewsItem对象
    if (typeof idOrNewsItem === 'string') {
      // 如果是ID，则需要type参数
      if (!type) {
        throw new Error('当提供ID时，必须指定新闻类型');
      }
      id = idOrNewsItem;
      newsType = type;
    } else {
      // 如果是NewsItem对象，则从对象中获取ID和type
      id = idOrNewsItem.id;
      newsType = idOrNewsItem.type as 'political' | 'financial';
    }
    
    console.log(`获取${newsType === 'political' ? '时政' : '金融'}新闻内容，ID: ${id}`);
    const response = await axios.get(`${API_URL}/${newsType}/content/${id}`);
    console.log('新闻内容获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取新闻内容失败:', error);
    throw error;
  }
} 