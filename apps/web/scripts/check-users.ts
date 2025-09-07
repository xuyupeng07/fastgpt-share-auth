import mongoose from 'mongoose';
import connectDB from '../lib/mongodb.js';
import UserModel from '../lib/models/User.js';

async function checkUsers() {
  try {
    await connectDB();
    console.log('MongoDB连接成功');
    
    const users = await UserModel.find({});
    console.log(`\n找到 ${users.length} 个用户:`);
    
    users.forEach(user => {
      console.log(`用户名: ${user.username}`);
      console.log(`密码哈希: ${user.password}`);
      console.log(`邮箱: ${user.email || 'N/A'}`);
      console.log(`余额: ${user.balance}`);
      console.log(`ID: ${user._id}`);
      console.log('---');
    });
    
    // 特别检查admin用户
    const adminUser = await UserModel.findOne({ username: 'admin' });
    if (adminUser) {
      console.log('\nAdmin用户详情:');
      console.log('用户名:', adminUser.username);
      console.log('密码哈希:', adminUser.password);
      console.log('密码长度:', adminUser.password?.length);
      console.log('是否为bcrypt格式:', adminUser.password?.startsWith('$2'));
    } else {
      console.log('\n未找到admin用户!');
    }
    
  } catch (error) {
    console.error('检查用户数据失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers();