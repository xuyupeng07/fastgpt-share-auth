// 简化版本，直接使用MongoDB连接
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 用户Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // 连接MongoDB
    const MONGODB_URI = 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('测试用户已存在:', existingUser._id.toString());
      console.log('用户ID:', existingUser._id.toString());
      return existingUser._id.toString();
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    const newUser = new User({
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      balance: 100.0,
      status: 'active',
      is_admin: false,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const savedUser = await newUser.save();
    console.log('测试用户创建成功:', savedUser._id.toString());
    console.log('用户ID:', savedUser._id.toString());
    
    return savedUser._id.toString();
  } catch (error) {
    console.error('创建测试用户失败:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser().then((userId) => {
  console.log('\n请使用此用户ID更新token生成脚本:', userId);
  process.exit(0);
}).catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});