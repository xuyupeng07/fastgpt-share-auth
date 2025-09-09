const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

async function checkUsers() {
  try {
    // 连接MongoDB
    await mongoose.connect('mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin');
    console.log('MongoDB连接成功');
    
    // 查询所有用户
    const users = await User.find({});
    console.log(`\n找到 ${users.length} 个用户:`);
    
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`  用户名: ${user.username}`);
      console.log(`  邮箱: ${user.email || 'N/A'}`);
      console.log(`  余额: ${user.balance}`);
      console.log(`  状态: ${user.status}`);
      console.log(`  是否管理员: ${user.is_admin ? '是' : '否'}`);
      console.log(`  ID: ${user._id}`);
      console.log(`  创建时间: ${user.created_at}`);
    });
    
    // 特别检查管理员用户
    const adminUsers = await User.find({ is_admin: true });
    console.log(`\n管理员用户数量: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\n管理员用户详情:');
      adminUsers.forEach((admin, index) => {
        console.log(`\n管理员 ${index + 1}:`);
        console.log(`  用户名: ${admin.username}`);
        console.log(`  邮箱: ${admin.email}`);
        console.log(`  余额: ${admin.balance}`);
        console.log(`  状态: ${admin.status}`);
        console.log(`  ID: ${admin._id}`);
      });
    } else {
      console.log('\n⚠️  未找到管理员用户!');
      console.log('需要创建管理员用户来测试鉴权功能。');
    }
    
  } catch (error) {
    console.error('检查用户数据失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers();