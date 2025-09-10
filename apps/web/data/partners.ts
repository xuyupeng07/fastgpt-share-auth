export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: 'technology' | 'enterprise' | 'education' | 'startup';
  featured: boolean;
}

// 简化的合作伙伴接口，用于轮播图显示
export interface SimplePartner {
  id: string;
  logo: string;
}

// 简化的合作伙伴数据，用于轮播图显示
export const simplePartners: SimplePartner[] = [
  { id: '1', logo: '/logos/openai-logo.svg' },
  { id: '2', logo: '/logos/anthropic.svg' },
  { id: '3', logo: '/logos/claude-color.svg' },
  { id: '4', logo: '/logos/gemini-color.svg' },
  { id: '5', logo: '/logos/deepseek-color.svg' },
  { id: '6', logo: '/logos/doubao-color.svg' },
  { id: '7', logo: '/logos/kimi-color.svg' },
  { id: '8', logo: '/logos/moonshot.svg' },
  { id: '9', logo: '/logos/zhipu-color.svg' },
  { id: '10', logo: '/logos/hunyuan-color.svg' },
  { id: '11', logo: '/logos/minimax-color.svg' },
  { id: '12', logo: '/logos/siliconcloud-color.svg' },
  { id: '13', logo: '/logos/qwen-color.svg' },
  { id: '14', logo: '/logos/wenxin-color.svg' },
  { id: '15', logo: '/logos/grok.svg' },
  { id: '16', logo: '/logos/internlm.svg' },
  { id: '17', logo: '/logos/baai.svg' },
  { id: '18', logo: '/logos/kling-color.svg' },
  { id: '19', logo: '/logos/flux.svg' },
  { id: '20', logo: '/logos/stability-color.svg' },
  { id: '21', logo: '/logos/ollama.svg' },
  { id: '22', logo: '/logos/xinference-color.svg' },
  { id: '23', logo: '/logos/mcp.svg' },
  { id: '24', logo: '/logos/jina.svg' },
  { id: '25', logo: '/logos/searchapi.svg' },
  { id: '26', logo: '/logos/doc2x-color.svg' },
  { id: '27', logo: '/logos/bocha.png' },
  { id: '28', logo: '/logos/alibabacloud-color.svg' },
  { id: '29', logo: '/logos/tencentcloud-color.svg' },
  { id: '30', logo: '/logos/MongoDB.svg' },
  { id: '31', logo: '/logos/MySQL.svg' },
  { id: '32', logo: '/logos/OceanBase.svg' },
  { id: '33', logo: '/logos/redis.svg' },
  { id: '34', logo: '/logos/github.svg' },
  { id: '35', logo: '/logos/arxiv_.png' },
  { id: '36', logo: '/logos/飞书.svg' },
  { id: '37', logo: '/logos/钉钉.svg' },
  { id: '38', logo: '/logos/企业微信.svg' }
];

// 完整的合作伙伴数据
export const partners: Partner[] = [
  // AI模型提供商
  {
    id: '1',
    name: 'OpenAI',
    logo: '/logos/openai-logo.svg',
    description: '人工智能研究公司，提供GPT系列模型',
    website: 'https://openai.com',
    category: 'technology',
    featured: true
  },
  {
    id: '2',
    name: 'Anthropic',
    logo: '/logos/anthropic.svg',
    description: 'AI安全公司，Claude模型的开发者',
    website: 'https://www.anthropic.com',
    category: 'technology',
    featured: true
  },
  {
    id: '3',
    name: 'Claude',
    logo: '/logos/claude-color.svg',
    description: 'Anthropic开发的AI助手，专注于安全和有用性',
    website: 'https://claude.ai',
    category: 'technology',
    featured: true
  },
  {
    id: '4',
    name: 'Google Gemini',
    logo: '/logos/gemini-color.svg',
    description: 'Google最新的多模态AI模型',
    website: 'https://gemini.google.com',
    category: 'technology',
    featured: true
  },
  {
    id: '5',
    name: 'DeepSeek',
    logo: '/logos/deepseek-color.svg',
    description: '专注于AGI的AI公司，提供强大的推理能力',
    website: 'https://www.deepseek.com',
    category: 'technology',
    featured: false
  },
  {
    id: '6',
    name: '豆包',
    logo: '/logos/doubao-color.svg',
    description: '字节跳动推出的AI助手',
    website: 'https://www.doubao.com',
    category: 'technology',
    featured: false
  },
  {
    id: '7',
    name: 'Kimi',
    logo: '/logos/kimi-color.svg',
    description: 'Moonshot AI推出的智能助手',
    website: 'https://kimi.moonshot.cn',
    category: 'technology',
    featured: false
  },
  {
    id: '8',
    name: 'Moonshot',
    logo: '/logos/moonshot.svg',
    description: '月之暗面科技的大模型服务',
    website: 'https://www.moonshot.cn',
    category: 'technology',
    featured: false
  },
  {
    id: '9',
    name: '智谱AI',
    logo: '/logos/zhipu-color.svg',
    description: '清华系AI公司，提供GLM系列模型',
    website: 'https://www.zhipuai.cn',
    category: 'technology',
    featured: false
  },
  {
    id: '10',
    name: '混元',
    logo: '/logos/hunyuan-color.svg',
    description: '腾讯自研的大语言模型',
    website: 'https://hunyuan.tencent.com',
    category: 'technology',
    featured: false
  },
  {
    id: '11',
    name: 'MiniMax',
    logo: '/logos/minimax-color.svg',
    description: '专注于通用人工智能的公司',
    website: 'https://www.minimax.chat',
    category: 'technology',
    featured: false
  },
  {
    id: '12',
    name: 'SiliconCloud',
    logo: '/logos/siliconcloud-color.svg',
    description: '硅基流动的AI云服务平台',
    website: 'https://siliconflow.cn',
    category: 'technology',
    featured: false
  },
  {
    id: '13',
    name: 'Qwen',
    logo: '/logos/qwen-color.svg',
    description: '阿里云推出的通义千问大模型',
    website: 'https://tongyi.aliyun.com',
    category: 'technology',
    featured: false
  },
  {
    id: '14',
    name: '文心一言',
    logo: '/logos/wenxin-color.svg',
    description: '百度推出的知识增强大语言模型',
    website: 'https://yiyan.baidu.com',
    category: 'technology',
    featured: false
  },
  {
    id: '15',
    name: 'Grok',
    logo: '/logos/grok.svg',
    description: 'xAI开发的AI助手',
    website: 'https://grok.x.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '16',
    name: 'InternLM',
    logo: '/logos/internlm.svg',
    description: '上海AI实验室的开源大语言模型',
    website: 'https://internlm.intern-ai.org.cn',
    category: 'technology',
    featured: false
  },
  {
    id: '17',
    name: 'BAAI',
    logo: '/logos/baai.svg',
    description: '北京智源人工智能研究院',
    website: 'https://www.baai.ac.cn',
    category: 'education',
    featured: false
  },
  {
    id: '18',
    name: 'Kling AI',
    logo: '/logos/kling-color.svg',
    description: '快手推出的AI视频生成工具',
    website: 'https://kling.kuaishou.com',
    category: 'technology',
    featured: false
  },
  {
    id: '19',
    name: 'Flux',
    logo: '/logos/flux.svg',
    description: 'Black Forest Labs的AI图像生成模型',
    website: 'https://blackforestlabs.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '20',
    name: 'Stability AI',
    logo: '/logos/stability-color.svg',
    description: 'Stable Diffusion等AI图像生成模型的开发者',
    website: 'https://stability.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '21',
    name: 'Ollama',
    logo: '/logos/ollama.svg',
    description: '本地运行大语言模型的工具',
    website: 'https://ollama.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '22',
    name: 'Xinference',
    logo: '/logos/xinference-color.svg',
    description: '开源的大模型推理框架',
    website: 'https://github.com/xorbitsai/inference',
    category: 'technology',
    featured: false
  },
  {
    id: '23',
    name: 'MCP',
    logo: '/logos/mcp.svg',
    description: 'Model Context Protocol协议',
    website: 'https://modelcontextprotocol.io',
    category: 'technology',
    featured: false
  },
  {
    id: '24',
    name: 'Jina AI',
    logo: '/logos/jina.svg',
    description: '神经搜索和多模态AI解决方案',
    website: 'https://jina.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '25',
    name: 'SearchAPI',
    logo: '/logos/searchapi.svg',
    description: '实时搜索API服务',
    website: 'https://www.searchapi.io',
    category: 'technology',
    featured: false
  },
  {
    id: '26',
    name: 'Doc2X',
    logo: '/logos/doc2x-color.svg',
    description: '文档解析和转换AI工具',
    website: 'https://doc2x.noedgeai.com',
    category: 'technology',
    featured: false
  },
  {
    id: '27',
    name: '博查AI',
    logo: '/logos/bocha.png',
    description: 'AI驱动的智能对话平台',
    website: 'https://bocha.ai',
    category: 'technology',
    featured: false
  },
  {
    id: '28',
    name: '阿里云',
    logo: '/logos/alibabacloud-color.svg',
    description: '领先的云计算和人工智能服务提供商',
    website: 'https://www.aliyun.com',
    category: 'technology',
    featured: true
  },
  {
    id: '29',
    name: '腾讯云',
    logo: '/logos/tencentcloud-color.svg',
    description: '全面的云服务和AI解决方案',
    website: 'https://cloud.tencent.com',
    category: 'technology',
    featured: false
  },
  {
    id: '30',
    name: 'MongoDB',
    logo: '/logos/MongoDB.svg',
    description: '领先的NoSQL数据库解决方案',
    website: 'https://www.mongodb.com',
    category: 'technology',
    featured: false
  },
  {
    id: '31',
    name: 'MySQL',
    logo: '/logos/MySQL.svg',
    description: '世界上最流行的开源关系型数据库',
    website: 'https://www.mysql.com',
    category: 'technology',
    featured: false
  },
  {
    id: '32',
    name: 'OceanBase',
    logo: '/logos/OceanBase.svg',
    description: '蚂蚁集团自研的分布式关系数据库',
    website: 'https://www.oceanbase.com',
    category: 'technology',
    featured: false
  },
  {
    id: '33',
    name: 'Redis',
    logo: '/logos/redis.svg',
    description: '高性能的内存数据结构存储系统',
    website: 'https://redis.io',
    category: 'technology',
    featured: false
  },
  {
    id: '34',
    name: 'GitHub',
    logo: '/logos/github.svg',
    description: '全球最大的代码托管平台',
    website: 'https://github.com',
    category: 'technology',
    featured: false
  },
  {
    id: '35',
    name: 'arXiv',
    logo: '/logos/arxiv_.png',
    description: '学术论文预印本服务器',
    website: 'https://arxiv.org',
    category: 'education',
    featured: false
  },
  {
    id: '36',
    name: '飞书',
    logo: '/logos/飞书.svg',
    description: '字节跳动旗下的企业协作平台',
    website: 'https://www.feishu.cn',
    category: 'enterprise',
    featured: false
  },
  {
    id: '37',
    name: '钉钉',
    logo: '/logos/钉钉.svg',
    description: '阿里巴巴推出的企业级智能移动办公平台',
    website: 'https://www.dingtalk.com',
    category: 'enterprise',
    featured: false
  },
  {
    id: '38',
    name: '企业微信',
    logo: '/logos/企业微信.svg',
    description: '腾讯推出的企业通讯与办公工具',
    website: 'https://work.weixin.qq.com',
    category: 'enterprise',
    featured: false
  }
];

// 分类图标映射
export const categoryIcons = {
  technology: 'Zap',
  enterprise: 'Award', 
  education: 'Users',
  startup: 'ExternalLink'
};

// 分类标签
export const categoryLabels = {
  technology: '技术创新',
  enterprise: '企业服务',
  education: '教育培训', 
  startup: '创业公司'
};