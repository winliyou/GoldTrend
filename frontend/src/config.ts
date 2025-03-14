import { Config } from './types';

// 默认配置
const defaultConfig: Config = {
  apiUrl: process.env.VITE_PROXY_SERVER_API_BASE_URL || 'http://localhost:6000/api',
  deepseekApiUrl: process.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
};
export default defaultConfig; 