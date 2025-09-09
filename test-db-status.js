const mongoose = require('mongoose');

// MongoDB连接配置
const MONGODB_URI = 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';

// 工作流模型定义
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

const WorkflowModel = mongoose.model('Workflow', WorkflowSchema);

async function testDatabase() {
  try {
    console.log('正在连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 查询所有工作流
    const workflows = await WorkflowModel.find().limit(5);
    console.log(`\n找到 ${workflows.length} 个工作流记录`);
    
    if (workflows.length > 0) {
      console.log('\n工作流数据示例:');
      workflows.forEach((workflow, index) => {
        console.log(`${index + 1}. ${workflow.name}`);
        console.log(`   ID: ${workflow._id}`);
        console.log(`   点赞数: ${workflow.likeCount || 0}`);
        console.log(`   使用量: ${workflow.usageCount || 0}`);
        console.log(`   状态: ${workflow.status}`);
        console.log(`   创建时间: ${workflow.created_at}`);
        console.log('---');
      });
    } else {
      console.log('\n数据库中没有工作流记录');
    }

    // 测试更新操作
    if (workflows.length > 0) {
      const testWorkflow = workflows[0];
      console.log(`\n测试更新工作流: ${testWorkflow.name}`);
      
      const originalLikeCount = testWorkflow.likeCount || 0;
      console.log(`原始点赞数: ${originalLikeCount}`);
      
      // 尝试增加点赞数
      const updated = await WorkflowModel.findByIdAndUpdate(
        testWorkflow._id,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
      
      if (updated) {
        console.log(`更新后点赞数: ${updated.likeCount}`);
        
        // 恢复原始值
        await WorkflowModel.findByIdAndUpdate(
          testWorkflow._id,
          { likeCount: originalLikeCount }
        );
        console.log(`已恢复原始点赞数: ${originalLikeCount}`);
      } else {
        console.log('更新失败');
      }
    }

  } catch (error) {
    console.error('数据库测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB连接已断开');
    process.exit(0);
  }
}

testDatabase();