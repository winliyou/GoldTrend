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
              <el-button type="primary" @click="fetchPoliticalNews" :loading="state.loading.politicalNews">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
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
              <el-button type="primary" @click="fetchFinancialNews" :loading="state.loading.financialNews">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
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
                <el-button type="danger" @click="clearSelectedNews" :disabled="state.selectedNews.length === 0">
                  <el-icon><Delete /></el-icon> 清空
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
            </div>
          </template>
          <div v-if="state.loading.analysis" class="loading-container">
            <el-skeleton :rows="10" animated />
          </div>
          <div v-else-if="!state.analysisResult" class="empty-container">
            <el-empty description="暂无分析结果" />
          </div>
          <div v-else class="analysis-result">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from '../store';
import { ElMessage } from 'element-plus';
import { 
  Document, Money, Star, Delete, DataAnalysis, 
  Download, TrendCharts, Reading, GoldMedal, Refresh 
} from '@element-plus/icons-vue';

const store = useStore();
const { state } = store;

// API密钥
const apiKey = ref(state.apiKey);
const loading = computed(() => {
  return state.loading.politicalNews || 
         state.loading.financialNews || 
         state.loading.newsContent || 
         state.loading.analysis;
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
  await store.fetchPoliticalNews();
  if (state.error) {
    ElMessage.error(state.error);
  }
};

const fetchFinancialNews = async () => {
  await store.fetchFinancialNews();
  if (state.error) {
    ElMessage.error(state.error);
  }
};

// 加载新闻内容
const loadNewsContent = async (news) => {
  await store.fetchNewsContent(news);
  if (state.error) {
    ElMessage.error(state.error);
  }
};

// 选择/取消选择新闻
const toggleSelectNews = (news) => {
  store.toggleSelectNews(news);
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
};

// 分析新闻
const analyzeNews = async () => {
  if (!apiKey.value) {
    ElMessage.warning('请先设置API密钥');
    return;
  }
  
  await store.analyzeNews();
  if (state.error) {
    ElMessage.error(state.error);
  } else if (state.analysisResult) {
    ElMessage.success('分析完成');
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

// 页面加载时获取新闻
onMounted(async () => {
  await Promise.all([
    fetchPoliticalNews(),
    fetchFinancialNews()
  ]);
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
</style> 