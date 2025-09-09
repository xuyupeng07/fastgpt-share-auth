import connectDB from './mongodb';
import UserModel from './models/User';
import ConsumptionRecordModel from './models/ConsumptionRecord';
import RechargeRecordModel from './models/RechargeRecord';
import WorkflowModel from './models/Workflow';
import WorkflowCategoryModel from './models/WorkflowCategory';
import bcrypt from 'bcryptjs';
import type { IUser, IConsumptionRecord, IRechargeRecord, IWorkflow, IWorkflowCategory } from './models';

// 确保数据库连接
async function ensureConnection() {
  await connectDB();
}



// 根据用户名和密码验证用户
export async function authenticateUser(username: string, password: string) {
  try {
    await ensureConnection();
    // 先根据用户名查找用户
    const user = await UserModel.findOne({ username })
      .select('_id username password email balance status is_admin created_at')
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
    
    // 验证ObjectId格式
    if (!userId || (typeof userId === 'string' && (userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)))) {
      console.error('无效的用户ID格式:', userId);
      return null;
    }
    
    const user = await UserModel.findById(userId)
      .select('_id username email balance status is_admin created_at')
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
      .select('_id username email balance status is_admin created_at')
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
export async function updateUserBalanceById(userId: string | number, newBalance: number, session?: any) {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { balance: newBalance, updated_at: new Date() },
      { new: true, session }
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
  responseData?: any,
  session?: any,
  token?: string
) {
  try {
    await ensureConnection();

    const record = new ConsumptionRecordModel({
      user_id: userId,
      username,
      token: token || 'unknown', // 提供默认值以满足必需字段要求
      token_used: tokenUsed,
      points_used: pointsUsed,
      cost,
      response_data: responseData
    });
    
    await record.save({ session });
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
      .populate('category_id', 'name description')
      .sort({ created_at: -1 })
      .lean();
    
    return workflows.map(workflow => ({
      ...workflow,
      id: workflow._id.toString(), // 确保ID是字符串格式
      category_name: workflow.category_id ? (workflow.category_id as any).name : '未分类' // 添加category_name字段供前端使用
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
      id: workflow._id.toString() // 确保ID是字符串格式
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
  status: 'active' | 'inactive' = 'active',
  categoryId?: string,
  avatar?: string
) {
  try {
    await ensureConnection();
    const workflow = new WorkflowModel({
      name,
      description,
      no_login_url: noLoginUrl,
      status,
      category_id: categoryId,
      avatar
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
  status: 'active' | 'inactive',
  categoryId?: string,
  avatar?: string
) {
  try {
    await ensureConnection();
    const updateData: any = {
      name,
      description,
      no_login_url: noLoginUrl,
      status,
      category_id: categoryId,
      updated_at: new Date()
    };
    
    // 只有当avatar不为undefined时才更新avatar字段
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    
    const result = await WorkflowModel.findByIdAndUpdate(
      id,
      updateData,
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

// 工作流分类相关操作

// 获取所有工作流分类
export async function getAllWorkflowCategories() {
  try {
    await ensureConnection();
    const categories = await WorkflowCategoryModel.find({ status: 'active' })
      .sort({ sort_order: 1, created_at: 1 })
      .lean();
    
    return categories.map(category => ({
      ...category,
      id: category._id.toString()
    }));
  } catch (error) {
    console.error('获取工作流分类列表失败:', error);
    return [];
  }
}

// 根据ID获取工作流分类
export async function getWorkflowCategoryById(id: string | number) {
  try {
    await ensureConnection();
    const category = await WorkflowCategoryModel.findById(id).lean();
    
    if (!category) return null;
    
    return {
      ...category,
      id: category._id.toString()
    };
  } catch (error) {
    console.error('获取工作流分类详情失败:', error);
    return null;
  }
}

// 创建工作流分类
export async function createWorkflowCategory(categoryData: {
  name: string;
  sort_order?: number;
  status?: 'active' | 'inactive';
}) {
  try {
    await ensureConnection();
    const category = new WorkflowCategoryModel(categoryData);
    const result = await category.save();
    return {
      ...result.toObject(),
      id: result._id.toString()
    };
  } catch (error) {
    console.error('创建工作流分类失败:', error);
    throw error;
  }
}

// 更新工作流分类
export async function updateWorkflowCategory(
  id: string | number,
  updateData: {
    name?: string;
    sort_order?: number;
    status?: 'active' | 'inactive';
  }
) {
  try {
    await ensureConnection();
    const result = await WorkflowCategoryModel.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    
    if (!result) return null;
    
    return {
      ...result.toObject(),
      id: result._id.toString()
    };
  } catch (error) {
    console.error('更新工作流分类失败:', error);
    throw error;
  }
}

// 删除工作流分类
export async function deleteWorkflowCategory(id: string | number) {
  try {
    await ensureConnection();
    const result = await WorkflowCategoryModel.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error('删除工作流分类失败:', error);
    throw error;
  }
}

// 更新工作流分类状态
export async function updateWorkflowCategoryStatus(id: string | number, status: 'active' | 'inactive') {
  try {
    await ensureConnection();
    const result = await WorkflowCategoryModel.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error('更新工作流分类状态失败:', error);
    throw error;
  }
}

// 更新用户密码
export async function updateUserPassword(userId: string | number, hashedPassword: string) {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword, updated_at: new Date() },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('更新用户密码失败:', error);
    return false;
  }
}

// 更新用户邮箱
export async function updateUserEmail(userId: string | number, email: string) {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { email: email, updated_at: new Date() },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('更新用户邮箱失败:', error);
    return false;
  }
}

// 更新用户管理员权限
export async function updateUserAdmin(userId: string | number, isAdmin: boolean) {
  try {
    await ensureConnection();
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { is_admin: isAdmin, updated_at: new Date() },
      { new: true }
    );
    return result !== null;
  } catch (error) {
    console.error('更新用户管理员权限失败:', error);
    return false;
  }
}

// 创建用户
export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  balance?: number;
  is_admin?: boolean;
}) {
  try {
    await ensureConnection();
    
    const newUser = new UserModel({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      balance: userData.balance || 0,
      is_admin: userData.is_admin || false,
      status: 'active'
    });
    
    const savedUser = await newUser.save();
    
    // 返回用户信息（不包含密码）
    return {
      id: savedUser._id.toString(),
      username: savedUser.username,
      email: savedUser.email,
      balance: savedUser.balance,
      status: savedUser.status,
      is_admin: savedUser.is_admin,
      created_at: savedUser.created_at
    };
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 删除用户
export async function deleteUser(userId: string | number) {
  try {
    await ensureConnection();
    
    // 删除用户的消费记录
    await ConsumptionRecordModel.deleteMany({ userId: userId });
    
    // 删除用户的充值记录
    await RechargeRecordModel.deleteMany({ userId: userId });
    
    // 删除用户
    const result = await UserModel.findByIdAndDelete(userId);
    
    return !!result;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
}

export default connectDB;