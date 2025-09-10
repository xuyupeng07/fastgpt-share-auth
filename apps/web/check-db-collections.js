import mongoose from 'mongoose';

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';

async function checkDatabaseCollections() {
  try {
    console.log('=== 检查数据库集合和数据 ===\n');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    // 获取数据库实例
    const db = mongoose.connection.db;
    
    // 列出所有集合
    console.log('\n📋 数据库中的所有集合:');
    const collections = await db.listCollections().toArray();
    console.log(`找到 ${collections.length} 个集合:`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} 条记录`);
    }
    
    // 检查可能的消费记录集合名称
    const possibleNames = [
      'consumption_records',
      'consumptionrecords', 
      'consumption',
      'records',
      'consumptions',
      'user_consumption',
      'chat_consumption'
    ];
    
    console.log('\n🔍 检查可能的消费记录集合:');
    for (const name of possibleNames) {
      try {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`✅ 找到集合 '${name}': ${count} 条记录`);
          
          // 获取该集合的前3条记录作为样本
          const samples = await db.collection(name).find({}).limit(3).toArray();
          console.log(`   样本数据:`);
          samples.forEach((sample, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
          });
        } else {
          console.log(`❌ 集合 '${name}': 0 条记录`);
        }
      } catch (error) {
        console.log(`❌ 集合 '${name}': 不存在`);
      }
    }
    
    // 检查工作流集合
    console.log('\n🔧 检查工作流集合:');
    const workflowNames = ['workflows', 'workflow', 'work_flows'];
    
    for (const name of workflowNames) {
      try {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`✅ 找到工作流集合 '${name}': ${count} 条记录`);
          
          const workflows = await db.collection(name).find({}).toArray();
          workflows.forEach((workflow, index) => {
            console.log(`   ${index + 1}. ${workflow.name || workflow._id}: 倍率 ${workflow.point_multiplier || 'undefined'}`);
          });
        } else {
          console.log(`❌ 工作流集合 '${name}': 0 条记录`);
        }
      } catch (error) {
        console.log(`❌ 工作流集合 '${name}': 不存在`);
      }
    }
    
    // 检查用户集合
    console.log('\n👥 检查用户集合:');
    const userNames = ['users', 'user', 'accounts', 'account'];
    
    for (const name of userNames) {
      try {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`✅ 找到用户集合 '${name}': ${count} 条记录`);
          
          const users = await db.collection(name).find({}).limit(3).toArray();
          users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username || user.name || user._id}: 积分 ${user.points || 'undefined'}`);
          });
        } else {
          console.log(`❌ 用户集合 '${name}': 0 条记录`);
        }
      } catch (error) {
        console.log(`❌ 用户集合 '${name}': 不存在`);
      }
    }
    
    // 检查数据库名称
    console.log('\n🗄️ 数据库信息:');
    console.log(`当前数据库名: ${db.databaseName}`);
    console.log(`连接URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // 如果没有找到消费记录，创建一个测试记录
    const hasConsumptionRecords = collections.some(c => 
      c.name.toLowerCase().includes('consumption') || 
      c.name.toLowerCase().includes('record')
    );
    
    if (!hasConsumptionRecords) {
      console.log('\n⚠️ 没有找到消费记录集合，可能需要创建测试数据');
      console.log('💡 建议: 先运行一次聊天对话，产生消费记录后再检查');
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 执行检查
checkDatabaseCollections().then(() => {
  console.log('\n检查完成');
  process.exit(0);
}).catch(error => {
  console.error('检查失败:', error);
  process.exit(1);
});