<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="api-key-card">
          <div class="api-key-container">
            <el-input
              v-model="apiKey"
              placeholder="请输入DeepSeek API密钥"
              show-password
              clearable
              :disabled="loading"
            >
              <template #prepend>
                <div class="api-key-label">API密钥</div>
              </template>
              <template #append>
                <el-button type="primary" @click="saveApiKey" :disabled="loading">保存</el-button>
              </template>
            </el-input>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="news-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><Document /></el-icon>
                <span>时政新闻</span>
              </div>
              <div class="card-actions">
                <el-button type="success" @click="showAddNewsDialog('political')" :disabled="loading">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
                <el-button type="primary" @click="fetchPoliticalNews" :loading="state.loading.politicalNews">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="state.loading.politicalNews" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else-if="state.politicalNews.length === 0" class="empty-container">
            <el-empty description="暂无时政新闻" />
          </div>
          <div v-else class="news-list">
            <div
              v-for="news in state.politicalNews"
              :key="`political-${news.id}`"
              class="news-item"
              :class="{ 'selected': isSelected(news) }"
              @click="toggleSelectNews(news)"
            >
              <div class="news-title">{{ news.title }}</div>
              <div class="news-meta">
                <span class="news-time">{{ news.time || '未知时间' }}</span>
                <el-tag size="small" type="success">时政</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="news-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><Money /></el-icon>
                <span>金融新闻</span>
              </div>
              <div class="card-actions">
                <el-button type="success" @click="showAddNewsDialog('financial')" :disabled="loading">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
                <el-button type="primary" @click="fetchFinancialNews" :loading="state.loading.financialNews">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="state.loading.financialNews" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else-if="state.financialNews.length === 0" class="empty-container">
            <el-empty description="暂无金融新闻" />
          </div>
          <div v-else class="news-list">
            <div
              v-for="news in state.financialNews"
              :key="`financial-${news.id}`"
              class="news-item"
              :class="{ 'selected': isSelected(news) }"
              @click="toggleSelectNews(news)"
            >
              <div class="news-title">{{ news.title }}</div>
              <div class="news-meta">
                <span class="news-time">{{ news.time || '未知时间' }}</span>
                <el-tag size="small" type="warning">金融</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="selected-news-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><Star /></el-icon>
                <span>已选择的新闻 ({{ state.selectedNews.length }})</span>
              </div>
              <div class="card-actions">
                <el-button type="success" @click="showImportNewsDialog" :disabled="loading">
                  <el-icon><Upload /></el-icon> 导入新闻
                </el-button>
                <el-button type="danger" @click="clearSelectedNews" :disabled="state.selectedNews.length === 0">
                  <el-icon><Delete /></el-icon> 清空
                </el-button>
                <el-button type="warning" @click="showAnalysisSettingsDialog" :disabled="state.selectedNews.length === 0">
                  <el-icon><Setting /></el-icon> 分析设置
                </el-button>
                <el-button type="primary" @click="analyzeNews" :loading="state.loading.analysis" :disabled="state.selectedNews.length === 0">
                  <el-icon><DataAnalysis /></el-icon> 分析
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="state.selectedNews.length === 0" class="empty-container">
            <el-empty description="请从上方选择要分析的新闻" />
          </div>
          <div v-else class="selected-news-list">
            <el-collapse>
              <el-collapse-item
                v-for="news in state.selectedNews"
                :key="`selected-${news.type}-${news.id}`"
                :title="news.title"
              >
                <div class="news-content-container">
                  <div v-if="!news.content && state.loading.newsContent" class="loading-container">
                    <el-skeleton :rows="3" animated />
                  </div>
                  <div v-else-if="!news.content" class="empty-container">
                    <el-button type="primary" @click.stop="loadNewsContent(news)">
                      <el-icon><Download /></el-icon> 加载内容
                    </el-button>
                  </div>
                  <div v-else class="news-content">
                    {{ news.content }}
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="analysis-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-icon><TrendCharts /></el-icon>
                <span>分析结果</span>
              </div>
              <div class="card-actions" v-if="state.analysisResult">
                <el-button type="info" @click="toggleRawResponse">
                  <el-icon><View /></el-icon> {{ state.showRawResponse ? '隐藏原始回复' : '显示原始回复' }}
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="state.loading.analysis" class="loading-container">
            <div class="stream-loading">
              <el-progress :percentage="state.analysisProgress.percentage" :status="state.analysisProgress.status" />
              <div class="stream-message">{{ state.analysisProgress.message }}</div>
              <div v-if="state.analysisProgress.streamContent" class="stream-content">
                <pre>{{ state.analysisProgress.streamContent }}</pre>
              </div>
            </div>
          </div>
          <div v-else-if="!state.analysisResult" class="empty-container">
            <el-empty description="暂无分析结果" />
            <div v-if="state.error" class="error-message">
              <el-alert
                :title="'分析失败'"
                type="error"
                :description="state.error"
                :closable="false"
                show-icon
              />
            </div>
          </div>
          <div v-else class="analysis-result">
            <!-- 显示原始回复 -->
            <div v-if="state.showRawResponse" class="raw-response">
              <el-alert
                title="DeepSeek 原始回复"
                type="info"
                :closable="false"
                show-icon
              >
                <div class="raw-response-content">
                  <pre>{{ state.analysisResult.raw_response || '无原始回复数据' }}</pre>
                </div>
              </el-alert>
              <el-divider />
            </div>
            
            <div v-if="state.analysisResult.need_more_info" class="need-more-info">
              <el-alert
                title="需要更多信息"
                type="warning"
                :closable="false"
                show-icon
              >
                <div class="missing-info">
                  <p>缺少的信息：</p>
                  <ul>
                    <li v-for="(info, index) in state.analysisResult.missing_info" :key="index">
                      {{ info }}
                    </li>
                  </ul>
                </div>
              </el-alert>
            </div>
            
            <div v-else class="analysis-content">
              <h3 class="section-title">
                <el-icon><Reading /></el-icon> 新闻分析
              </h3>
              <el-divider />
              
              <div v-for="(item, index) in state.analysisResult.analysis" :key="index" class="analysis-item">
                <h4 class="analysis-title">{{ item.title }}</h4>
                <div class="key-points">
                  <p><strong>关键点：</strong></p>
                  <ul>
                    <li v-for="(point, pointIndex) in item.key_points" :key="pointIndex">
                      {{ point }}
                    </li>
                  </ul>
                </div>
                <div class="implications">
                  <p><strong>含义与影响：</strong></p>
                  <p>{{ item.implications }}</p>
                </div>
                <el-divider v-if="index < state.analysisResult.analysis.length - 1" />
              </div>
              
              <h3 class="section-title mt-20">
                <el-icon><GoldMedal /></el-icon> 金价预测
              </h3>
              <el-divider />
              
              <div class="prediction">
                <div class="prediction-trend">
                  <el-tag
                    :type="getPredictionTagType(state.analysisResult.gold_price_prediction.trend)"
                    size="large"
                    effect="dark"
                  >
                    预测：金价{{ getTrendText(state.analysisResult.gold_price_prediction.trend) }}
                  </el-tag>
                  <el-progress
                    :percentage="state.analysisResult.gold_price_prediction.confidence"
                    :status="getPredictionProgressStatus(state.analysisResult.gold_price_prediction.trend)"
                    :stroke-width="20"
                    class="confidence-progress"
                  >
                    <span>置信度: {{ state.analysisResult.gold_price_prediction.confidence }}%</span>
                  </el-progress>
                </div>
                
                <div class="prediction-reasoning mt-20">
                  <p><strong>预测理由：</strong></p>
                  <p>{{ state.analysisResult.gold_price_prediction.reasoning }}</p>
                </div>
                
                <div class="key-factors mt-20">
                  <p><strong>关键影响因素：</strong></p>
                  <el-tag
                    v-for="(factor, factorIndex) in state.analysisResult.gold_price_prediction.key_factors"
                    :key="factorIndex"
                    class="factor-tag"
                    effect="plain"
                  >
                    {{ factor }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加自定义新闻对话框 -->
    <el-dialog
      v-model="state.dialogs.addNews.visible"
      :title="state.dialogs.addNews.type === 'political' ? '添加时政新闻' : '添加金融新闻'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="state.dialogs.addNews.form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="state.dialogs.addNews.form.title" placeholder="请输入新闻标题"></el-input>
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="state.dialogs.addNews.form.source" placeholder="请输入新闻来源"></el-input>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="state.dialogs.addNews.form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入新闻内容"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.dialogs.addNews.visible = false">取消</el-button>
          <el-button type="primary" @click="addCustomNews" :disabled="!state.dialogs.addNews.form.title || !state.dialogs.addNews.form.content">
            添加
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入新闻对话框 -->
    <el-dialog
      v-model="state.dialogs.importNews.visible"
      title="导入新闻内容"
      width="500px"
      destroy-on-close
    >
      <el-form :model="state.dialogs.importNews.form" label-width="80px">
        <el-form-item label="导入方式">
          <el-radio-group v-model="state.dialogs.importNews.form.importType">
            <el-radio label="url">URL</el-radio>
            <el-radio label="text">文本</el-radio>
            <el-radio label="file">文件</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="state.dialogs.importNews.form.importType === 'url'" label="URL" required>
          <el-input v-model="state.dialogs.importNews.form.url" placeholder="请输入新闻URL"></el-input>
        </el-form-item>

        <el-form-item v-if="state.dialogs.importNews.form.importType === 'text'" label="内容" required>
          <el-input
            v-model="state.dialogs.importNews.form.content"
            type="textarea"
            :rows="8"
            placeholder="请粘贴新闻内容"
          ></el-input>
        </el-form-item>

        <el-form-item v-if="state.dialogs.importNews.form.importType === 'file'" label="文件" required>
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                请上传文本文件 (.txt)
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="标题" required>
          <el-input v-model="state.dialogs.importNews.form.title" placeholder="请输入新闻标题"></el-input>
        </el-form-item>

        <el-form-item label="类型" required>
          <el-radio-group v-model="state.dialogs.importNews.form.type">
            <el-radio label="political">时政</el-radio>
            <el-radio label="financial">金融</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.dialogs.importNews.visible = false">取消</el-button>
          <el-button type="primary" @click="importNews" :loading="state.loading.importNews">
            导入
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分析设置对话框 -->
    <el-dialog
      v-model="state.dialogs.analysisSettings.visible"
      title="分析设置"
      width="600px"
      destroy-on-close
    >
      <el-form :model="state.dialogs.analysisSettings.form" label-width="100px">
        <el-form-item label="分析目标">
          <el-select
            v-model="state.dialogs.analysisSettings.form.analysisTarget"
            placeholder="请选择分析目标"
            style="width: 100%"
          >
            <el-option label="金价走势预测" value="gold_price" />
            <el-option label="股市影响" value="stock_market" />
            <el-option label="经济政策分析" value="economic_policy" />
            <el-option label="地缘政治影响" value="geopolitical" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="state.dialogs.analysisSettings.form.analysisTarget === 'custom'" label="自定义目标">
          <el-input 
            v-model="state.dialogs.analysisSettings.form.customTarget" 
            placeholder="请输入自定义分析目标"
          ></el-input>
        </el-form-item>

        <el-form-item label="分析重点">
          <el-checkbox-group v-model="state.dialogs.analysisSettings.form.focusAreas">
            <el-checkbox label="经济因素">经济因素</el-checkbox>
            <el-checkbox label="政治因素">政治因素</el-checkbox>
            <el-checkbox label="国际关系">国际关系</el-checkbox>
            <el-checkbox label="市场情绪">市场情绪</el-checkbox>
            <el-checkbox label="技术面分析">技术面分析</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-radio-group v-model="state.dialogs.analysisSettings.form.timeFrame">
            <el-radio label="short">短期（1-7天）</el-radio>
            <el-radio label="medium">中期（1-3个月）</el-radio>
            <el-radio label="long">长期（3个月以上）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分析深度">
          <el-slider
            v-model="state.dialogs.analysisSettings.form.analysisDepth"
            :min="1"
            :max="5"
            :marks="{1: '简要', 3: '标准', 5: '深入'}"
            show-stops
          ></el-slider>
        </el-form-item>

        <el-form-item label="附加说明">
          <el-input
            v-model="state.dialogs.analysisSettings.form.additionalNotes"
            type="textarea"
            :rows="4"
            placeholder="请输入任何其他分析要求或说明"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.dialogs.analysisSettings.visible = false">取消</el-button>
          <el-button type="primary" @click="saveAnalysisSettings">
            保存设置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useStore } from '../store';
import { ElMessage } from 'element-plus';
import { 
  Document, Money, Star, Delete, DataAnalysis, 
  Download, TrendCharts, Reading, GoldMedal, Refresh, Plus, Upload, Setting, View
} from '@element-plus/icons-vue';
import axios from 'axios';

const store = useStore();
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '');

// 状态管理
const state = reactive({
  politicalNews: [],
  financialNews: [],
  selectedNews: [],
  analysisResult: null,
  error: null,
  loading: {
    politicalNews: false,
    financialNews: false,
    newsContent: false,
    analysis: false,
    importNews: false
  },
  analysisProgress: {
    percentage: 0,
    message: '',
    status: '',
    streamContent: ''
  },
  dialogs: {
    addNews: {
      visible: false,
      type: 'political', // 'political' 或 'financial'
      form: {
        title: '',
        source: '',
        content: ''
      }
    },
    importNews: {
      visible: false,
      form: {
        importType: 'url', // 'url', 'text', 或 'file'
        url: '',
        content: '',
        title: '',
        type: 'political', // 'political' 或 'financial'
        file: null
      }
    },
    analysisSettings: {
      visible: false,
      form: {
        analysisTarget: 'gold_price',
        customTarget: '',
        focusAreas: ['经济因素', '政治因素'],
        timeFrame: 'medium',
        analysisDepth: 3,
        additionalNotes: ''
      },
      saved: false
    }
  },
  showRawResponse: false
});

// 计算属性：是否正在加载
const loading = computed(() => {
  return state.loading.politicalNews || 
         state.loading.financialNews || 
         state.loading.newsContent || 
         state.loading.analysis ||
         state.loading.importNews;
});

// 保存API密钥
const saveApiKey = () => {
  if (!apiKey.value) {
    ElMessage.warning('请输入API密钥');
    return;
  }
  
  store.setApiKey(apiKey.value);
  ElMessage.success('API密钥已保存');
};

// 获取新闻
const fetchPoliticalNews = async () => {
  try {
    state.loading.politicalNews = true;
    
    // 监听部分更新事件
    const handlePartialUpdate = (event) => {
      const { source, news } = event.detail;
      console.log(`收到来自 ${source} 的 ${news.length} 条时政新闻`);
      
      // 更新新闻列表，避免重复
      const newsList = [...state.politicalNews];
      news.forEach(item => {
        if (!newsList.some(existing => existing.id === item.id)) {
          newsList.push(item);
        }
      });
      
      state.politicalNews = newsList;
    };
    
    // 添加事件监听器
    window.addEventListener('news-partial-update', handlePartialUpdate);
    
    // 获取新闻
    await store.fetchPoliticalNews();
    
    // 移除事件监听器
    window.removeEventListener('news-partial-update', handlePartialUpdate);
    
    // 确保从store中获取最新数据
    state.politicalNews = [...store.state.politicalNews];
    
    if (store.state.error) {
      ElMessage.error(store.state.error);
    }
  } catch (error) {
    ElMessage.error(`获取时政新闻失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    state.loading.politicalNews = false;
  }
};

const fetchFinancialNews = async () => {
  try {
    state.loading.financialNews = true;
    
    // 监听部分更新事件
    const handlePartialUpdate = (event) => {
      const { source, news } = event.detail;
      console.log(`收到来自 ${source} 的 ${news.length} 条金融新闻`);
      
      // 更新新闻列表，避免重复
      const newsList = [...state.financialNews];
      news.forEach(item => {
        if (!newsList.some(existing => existing.id === item.id)) {
          newsList.push(item);
        }
      });
      
      state.financialNews = newsList;
    };
    
    // 添加事件监听器
    window.addEventListener('news-partial-update', handlePartialUpdate);
    
    // 获取新闻
    await store.fetchFinancialNews();
    
    // 移除事件监听器
    window.removeEventListener('news-partial-update', handlePartialUpdate);
    
    // 确保从store中获取最新数据
    state.financialNews = [...store.state.financialNews];
    
    if (store.state.error) {
      ElMessage.error(store.state.error);
    }
  } catch (error) {
    ElMessage.error(`获取金融新闻失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    state.loading.financialNews = false;
  }
};

// 加载新闻内容
const loadNewsContent = async (news) => {
  try {
    state.loading.newsContent = true;
    
    // 调用store的fetchNewsContent方法获取内容
    await store.fetchNewsContent(news);
    
    // 从store中获取更新后的新闻对象
    const updatedNews = news.type === 'political' 
      ? store.state.politicalNews.find(item => item.id === news.id)
      : store.state.financialNews.find(item => item.id === news.id);
    
    // 更新选中的新闻列表
    if (updatedNews && updatedNews.content) {
      const index = state.selectedNews.findIndex(item => item.id === news.id && item.type === news.type);
      if (index !== -1) {
        state.selectedNews[index] = { ...state.selectedNews[index], content: updatedNews.content };
      }
      console.log('新闻内容已更新:', updatedNews.content.substring(0, 100) + '...');
    } else {
      console.warn('未能获取到更新后的新闻内容');
      ElMessage.warning('获取新闻内容失败，请重试');
    }
    
    if (store.state.error) {
      ElMessage.error(store.state.error);
    }
  } catch (error) {
    ElMessage.error(`获取新闻内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    state.loading.newsContent = false;
  }
};

// 选择/取消选择新闻
const toggleSelectNews = (news) => {
  store.toggleSelectNews(news);
  // 更新本地状态
  state.selectedNews = [...store.state.selectedNews];
};

// 检查新闻是否已选择
const isSelected = (news) => {
  return state.selectedNews.some(item => 
    item.id === news.id && item.type === news.type
  );
};

// 清空已选择的新闻
const clearSelectedNews = () => {
  store.clearSelectedNews();
  // 更新本地状态
  state.selectedNews = [];
};

// 分析新闻
const analyzeNews = async () => {
  if (!apiKey.value) {
    ElMessage.warning('请先设置API密钥');
    return;
  }
  
  // 如果没有保存过分析设置，使用默认设置
  if (!state.dialogs.analysisSettings.saved) {
    const defaultSettings = {
      analysisTarget: 'gold_price',
      focusAreas: ['经济因素', '政治因素'],
      timeFrame: 'medium',
      analysisDepth: 3,
      additionalNotes: ''
    };
    
    // 将默认设置应用到store中
    store.setAnalysisSettings(defaultSettings);
  } else {
    // 获取用户设置的分析目标
    const settings = { ...state.dialogs.analysisSettings.form };
    
    // 如果是自定义目标，使用自定义目标文本
    if (settings.analysisTarget === 'custom') {
      settings.analysisTarget = settings.customTarget;
    }
    
    // 将设置应用到store中
    store.setAnalysisSettings(settings);
  }
  
  // 重置分析进度
  state.analysisProgress = {
    percentage: 0,
    message: '准备分析...',
    status: '',
    streamContent: ''
  };
  
  // 设置加载状态
  state.loading.analysis = true;
  
  try {
    // 使用流式响应进行分析
    const result = await store.analyzeNewsWithProgress(
      (progress) => {
        // 更新进度信息
        state.analysisProgress.message = progress.message || '分析中...';
        state.analysisProgress.percentage = progress.percentage || 
          Math.min(state.analysisProgress.percentage + 5, 95);
        
        // 如果有流式内容，则更新
        if (progress.content) {
          state.analysisProgress.streamContent += progress.content;
        }
        
        // 根据进度设置状态
        if (state.analysisProgress.percentage < 30) {
          state.analysisProgress.status = '';
        } else if (state.analysisProgress.percentage < 70) {
          state.analysisProgress.status = 'warning';
        } else {
          state.analysisProgress.status = 'success';
        }
      }
    );
    
    // 更新分析结果
    state.analysisResult = store.state.analysisResult;
    
    if (store.state.error) {
      ElMessage.error(store.state.error);
      state.analysisProgress.status = 'exception';
      state.analysisProgress.message = `分析失败: ${store.state.error}`;
    } else if (state.analysisResult) {
      ElMessage.success('分析完成');
      state.analysisProgress.percentage = 100;
      state.analysisProgress.status = 'success';
      state.analysisProgress.message = '分析完成';
    } else {
      ElMessage.error('未能获取分析结果');
      state.analysisProgress.status = 'exception';
      state.analysisProgress.message = '分析失败: 未能获取结果';
    }
  } catch (error) {
    console.error('分析失败:', error);
    ElMessage.error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    state.analysisProgress.status = 'exception';
    state.analysisProgress.message = `分析失败: ${error instanceof Error ? error.message : '未知错误'}`;
    state.analysisProgress.percentage = 100;
  } finally {
    // 延迟关闭加载状态，让用户看到100%的进度
    setTimeout(() => {
      state.loading.analysis = false;
    }, 1000);
  }
};

// 获取预测标签类型
const getPredictionTagType = (trend) => {
  switch (trend.toLowerCase()) {
    case '上涨':
      return 'success';
    case '下跌':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取预测进度条状态
const getPredictionProgressStatus = (trend) => {
  switch (trend.toLowerCase()) {
    case '上涨':
      return 'success';
    case '下跌':
      return 'exception';
    default:
      return '';
  }
};

// 获取趋势文本
const getTrendText = (trend) => {
  switch (trend.toLowerCase()) {
    case '上涨':
      return '上涨';
    case '下跌':
      return '下跌';
    default:
      return '稳定';
  }
};

// 显示添加新闻对话框
function showAddNewsDialog(type) {
  state.dialogs.addNews.type = type;
  state.dialogs.addNews.form.title = '';
  state.dialogs.addNews.form.source = '';
  state.dialogs.addNews.form.content = '';
  state.dialogs.addNews.visible = true;
}

// 显示导入新闻对话框
function showImportNewsDialog() {
  state.dialogs.importNews.form.importType = 'url';
  state.dialogs.importNews.form.url = '';
  state.dialogs.importNews.form.content = '';
  state.dialogs.importNews.form.title = '';
  state.dialogs.importNews.form.type = 'political';
  state.dialogs.importNews.form.file = null;
  state.dialogs.importNews.visible = true;
}

// 添加自定义新闻
function addCustomNews() {
  const { title, source, content } = state.dialogs.addNews.form;
  const type = state.dialogs.addNews.type;
  
  if (!title || !content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  
  const newNews = {
    id: `custom-${Date.now()}`,
    title,
    source: source || '自定义来源',
    content,
    time: new Date().toLocaleString(),
    type,
    isCustom: true
  };
  
  if (type === 'political') {
    state.politicalNews.unshift(newNews);
    ElMessage.success('已添加到时政新闻');
  } else {
    state.financialNews.unshift(newNews);
    ElMessage.success('已添加到金融新闻');
  }
  
  state.dialogs.addNews.visible = false;
}

// 处理文件上传
function handleFileChange(file) {
  state.dialogs.importNews.form.file = file.raw;
}

// 读取文件内容
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

// 导入新闻
async function importNews() {
  try {
    const form = state.dialogs.importNews.form;
    
    if (!form.title) {
      ElMessage.warning('请填写新闻标题');
      return;
    }
    
    state.loading.importNews = true;
    let content = '';
    
    if (form.importType === 'url') {
      if (!form.url) {
        ElMessage.warning('请输入URL');
        return;
      }
      
      try {
        // 通过代理服务器获取URL内容，使用GET请求
        const response = await axios.get('/api/content', { 
          params: { url: form.url }
        });
        content = response.data.content;
      } catch (error) {
        ElMessage.error('获取URL内容失败: ' + error.message);
        state.loading.importNews = false;
        return;
      }
    } else if (form.importType === 'text') {
      if (!form.content) {
        ElMessage.warning('请输入内容');
        return;
      }
      content = form.content;
    } else if (form.importType === 'file') {
      if (!form.file) {
        ElMessage.warning('请选择文件');
        return;
      }
      
      try {
        content = await readFileContent(form.file);
      } catch (error) {
        ElMessage.error('读取文件失败: ' + error.message);
        state.loading.importNews = false;
        return;
      }
    }
    
    const newNews = {
      id: `import-${Date.now()}`,
      title: form.title,
      source: '导入内容',
      content,
      time: new Date().toLocaleString(),
      type: form.type,
      isCustom: true
    };
    
    if (form.type === 'political') {
      state.politicalNews.unshift(newNews);
      ElMessage.success('已导入到时政新闻');
    } else {
      state.financialNews.unshift(newNews);
      ElMessage.success('已导入到金融新闻');
    }
    
    state.dialogs.importNews.visible = false;
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message);
  } finally {
    state.loading.importNews = false;
  }
}

// 显示分析设置对话框
function showAnalysisSettingsDialog() {
  state.dialogs.analysisSettings.visible = true;
}

// 保存分析设置
function saveAnalysisSettings() {
  const form = state.dialogs.analysisSettings.form;
  
  // 验证自定义目标
  if (form.analysisTarget === 'custom' && !form.customTarget) {
    ElMessage.warning('请输入自定义分析目标');
    return;
  }
  
  // 验证至少选择一个分析重点
  if (form.focusAreas.length === 0) {
    ElMessage.warning('请至少选择一个分析重点');
    return;
  }
  
  state.dialogs.analysisSettings.saved = true;
  state.dialogs.analysisSettings.visible = false;
  
  ElMessage.success('分析设置已保存');
}

// 切换原始回复显示状态
function toggleRawResponse() {
  state.showRawResponse = !state.showRawResponse;
}

// 页面加载时获取新闻
onMounted(async () => {
  try {
    // 初始化状态
    state.selectedNews = [...store.state.selectedNews];
    state.analysisResult = store.state.analysisResult;
    state.error = store.state.error;
    
    // 获取新闻
    await Promise.all([
      fetchPoliticalNews(),
      fetchFinancialNews()
    ]);
    
    console.log('新闻加载完成', {
      politicalNews: state.politicalNews.length,
      financialNews: state.financialNews.length
    });
  } catch (error) {
    ElMessage.error(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
});
</script>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.card-title .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.api-key-card {
  margin-bottom: 20px;
}

.api-key-container {
  display: flex;
  align-items: center;
}

.api-key-label {
  white-space: nowrap;
  padding: 0 12px;
  font-weight: bold;
}

.news-card, .selected-news-card, .analysis-card {
  height: 100%;
  transition: all 0.3s;
}

.news-card:hover, .selected-news-card:hover, .analysis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.news-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.news-item {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.news-item:hover {
  background-color: #f0f0f0;
  border-left-color: #409eff;
}

.news-item.selected {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.news-title {
  font-weight: bold;
  margin-bottom: 8px;
  line-height: 1.4;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.selected-news-list {
  margin-top: 10px;
}

.news-content-container {
  padding: 10px;
}

.news-content {
  white-space: pre-line;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.loading-container, .empty-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.analysis-result {
  padding: 10px;
}

.need-more-info {
  margin-bottom: 20px;
}

.missing-info ul {
  margin-top: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  color: #409eff;
}

.section-title .el-icon {
  margin-right: 8px;
  font-size: 24px;
}

.analysis-title {
  color: #303133;
  margin-bottom: 15px;
}

.key-points ul {
  padding-left: 20px;
}

.key-points li {
  margin-bottom: 8px;
}

.implications {
  margin-top: 15px;
}

.prediction-trend {
  display: flex;
  align-items: center;
  gap: 20px;
}

.confidence-progress {
  flex: 1;
}

.factor-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .home-container {
    padding: 0 10px;
  }
  
  .news-list {
    max-height: 300px;
  }
  
  .prediction-trend {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .confidence-progress {
    width: 100%;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.upload-demo {
  width: 100%;
}

.stream-loading {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stream-message {
  text-align: center;
  font-size: 14px;
  color: #606266;
  margin-top: 10px;
}

.stream-content {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.raw-response {
  margin-bottom: 20px;
}

.raw-response-content {
  margin-top: 10px;
}

.raw-response-content pre {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin: 10px 0;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
}

.error-message {
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
}
</style> 