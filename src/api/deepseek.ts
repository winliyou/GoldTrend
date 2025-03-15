import axios from 'axios';
import { NewsItem, AnalysisResult, ApiResponse, AnalysisSettings } from '../types';
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

// 解析SSE数据流
function parseSSEData(data: string): string | null {
  // 处理多行数据的情况
  const lines = data.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') return null;
      try {
        const parsed = JSON.parse(jsonStr);
        return parsed.choices[0]?.delta?.content || '';
      } catch (e) {
        console.error('解析SSE数据失败:', e);
      }
    }
  }
  return null;
}
// 处理流式响应
async function handleStreamResponse(
  response: any,
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void
): Promise<void> {
  console.log("++++++response: ", response)
  const reader = response.data.pipeThrough(new TextDecoderStream()).getReader();
  if (!reader) {
    throw new Error('无法获取响应流读取器');
  }
  let buffer = '';
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      console.log("++++value: ", value)
      if (done) break;

      // buffer += decoder.decode(value, { stream: true });
      buffer += value;

      let lastIndex = 0;
      while (true) {
        const eventEndIndex = buffer.indexOf('\n\n', lastIndex);
        if (eventEndIndex === -1) break;

        const eventData = buffer.slice(lastIndex, eventEndIndex);
        lastIndex = eventEndIndex + 2;

        const content = parseSSEData(eventData);
        if (content !== null) {
          onChunk(content);
          fullContent += content;
        }
      }
      buffer = buffer.slice(lastIndex);
    }

    // 处理剩余buffer
    if (buffer.trim()) {
      const content = parseSSEData(buffer);
      if (content !== null) {
        onChunk(content);
        fullContent += content;
      }
    }

    onComplete(fullContent);
  } catch (error) {
    console.error('处理流式响应失败:', error);
    throw error;
  }
}

// 分析新闻内容
export async function analyzeNews(
  newsList: NewsItem[],
  settings: AnalysisSettings,
  onProgress?: (text: string) => void
): Promise<ApiResponse<AnalysisResult>> {
  if (!DEEPSEEK_API_KEY) {
    return {
      success: false,
      message: '请先设置DeepSeek API密钥',
      data: null
    };
  }

  try {
    console.log('准备分析的新闻列表:', newsList);
    console.log('分析设置:', settings);

    // 准备发送给DeepSeek的内容
    const newsContent = newsList.map(news => {
      return `标题: ${news.title}\n来源: ${news.source || (news.type === 'political' ? '时政新闻' : '金融新闻')}\n内容: ${news.content}\n`;
    }).join('\n---\n');

    // 根据分析目标生成不同的提示词
    let targetPrompt = '';
    switch (settings.analysisTarget) {
      case 'gold_price':
        targetPrompt = '分析这些新闻对金价的潜在影响，并预测金价走势。';
        break;
      case 'stock_market':
        targetPrompt = '分析这些新闻对股市的潜在影响，并预测股市走势。';
        break;
      case 'economic_policy':
        targetPrompt = '分析这些新闻反映的经济政策变化，并评估其影响。';
        break;
      case 'geopolitical':
        targetPrompt = '分析这些新闻中的地缘政治因素，并评估其对全球经济的影响。';
        break;
      default:
        targetPrompt = `分析这些新闻，并评估其对${settings.analysisTarget}的影响。`;
        break;
    }

    // 根据分析重点生成提示词
    const focusAreasPrompt = settings.focusAreas.length > 0
      ? `请特别关注以下方面：${settings.focusAreas.join('、')}。`
      : '';

    // 根据时间范围生成提示词
    let timeFramePrompt = '';
    switch (settings.timeFrame) {
      case 'short':
        timeFramePrompt = '请提供短期（1-7天）的分析和预测。';
        break;
      case 'medium':
        timeFramePrompt = '请提供中期（1-3个月）的分析和预测。';
        break;
      case 'long':
        timeFramePrompt = '请提供长期（3个月以上）的分析和预测。';
        break;
    }

    // 根据分析深度调整提示词
    const depthPrompt = settings.analysisDepth <= 2
      ? '请提供简要分析。'
      : settings.analysisDepth >= 4
        ? '请提供深入详细的分析。'
        : '请提供标准深度的分析。';

    // 附加说明
    const additionalPrompt = settings.additionalNotes
      ? `附加要求：${settings.additionalNotes}`
      : '';

    const prompt = `
请分析以下新闻，挖掘背后的含义。${targetPrompt}
${focusAreasPrompt}
${timeFramePrompt}
${depthPrompt}
${additionalPrompt}

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

    // 模拟进度回调
    if (onProgress) {
      onProgress('正在连接DeepSeek API...');
    }

    // 使用流式响应
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat', // 请替换为实际的模型名称
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
        stream: true // 启用流式响应
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Accept': 'text/event-stream'
        },
        responseType: 'stream',
        adapter: "fetch"
      }
    );

    console.log('DeepSeek API流式响应开始');

    let fullContent = '';
    let accumulatedContent = '';

    // 处理流式响应
    await handleStreamResponse(
      response,
      (chunk) => {
        accumulatedContent += chunk;
        if (onProgress) {
          // 每累积一定量的文本就回调一次
          if (accumulatedContent.length > 20) {
            onProgress(accumulatedContent);
            accumulatedContent = '';
          }
        }
      },
      (text) => {
        fullContent = text;
        if (onProgress && accumulatedContent.length > 0) {
          onProgress(accumulatedContent);
        }
      }
    );

    console.log('DeepSeek API流式响应完成');

    let result: AnalysisResult;
    try {
      // 尝试多种方式提取JSON
      const jsonStart = fullContent.indexOf('{');
      const jsonEnd = fullContent.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('未找到有效的JSON内容');
      }

      const jsonStr = fullContent.slice(jsonStart, jsonEnd + 1);
      result = JSON.parse(jsonStr);

      // 验证必要字段
      if (!result.analysis || !result.gold_price_prediction) {
        throw new Error('API返回的数据结构不符合预期');
      }

      result.raw_response = fullContent;
    } catch (e) {
      console.error('解析失败:', e);
      throw new Error(`解析API响应失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }

    return {
      success: true,
      message: '分析成功',
      data: result
    };
  } catch (error) {
    console.error('分析新闻失败:', error);
    return {
      success: false,
      message: `分析新闻失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: null
    };
  }
} 