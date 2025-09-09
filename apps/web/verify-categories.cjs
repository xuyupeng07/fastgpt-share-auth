// 验证工作流分类数据完整性
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

// 工作流Schema
const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  no_login_url: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowCategory',
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const WorkflowModel = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';

async function verifyCategories() {
  try {
    console.log('开始连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 1. 验证分类数据
    console.log('\n=== 验证工作流分类数据 ===');
    const categories = await WorkflowCategoryModel.find({}).sort({ sort_order: 1 });
    console.log(`找到 ${categories.length} 个分类:`);
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   ID: ${category._id}`);
      console.log(`   描述: ${category.description || '无'}`);
      console.log(`   排序: ${category.sort_order}`);
      console.log(`   状态: ${category.status}`);
      console.log(`   创建时间: ${category.created_at}`);
      console.log('---');
    });

    // 2. 验证工作流数据
    console.log('\n=== 验证工作流数据 ===');
    const workflows = await WorkflowModel.find({}).populate('category_id');
    console.log(`找到 ${workflows.length} 个工作流:`);
    
    if (workflows.length > 0) {
      workflows.forEach((workflow, index) => {
        console.log(`${index + 1}. ${workflow.name}`);
        console.log(`   ID: ${workflow._id}`);
        console.log(`   分类ID: ${workflow.category_id || '未分类'}`);
        console.log(`   分类名称: ${workflow.category_id ? workflow.category_id.name : '未分类'}`);
        console.log(`   状态: ${workflow.status}`);
        console.log(`   使用量: ${workflow.usageCount}`);
        console.log(`   点赞数: ${workflow.likeCount}`);
        console.log('---');
      });
    } else {
      console.log('暂无工作流数据');
    }

    // 3. 统计信息
    console.log('\n=== 统计信息 ===');
    const activeCategories = await WorkflowCategoryModel.countDocuments({ status: 'active' });
    const inactiveCategories = await WorkflowCategoryModel.countDocuments({ status: 'inactive' });
    const activeWorkflows = await WorkflowModel.countDocuments({ status: 'active' });
    const inactiveWorkflows = await WorkflowModel.countDocuments({ status: 'inactive' });
    const categorizedWorkflows = await WorkflowModel.countDocuments({ category_id: { $exists: true, $ne: null } });
    const uncategorizedWorkflows = await WorkflowModel.countDocuments({ $or: [{ category_id: { $exists: false } }, { category_id: null }] });
    
    console.log(`活跃分类: ${activeCategories} 个`);
    console.log(`非活跃分类: ${inactiveCategories} 个`);
    console.log(`活跃工作流: ${activeWorkflows} 个`);
    console.log(`非活跃工作流: ${inactiveWorkflows} 个`);
    console.log(`已分类工作流: ${categorizedWorkflows} 个`);
    console.log(`未分类工作流: ${uncategorizedWorkflows} 个`);

    // 4. 数据完整性检查
    console.log('\n=== 数据完整性检查 ===');
    const issues = [];
    
    // 检查是否有重复的分类名称
    const duplicateNames = await WorkflowCategoryModel.aggregate([
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateNames.length > 0) {
      issues.push(`发现重复的分类名称: ${duplicateNames.map(d => d._id).join(', ')}`);
    }
    
    // 检查是否有无效的分类引用
    const invalidCategoryRefs = await WorkflowModel.find({
      category_id: { $exists: true, $ne: null }
    }).populate('category_id');
    
    const invalidRefs = invalidCategoryRefs.filter(w => !w.category_id);
    if (invalidRefs.length > 0) {
      issues.push(`发现 ${invalidRefs.length} 个工作流有无效的分类引用`);
    }
    
    if (issues.length === 0) {
      console.log('✅ 数据完整性检查通过，没有发现问题');
    } else {
      console.log('❌ 发现以下问题:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB连接已关闭');
  }
}

// 执行验证
if (require.main === module) {
  verifyCategories().then(() => {
    console.log('\n分类数据验证完成');
    process.exit(0);
  }).catch(error => {
    console.error('分类数据验证失败:', error);
    process.exit(1);
  });
}

module.exports = { verifyCategories };