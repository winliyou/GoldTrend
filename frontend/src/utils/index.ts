/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    console.error('无效的日期:', date);
    return '无效日期';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:MM 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的时间字符串
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    console.error('无效的日期:', date);
    return '无效时间';
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * 截断文本，超过指定长度时添加省略号
 * @param text 要截断的文本
 * @param length 最大长度，默认为100
 * @returns 截断后的文本
 */
export function truncateText(text: string, length: number = 100): string {
  if (!text) return '';
  
  if (text.length <= length) {
    return text;
  }
  
  return text.substring(0, length) + '...';
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 设置本地存储项
   * @param key 键名
   * @param value 值
   */
  set(key: string, value: any): void {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('设置本地存储失败:', error);
    }
  },
  
  /**
   * 获取本地存储项
   * @param key 键名
   * @param defaultValue 默认值
   * @returns 存储的值或默认值
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const value = localStorage.getItem(key);
      
      if (value === null) {
        return defaultValue;
      }
      
      try {
        // 尝试解析为JSON
        return JSON.parse(value) as T;
      } catch {
        // 如果不是有效的JSON，则返回原始值
        return value as unknown as T;
      }
    } catch (error) {
      console.error('获取本地存储失败:', error);
      return defaultValue;
    }
  },
  
  /**
   * 移除本地存储项
   * @param key 键名
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('移除本地存储失败:', error);
    }
  }
}; 