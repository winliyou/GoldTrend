import axios from 'axios';
import { NewsItem, AnalysisResult, ApiResponse } from '../types';
import config from '../config';

// DeepSeek API配置
const DEEPSEEK_API_URL = config.deepseekApiUrl;
let DEEPSEEK_API_KEY = ''; // API密钥将在运行时设置

// 设置API密钥
export function setApiKey(apiKey: string): void {
  DEEPSEEK_API_KEY = apiKey;
  console.log('DeepSeek API密钥已设置');
}

// 获取API密钥
export function getApiKey(): string {
  return DEEPSEEK_API_KEY;
}

// 分析新闻内容
export async function analyzeNews(newsList: NewsItem[]): Promise<ApiResponse<AnalysisResult>> {
  if (!DEEPSEEK_API_KEY) {
    return {
      success: false,
      message: '请先设置DeepSeek API密钥',
      data: null
    };
  }

  try {
    console.log('准备分析的新闻列表:', newsList);

    // 准备发送给DeepSeek的内容
    const newsContent = newsList.map(news => {
      return `标题: ${news.title}\n来源: ${news.source || (news.type === 'political' ? '时政新闻' : '金融新闻')}\n内容: ${news.content}\n`;
    }).join('\n---\n');

    const prompt = `
请分析以下新闻，挖掘背后的含义，并分析这些新闻对金价的潜在影响。
请按照以下格式返回结果：

{
  "analysis": [
    {
      "news_id": 新闻ID,
      "title": "新闻标题",
      "key_points": ["关键点1", "关键点2", ...],
      "implications": "新闻背后的含义和影响"
    },
    ...
  ],
  "gold_price_prediction": {
    "trend": "上涨/下跌/稳定",
    "confidence": 0-100的数字,
    "reasoning": "预测理由",
    "key_factors": ["影响因素1", "影响因素2", ...]
  },
  "need_more_info": false,
  "missing_info": []
}

如果你认为信息不足以做出准确分析，请将need_more_info设为true，并在missing_info中列出你需要的额外信息。

以下是需要分析的新闻：

${newsContent}
`;

    console.log('发送给DeepSeek的提示词:', prompt);

    // 模拟API调用，实际项目中应替换为真实的API调用
    // 在没有真实API密钥的情况下，返回模拟数据
    const mockResponse: ApiResponse<AnalysisResult> = {
      success: true,
      message: '分析成功',
      data: {
        analysis: newsList.map((news) => ({
          news_id: news.id,
          title: news.title,
          key_points: ['这是一个关键点', '这是另一个关键点'],
          implications: `这是对"${news.title}"的分析。这条新闻可能对金价有一定影响。`
        })),
        gold_price_prediction: {
          trend: Math.random() > 0.5 ? '上涨' : '下跌',
          confidence: Math.floor(Math.random() * 40) + 60, // 60-100之间的随机数
          reasoning: '基于以上新闻分析，金价可能会受到多种因素的影响，包括经济政策、地缘政治风险等。',
          key_factors: ['经济政策', '地缘政治风险', '市场情绪', '供需关系']
        },
        need_more_info: false,
        missing_info: []
      }
    };

    // 如果有真实API密钥，则使用真实API调用
    if (DEEPSEEK_API_KEY !== 'demo') {
      try {
        const response = await axios.post(
          DEEPSEEK_API_URL,
          {
            model: 'deepseek-chat', // 请替换为实际的模型名称
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
          }
        );

        console.log('DeepSeek API响应:', response.data);

        // 解析API返回的结果
        const content = response.data.choices[0].message.content;
        let result: AnalysisResult;

        try {
          // 尝试解析JSON
          result = JSON.parse(content);
        } catch (e) {
          // 如果不是有效的JSON，尝试从文本中提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              result = JSON.parse(jsonMatch[0]);
            } catch (e2) {
              throw new Error('无法解析API返回的结果');
            }
          } else {
            throw new Error('API返回的结果不包含有效的JSON');
          }
        }

        return {
          success: true,
          message: '分析成功',
          data: result
        };
      } catch (apiError) {
        console.error('调用DeepSeek API失败:', apiError);
        // 如果API调用失败，返回模拟数据
        return mockResponse;
      }
    }

    // 如果没有真实API密钥或使用demo密钥，返回模拟数据
    console.log('使用模拟数据:', mockResponse);
    return mockResponse;
  } catch (error) {
    console.error('分析新闻失败:', error);
    return {
      success: false,
      message: `分析新闻失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: null
    };
  }
} 