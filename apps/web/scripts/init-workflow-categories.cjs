// 初始化工作流分类数据脚本
const mongoose = require('mongoose');

// 工作流分类Schema
const WorkflowCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sort_order: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const WorkflowCategoryModel = mongoose.models.WorkflowCategory || mongoose.model('WorkflowCategory', WorkflowCategorySchema);

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';

// 默认分类数据
const defaultCategories = [
  {
    name: '客服助手',
    description: '客户服务相关的工作流，包括问答、投诉处理等',
    sort_order: 1,
    status: 'active'
  },
  {
    name: '办公助手',
    description: '办公自动化相关的工作流，包括文档处理、数据分析等',
    sort_order: 2,
    status: 'active'
  },
  {
    name: '编程助手',
    description: '编程开发相关的工作流，包括代码生成、调试等',
    sort_order: 3,
    status: 'active'
  },
  {
    name: '学习助手',
    description: '学习教育相关的工作流，包括知识问答、学习计划等',
    sort_order: 4,
    status: 'active'
  },
  {
    name: '生活助手',
    description: '日常生活相关的工作流，包括健康管理、生活建议等',
    sort_order: 5,
    status: 'active'
  },
  {
    name: '创作助手',
    description: '创意创作相关的工作流，包括文案写作、设计灵感等',
    sort_order: 6,
    status: 'active'
  },
  {
    name: '其他',
    description: '其他类型的工作流',
    sort_order: 99,
    status: 'active'
  }
];

async function initWorkflowCategories() {
  try {
    console.log('开始连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 检查是否已经有分类数据
    const existingCategories = await WorkflowCategoryModel.find({});
    console.log(`当前数据库中有 ${existingCategories.length} 个分类`);

    if (existingCategories.length > 0) {
      console.log('\n现有分类:');
      existingCategories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (排序: ${category.sort_order}, 状态: ${category.status})`);
      });
      
      console.log('\n分类数据已存在，跳过初始化');
      return;
    }

    // 批量插入默认分类
    console.log('\n开始插入默认分类数据...');
    const insertedCategories = await WorkflowCategoryModel.insertMany(defaultCategories);
    
    console.log(`成功插入 ${insertedCategories.length} 个分类:`);
    insertedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   ID: ${category._id}`);
      console.log(`   描述: ${category.description}`);
      console.log(`   排序: ${category.sort_order}`);
      console.log(`   状态: ${category.status}`);
      console.log(`   创建时间: ${category.created_at}`);
      console.log('---');
    });

    // 验证插入结果
    const totalCategories = await WorkflowCategoryModel.countDocuments({});
    console.log(`\n验证: 数据库中现在共有 ${totalCategories} 个分类`);

  } catch (error) {
    console.error('初始化分类数据失败:', error);
    
    // 如果是重复键错误，显示详细信息
    if (error.code === 11000) {
      console.error('错误原因: 分类名称重复');
      console.error('重复的字段:', error.keyValue);
    }
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 执行初始化
if (require.main === module) {
  initWorkflowCategories().then(() => {
    console.log('\n分类初始化脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('分类初始化脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { initWorkflowCategories, defaultCategories };