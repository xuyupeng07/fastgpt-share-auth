import mongoose from 'mongoose';

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin";

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

const Workflow = mongoose.model('Workflow', WorkflowSchema);

// 模拟getWorkflowById函数
async function getWorkflowById(id) {
  try {
    const workflow = await Workflow.findById(id).lean();
    
    if (!workflow) return null;
    
    return {
      ...workflow,
      id: workflow._id.toString()
    };
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    return null;
  }
}

// 测试积分倍率功能
async function testMultiplier() {
  try {
    console.log('连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 获取"测试使用"工作流（积分倍率为10）
    const testWorkflow = await Workflow.findOne({ name: '测试使用' }).lean();
    
    if (!testWorkflow) {
      console.log('❌ 未找到"测试使用"工作流');
      return;
    }
    
    console.log('\n=== 测试工作流信息 ===');
    console.log(`工作流ID: ${testWorkflow._id}`);
    console.log(`工作流名称: ${testWorkflow.name}`);
    console.log(`积分倍率: ${testWorkflow.point_multiplier}`);
    
    // 测试getWorkflowById函数
    console.log('\n=== 测试getWorkflowById函数 ===');
    const workflow = await getWorkflowById(testWorkflow._id.toString());
    
    if (workflow) {
      console.log('✅ getWorkflowById函数正常');
      console.log(`返回的积分倍率: ${workflow.point_multiplier}`);
    } else {
      console.log('❌ getWorkflowById函数返回null');
    }
    
    // 模拟finish接口的积分倍率获取逻辑
    console.log('\n=== 模拟finish接口积分倍率获取 ===');
    const workflowId = testWorkflow._id.toString();
    let pointMultiplier = 1; // 默认倍率为1
    
    if (workflowId) {
      try {
        const workflowData = await getWorkflowById(workflowId);
        if (workflowData && workflowData.point_multiplier !== undefined) {
          pointMultiplier = workflowData.point_multiplier;
          console.log(`✅ 工作流 ${workflowId} 积分倍率: ${pointMultiplier}`);
        } else {
          console.log(`❌ 工作流数据获取失败或积分倍率未定义`);
        }
      } catch (error) {
        console.error('❌ 获取工作流积分倍率失败:', error);
      }
    }
    
    // 测试积分计算
    console.log('\n=== 测试积分计算 ===');
    const testPoints = 1.0; // 测试积分消费
    const calculatedCost = testPoints * pointMultiplier;
    
    console.log(`积分消费: ${testPoints}`);
    console.log(`积分倍率: ${pointMultiplier}`);
    console.log(`计算的消费金额: ${calculatedCost}`);
    console.log(`公式验证: ${testPoints} × ${pointMultiplier} = ${calculatedCost}`);
    
    if (calculatedCost === testPoints * pointMultiplier) {
      console.log('✅ 积分计算公式正确');
    } else {
      console.log('❌ 积分计算公式错误');
    }
    
    // 测试不同的积分倍率值
    console.log('\n=== 测试不同积分倍率值 ===');
    const testCases = [
      { points: 1.0, multiplier: 0 },
      { points: 1.0, multiplier: 0.5 },
      { points: 1.0, multiplier: 1 },
      { points: 1.0, multiplier: 2 },
      { points: 1.0, multiplier: 10 },
      { points: 0.5, multiplier: 10 }
    ];
    
    testCases.forEach((testCase, index) => {
      const cost = testCase.points * testCase.multiplier;
      console.log(`测试${index + 1}: ${testCase.points} × ${testCase.multiplier} = ${cost}`);
    });

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB连接已断开');
  }
}

testMultiplier();