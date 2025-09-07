import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/mongodb.js';
import UserModel from '../lib/models/User.js';

async function fixPasswords() {
  try {
    await connectDB();
    console.log('MongoDB连接成功');
    
    const users = await UserModel.find({});
    console.log(`找到 ${users.length} 个用户需要修复密码`);
    
    for (const user of users) {
      // 检查密码是否已经是bcrypt格式
      if (!user.password.startsWith('$2')) {
        console.log(`正在修复用户 ${user.username} 的密码...`);
        
        // 加密明文密码
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // 更新用户密码
        await UserModel.updateOne(
          { _id: user._id },
          { password: hashedPassword }
        );
        
        console.log(`用户 ${user.username} 密码修复完成`);
      } else {
        console.log(`用户 ${user.username} 密码已经是加密格式，跳过`);
      }
    }
    
    console.log('\n所有用户密码修复完成！');
    
    // 验证修复结果
    const updatedUsers = await UserModel.find({});
    console.log('\n修复后的用户信息:');
    updatedUsers.forEach(user => {
      console.log(`用户: ${user.username}, 密码哈希长度: ${user.password.length}, 是否为bcrypt: ${user.password.startsWith('$2')}`);
    });
    
  } catch (error) {
    console.error('修复密码失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixPasswords();