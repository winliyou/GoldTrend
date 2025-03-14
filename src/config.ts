import { Config } from './types';

console.log("import.meta",import.meta)
// 默认配置
const defaultConfig: Config = {
  apiUrl: `http://localhost:${import.meta.env.VITE_PROXY_SERVER_PORT || '9999'}${import.meta.env.VITE_PROXY_SERVER_API_PATH || '/api'}`,
  deepseekApiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || ''
};
export default defaultConfig; 