import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import connectDB from '../lib/mongodb.js';
import UserModel from '../lib/models/User.js';
import ConsumptionRecordModel from '../lib/models/ConsumptionRecord.js';
import RechargeRecordModel from '../lib/models/RechargeRecord.js';
import WorkflowModel from '../lib/models/Workflow.js';

// MySQL连接配置
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'noLogin',
  connectionLimit: 10
};

// 创建MySQL连接池
const mysqlPool = mysql.createPool(mysqlConfig);

// 数据迁移函数
async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
    // 连接MongoDB
    await connectDB();
    console.log('MongoDB连接成功');
    
    // 测试MySQL连接
    const connection = await mysqlPool.getConnection();
    console.log('MySQL连接成功');
    connection.release();
    
    // 迁移用户数据
    await migrateUsers();
    
    // 迁移消费记录
    await migrateConsumptionRecords();
    
    // 迁移充值记录
    await migrateRechargeRecords();
    
    // 迁移工作流数据
    await migrateWorkflows();
    
    console.log('数据迁移完成！');
    
  } catch (error) {
    console.error('数据迁移失败:', error);
  } finally {
    // 关闭连接
    await mysqlPool.end();
    await mongoose.disconnect();
  }
}

// 迁移用户数据
async function migrateUsers() {
  console.log('开始迁移用户数据...');
  
  const [rows] = await mysqlPool.execute('SELECT * FROM users');
  const users = rows as any[];
  
  console.log(`找到 ${users.length} 个用户`);
  
  for (const user of users) {
    try {
      // 检查用户是否已存在
      const existingUser = await UserModel.findOne({ uid: user.uid });
      if (existingUser) {
        console.log(`用户 ${user.username} 已存在，跳过`);
        continue;
      }
      
      // 创建新用户
      const newUser = new UserModel({
        username: user.username,
        password: user.password,
        token: user.token,
        uid: user.uid,
        email: user.email,
        balance: user.balance,
        status: user.status,
        is_admin: user.is_admin,
        created_at: user.created_at,
        updated_at: user.updated_at
      });
      
      await newUser.save();
      console.log(`用户 ${user.username} 迁移成功`);
      
    } catch (error) {
      console.error(`用户 ${user.username} 迁移失败:`, error);
    }
  }
  
  console.log('用户数据迁移完成');
}

// 迁移消费记录
async function migrateConsumptionRecords() {
  console.log('开始迁移消费记录...');
  
  const [rows] = await mysqlPool.execute('SELECT * FROM consumption_records');
  const records = rows as any[];
  
  console.log(`找到 ${records.length} 条消费记录`);
  
  for (const record of records) {
    try {
      // 查找对应的用户
      const user = await UserModel.findOne({ username: record.username });
      if (!user) {
        console.log(`消费记录 ${record.id} 对应的用户 ${record.username} 不存在，跳过`);
        continue;
      }
      
      // 检查记录是否已存在
      const existingRecord = await ConsumptionRecordModel.findOne({
        user_id: user._id,
        created_at: record.created_at
      });
      if (existingRecord) {
        console.log(`消费记录 ${record.id} 已存在，跳过`);
        continue;
      }
      
      // 创建新消费记录
      const newRecord = new ConsumptionRecordModel({
        user_id: user._id,
        username: record.username,
        token: record.token,
        token_used: record.token_used,
        points_used: record.points_used,
        cost: record.cost,
        response_data: record.response_data ? JSON.parse(record.response_data) : null,
        created_at: record.created_at,
        updated_at: record.updated_at
      });
      
      await newRecord.save();
      console.log(`消费记录 ${record.id} 迁移成功`);
      
    } catch (error) {
      console.error(`消费记录 ${record.id} 迁移失败:`, error);
    }
  }
  
  console.log('消费记录迁移完成');
}

// 迁移充值记录
async function migrateRechargeRecords() {
  console.log('开始迁移充值记录...');
  
  const [rows] = await mysqlPool.execute('SELECT * FROM recharge_records');
  const records = rows as any[];
  
  console.log(`找到 ${records.length} 条充值记录`);
  
  for (const record of records) {
    try {
      // 查找对应的用户
      const user = await UserModel.findOne({ username: record.username });
      if (!user) {
        console.log(`充值记录 ${record.id} 对应的用户 ${record.username} 不存在，跳过`);
        continue;
      }
      
      // 检查记录是否已存在
      const existingRecord = await RechargeRecordModel.findOne({
        user_id: user._id,
        created_at: record.created_at
      });
      if (existingRecord) {
        console.log(`充值记录 ${record.id} 已存在，跳过`);
        continue;
      }
      
      // 创建新充值记录
      const newRecord = new RechargeRecordModel({
        user_id: user._id,
        username: record.username,
        token: record.token,
        amount: record.amount,
        balance_before: record.balance_before,
        balance_after: record.balance_after,
        remark: record.remark,
        created_at: record.created_at,
        updated_at: record.updated_at
      });
      
      await newRecord.save();
      console.log(`充值记录 ${record.id} 迁移成功`);
      
    } catch (error) {
      console.error(`充值记录 ${record.id} 迁移失败:`, error);
    }
  }
  
  console.log('充值记录迁移完成');
}

// 迁移工作流数据
async function migrateWorkflows() {
  console.log('开始迁移工作流数据...');
  
  const [rows] = await mysqlPool.execute('SELECT * FROM workflows');
  const workflows = rows as any[];
  
  console.log(`找到 ${workflows.length} 个工作流`);
  
  for (const workflow of workflows) {
    try {
      // 检查工作流是否已存在
      const existingWorkflow = await WorkflowModel.findOne({ name: workflow.name });
      if (existingWorkflow) {
        console.log(`工作流 ${workflow.name} 已存在，跳过`);
        continue;
      }
      
      // 创建新工作流
      const newWorkflow = new WorkflowModel({
        name: workflow.name,
        description: workflow.description,
        no_login_url: workflow.no_login_url,
        status: workflow.status,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at
      });
      
      await newWorkflow.save();
      console.log(`工作流 ${workflow.name} 迁移成功`);
      
    } catch (error) {
      console.error(`工作流 ${workflow.name} 迁移失败:`, error);
    }
  }
  
  console.log('工作流数据迁移完成');
}

// 执行迁移
// 如果直接运行此文件，则执行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export default migrateData;