// 为现有工作流分配分类
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

// 工作流名称到分类的映射规则
const categoryMappings = {
  '智能客服助手': '客服助手',
  '代码审查助手': '编程助手',
  '文档生成器': '办公助手',
  '学习计划制定': '学习助手',
  '创意写作助手': '创作助手',
  '数据分析助手': '办公助手',
  '000': '其他' // 默认分类
};

async function assignWorkflowCategories() {
  try {
    console.log('开始连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 1. 获取所有分类
    const categories = await WorkflowCategoryModel.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    console.log('\n可用分类:');
    Object.keys(categoryMap).forEach(name => {
      console.log(`- ${name}: ${categoryMap[name]}`);
    });

    // 2. 获取所有未分类的工作流
    const uncategorizedWorkflows = await WorkflowModel.find({
      $or: [
        { category_id: { $exists: false } },
        { category_id: null }
      ]
    });
    
    console.log(`\n找到 ${uncategorizedWorkflows.length} 个未分类的工作流`);
    
    if (uncategorizedWorkflows.length === 0) {
      console.log('所有工作流都已分类');
      return;
    }

    // 3. 为工作流分配分类
    console.log('\n开始分配分类...');
    const updatePromises = uncategorizedWorkflows.map(async (workflow) => {
      const workflowName = workflow.name;
      const categoryName = categoryMappings[workflowName] || '其他';
      const categoryId = categoryMap[categoryName];
      
      if (!categoryId) {
        console.log(`警告: 找不到分类 "${categoryName}" 对应的ID，跳过工作流 "${workflowName}"`);
        return null;
      }
      
      try {
        const updated = await WorkflowModel.findByIdAndUpdate(
          workflow._id,
          { 
            category_id: categoryId,
            updated_at: new Date()
          },
          { new: true }
        );
        
        console.log(`✅ ${workflowName} -> ${categoryName}`);
        return updated;
      } catch (error) {
        console.log(`❌ 更新工作流 "${workflowName}" 失败:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r !== null).length;
    
    console.log(`\n分配完成: ${successCount}/${uncategorizedWorkflows.length} 个工作流已分配分类`);

    // 4. 验证分配结果
    console.log('\n=== 验证分配结果 ===');
    const categorizedWorkflows = await WorkflowModel.find({
      category_id: { $exists: true, $ne: null }
    }).populate('category_id');
    
    console.log(`已分类工作流: ${categorizedWorkflows.length} 个`);
    categorizedWorkflows.forEach((workflow, index) => {
      console.log(`${index + 1}. ${workflow.name} -> ${workflow.category_id.name}`);
    });
    
    // 5. 按分类统计
    console.log('\n=== 按分类统计 ===');
    const categoryStats = await WorkflowModel.aggregate([
      {
        $match: {
          category_id: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'workflowcategories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
          workflows: { $push: '$name' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    categoryStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} 个工作流`);
      stat.workflows.forEach(name => {
        console.log(`  - ${name}`);
      });
    });

  } catch (error) {
    console.error('分配分类过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB连接已关闭');
  }
}

// 执行分配
if (require.main === module) {
  assignWorkflowCategories().then(() => {
    console.log('\n工作流分类分配完成');
    process.exit(0);
  }).catch(error => {
    console.error('工作流分类分配失败:', error);
    process.exit(1);
  });
}

module.exports = { assignWorkflowCategories, categoryMappings };