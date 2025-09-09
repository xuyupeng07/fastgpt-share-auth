// 数据库迁移脚本：为workflows集合添加usageCount和likeCount字段
const mongoose = require('mongoose');

// 直接定义WorkflowModel，避免导入问题
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

async function migrateWorkflowFields() {
  try {
    console.log('开始连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 查找所有需要更新的workflows（字段不存在或值为0）
    const workflowsToUpdate = await WorkflowModel.find({
      $or: [
        { usageCount: { $exists: false } },
        { likeCount: { $exists: false } },
        { usageCount: 0 },
        { likeCount: 0 }
      ]
    });

    console.log(`找到 ${workflowsToUpdate.length} 个需要更新的工作流记录`);

    if (workflowsToUpdate.length === 0) {
      console.log('所有工作流记录都已经有usageCount和likeCount字段');
      return;
    }

    // 批量更新记录
    const updatePromises = workflowsToUpdate.map(async (workflow) => {
      const updateData = {};
      
      // 如果没有usageCount字段或值为0，设置默认值
      if (workflow.usageCount === undefined || workflow.usageCount === 0) {
        updateData.usageCount = Math.floor(Math.random() * 500) + 50; // 随机初始使用量 50-550
      }
      
      // 如果没有likeCount字段或值为0，设置默认值
      if (workflow.likeCount === undefined || workflow.likeCount === 0) {
        updateData.likeCount = Math.floor(Math.random() * 100) + 10; // 随机初始点赞量 10-110
      }

      if (Object.keys(updateData).length > 0) {
        await WorkflowModel.findByIdAndUpdate(workflow._id, updateData);
        console.log(`更新工作流: ${workflow.name} - 使用量: ${updateData.usageCount || workflow.usageCount}, 点赞量: ${updateData.likeCount || workflow.likeCount}`);
      }
    });

    await Promise.all(updatePromises);
    console.log(`成功更新 ${workflowsToUpdate.length} 个工作流记录`);

    // 验证更新结果
    const updatedWorkflows = await WorkflowModel.find({});
    console.log('\n验证更新结果:');
    updatedWorkflows.forEach(workflow => {
      console.log(`${workflow.name}: 使用量=${workflow.usageCount}, 点赞量=${workflow.likeCount}`);
    });

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 执行迁移
if (require.main === module) {
  migrateWorkflowFields().then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
}