import connectDB from './mongodb';
import UserModel from './models/User';
import ConsumptionRecordModel from './models/ConsumptionRecord';
import RechargeRecordModel from './models/RechargeRecord';
import WorkflowModel from './models/Workflow';
import bcrypt from 'bcryptjs';
import type { IUser, IConsumptionRecord, IRechargeRecord, IWorkflow } from './models';

// 确保数据库连接
async function ensureConnection() {
  await connectDB();
}

// 根据token查找用户
// 注意：token字段已从用户模型中移除
// 如果需要根据token查找用户，请使用其他标识符

// 根据用户名和密码验证用户
export async function authenticateUser(username: string, password: string) {
  try {
    await ensureConnection();
    // 先根据用户名查找用户
    const user = await UserModel.findOne({ username })
      .select('_id username password token uid email balance status is_admin created_at')
      .lean();
    
    if (!user) {
      return null;
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    // 返回用户信息（不包含密码），确保包含id字段
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: user._id.toString() // 确保id字段存在
    };
  } catch (error) {
    console.error('用户验证失败:', error);
    return null;
  }
}

// 根据用户ID查找用户
export async function getUserById(userId: string | number) {
  try {
    await ensureConnection();
    const user = await UserModel.findById(userId)
      .select('_id username token uid email balance status is_admin created_at')
      .lean();
    return user;
  } catch (error) {
    console.error('根据ID查询用户失败:', error);
    return null;
  }
}

// 获取所有用户
export async function getAllUsers() {
  try {
    await ensureConnection();
    const users = await UserModel.find({})
      .select('_id username token uid email balance status is_admin created_at')
      .sort({ created_at: -1 })
      .lean();
    return users;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return [];
  }
}

// 更新用户状态
export async function updateUserStatus(userId: string | number, status: 'active' | 'inactive') {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { status, updated_at: new Date() },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('更新用户状态失败:', error);
    throw error;
  }
}

// 注意：token字段已从用户模型中移除
// 请使用updateUserBalanceById函数通过用户ID更新余额

// 更新用户余额（通过用户ID）
export async function updateUserBalanceById(userId: string | number, newBalance: number) {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { balance: newBalance, updated_at: new Date() },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('更新用户余额失败:', error);
    return false;
  }
}

// 添加消费记录
export async function addConsumptionRecord(
  userId: string | number,
  username: string,
  tokenUsed: number,
  pointsUsed: number,
  cost: number,
  responseData?: any
) {
  try {
    await ensureConnection();

    const record = new ConsumptionRecordModel({
      user_id: userId,
      username,
      token_used: tokenUsed,
      points_used: pointsUsed,
      cost,
      response_data: responseData
    });
    
    await record.save();
    return true;
  } catch (error) {
    console.error('添加消费记录失败:', error);
    return false;
  }
}

// 获取所有消费记录
export async function getAllConsumptionRecords() {
  try {
    await ensureConnection();
    const records = await ConsumptionRecordModel.find({})
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .lean();
    
    // 格式化数据以兼容现有API
    return records.map(record => ({
      ...record,
      id: record._id,
      username: record.username || (record.user_id as any)?.username
    }));
  } catch (error) {
    console.error('获取消费记录失败:', error);
    return [];
  }
}

// 获取用户消费记录（已废弃，使用getUserConsumptionRecordsByUsername代替）
export async function getUserConsumptionRecords(token: string) {
  console.warn('getUserConsumptionRecords已废弃，请使用getUserConsumptionRecordsByUsername');
  return [];
}

// 根据用户名获取消费记录
export async function getUserConsumptionRecordsByUsername(username: string) {
  try {
    await ensureConnection();
    const records = await ConsumptionRecordModel.find({ username })
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .lean();
    
    return records.map(record => ({
      ...record,
      id: record._id,
      username: record.username
    }));
  } catch (error) {
    console.error('根据用户名获取消费记录失败:', error);
    return [];
  }
}

// 获取消费记录详情
export async function getConsumptionRecordDetail(id: string | number) {
  try {
    await ensureConnection();
    const record = await ConsumptionRecordModel.findById(id)
      .populate('user_id', 'username email')
      .lean();
    
    if (!record) return null;
    
    return {
      ...record,
      id: record._id,
      username: record.username || (record.user_id as any)?.username,
      email: (record.user_id as any)?.email
    };
  } catch (error) {
    console.error('获取消费记录详情失败:', error);
    return null;
  }
}

// 添加充值记录
export async function addRechargeRecord(
  userId: string | number,
  username: string,
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  remark?: string
) {
  try {
    await ensureConnection();
    const record = new RechargeRecordModel({
      user_id: userId,
      username,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      remark: remark || ''
    });
    
    await record.save();
    return true;
  } catch (error) {
    console.error('添加充值记录失败:', error);
    return false;
  }
}

// 获取所有充值记录
export async function getAllRechargeRecords() {
  try {
    await ensureConnection();
    const records = await RechargeRecordModel.find({})
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .lean();
    
    return records.map(record => ({
      ...record,
      id: record._id,
      username: record.username || (record.user_id as any)?.username
    }));
  } catch (error) {
    console.error('获取充值记录失败:', error);
    return [];
  }
}



// 根据用户名获取充值记录
export async function getRechargeRecordsByUsername(username: string) {
  try {
    await ensureConnection();
    const records = await RechargeRecordModel.find({ username })
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .lean();
    
    return records.map(record => ({
      ...record,
      id: record._id,
      username: record.username || (record.user_id as any)?.username
    }));
  } catch (error) {
    console.error('获取用户充值记录失败:', error);
    return [];
  }
}

// 工作流相关操作

// 获取所有工作流
export async function getAllWorkflows() {
  try {
    await ensureConnection();
    const workflows = await WorkflowModel.find({})
      .sort({ created_at: -1 })
      .lean();
    
    return workflows.map(workflow => ({
      ...workflow,
      id: workflow._id
    }));
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    return [];
  }
}

// 根据ID获取工作流
export async function getWorkflowById(id: string | number) {
  try {
    await ensureConnection();
    const workflow = await WorkflowModel.findById(id).lean();
    
    if (!workflow) return null;
    
    return {
      ...workflow,
      id: workflow._id
    };
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    return null;
  }
}

// 创建工作流
export async function createWorkflow(
  name: string,
  description: string,
  noLoginUrl: string,
  status: 'active' | 'inactive' = 'active'
) {
  try {
    await ensureConnection();
    const workflow = new WorkflowModel({
      name,
      description,
      no_login_url: noLoginUrl,
      status
    });
    
    const result = await workflow.save();
    return result;
  } catch (error) {
    console.error('创建工作流失败:', error);
    throw error;
  }
}

// 更新工作流
export async function updateWorkflow(
  id: string | number,
  name: string,
  description: string,
  noLoginUrl: string,
  status: 'active' | 'inactive'
) {
  try {
    await ensureConnection();
    const result = await WorkflowModel.findByIdAndUpdate(
      id,
      {
        name,
        description,
        no_login_url: noLoginUrl,
        status,
        updated_at: new Date()
      },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('更新工作流失败:', error);
    throw error;
  }
}

// 删除工作流
export async function deleteWorkflow(id: string | number) {
  try {
    await ensureConnection();
    const result = await WorkflowModel.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error('删除工作流失败:', error);
    throw error;
  }
}

// 更新工作流状态
export async function updateWorkflowStatus(id: string | number, status: 'active' | 'inactive') {
  try {
    await ensureConnection();
    const result = await WorkflowModel.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('更新工作流状态失败:', error);
    throw error;
  }
}

export default connectDB;