// 检查消费记录是否写入数据库
import mongoose from 'mongoose';

// 消费记录Schema
const consumptionRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  token_used: {
    type: Number,
    default: 0,
    min: 0
  },
  points_used: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  response_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const ConsumptionRecord = mongoose.models.ConsumptionRecord || mongoose.model('ConsumptionRecord', consumptionRecordSchema);

async function checkConsumptionRecords() {
  try {
    // 连接MongoDB
    const MONGODB_URI = 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');
    
    // 查询所有消费记录
    const records = await ConsumptionRecord.find({}).sort({ created_at: -1 }).limit(10);
    
    console.log(`\n找到 ${records.length} 条消费记录:`);
    console.log('='.repeat(80));
    
    records.forEach((record, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`  ID: ${record._id}`);
      console.log(`  用户ID: ${record.user_id}`);
      console.log(`  用户名: ${record.username}`);
      console.log(`  Token: ${record.token ? record.token.substring(0, 20) + '...' : 'N/A'}`);
      console.log(`  消耗Token: ${record.token_used}`);
      console.log(`  消耗积分: ${record.points_used}`);
      console.log(`  费用: ${record.cost}`);
      console.log(`  创建时间: ${record.created_at}`);
      console.log(`  响应数据: ${JSON.stringify(record.response_data)}`);
      console.log('-'.repeat(40));
    });
    
    // 统计testuser的消费记录
    const testUserRecords = await ConsumptionRecord.find({ username: 'testuser' }).sort({ created_at: -1 });
    console.log(`\ntestuser 总共有 ${testUserRecords.length} 条消费记录`);
    
    if (testUserRecords.length > 0) {
      const totalCost = testUserRecords.reduce((sum, record) => sum + record.cost, 0);
      const totalTokens = testUserRecords.reduce((sum, record) => sum + record.token_used, 0);
      const totalPoints = testUserRecords.reduce((sum, record) => sum + record.points_used, 0);
      
      console.log(`总消费: ${totalCost} 积分`);
      console.log(`总Token消耗: ${totalTokens}`);
      console.log(`总积分消耗: ${totalPoints}`);
    }
    
  } catch (error) {
    console.error('查询消费记录失败:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

checkConsumptionRecords().then(() => {
  console.log('\n查询完成');
  process.exit(0);
}).catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});