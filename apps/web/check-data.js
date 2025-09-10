import mongoose from 'mongoose';

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin";

// 消费记录模型
const ConsumptionRecordSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  token: { type: String, required: true },
  token_used: { type: Number, default: 0, min: 0 },
  points_used: { type: Number, default: 0, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  response_data: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 工作流模型
const WorkflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  point_multiplier: { type: Number, default: 1, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ConsumptionRecord = mongoose.model('ConsumptionRecord', ConsumptionRecordSchema);
const Workflow = mongoose.model('Workflow', WorkflowSchema);

async function checkData() {
  try {
    console.log('连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 检查最近的消费记录
    console.log('\n=== 最近5条消费记录 ===');
    const recentRecords = await ConsumptionRecord.find({})
      .sort({ created_at: -1 })
      .limit(5)
      .lean();
    
    recentRecords.forEach((record, index) => {
      console.log(`记录${index + 1}:`);
      console.log(`  用户名: ${record.username}`);
      console.log(`  积分消费: ${record.points_used}`);
      console.log(`  消费金额: ${record.cost}`);
      console.log(`  倍率计算: ${record.cost / record.points_used} (消费金额/积分消费)`);
      console.log(`  创建时间: ${record.created_at}`);
      console.log('---');
    });

    // 检查工作流积分倍率设置
    console.log('\n=== 工作流积分倍率设置 ===');
    const workflows = await Workflow.find({}).lean();
    
    workflows.forEach((workflow, index) => {
      console.log(`工作流${index + 1}:`);
      console.log(`  ID: ${workflow._id}`);
      console.log(`  名称: ${workflow.name}`);
      console.log(`  积分倍率: ${workflow.point_multiplier}`);
      console.log(`  状态: ${workflow.status}`);
      console.log('---');
    });

    // 统计分析
    console.log('\n=== 统计分析 ===');
    const totalRecords = await ConsumptionRecord.countDocuments();
    console.log(`总消费记录数: ${totalRecords}`);
    
    const recordsWithSameValue = await ConsumptionRecord.find({
      $expr: { $eq: ['$points_used', '$cost'] }
    }).countDocuments();
    
    console.log(`积分消费=消费金额的记录数: ${recordsWithSameValue}`);
    console.log(`比例: ${((recordsWithSameValue / totalRecords) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('检查数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB连接已断开');
  }
}

checkData();