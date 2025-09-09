const mongoose = require('mongoose');

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

async function setAdmin() {
  try {
    // 连接MongoDB
    await mongoose.connect('mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin');
    console.log('MongoDB连接成功');
    
    // 将testadmin用户设置为管理员
    const result = await User.findOneAndUpdate(
      { username: 'testadmin' },
      { is_admin: true, updated_at: new Date() },
      { new: true }
    );
    
    if (result) {
      console.log('✅ testadmin用户已设置为管理员');
      console.log('用户信息:');
      console.log(`  用户名: ${result.username}`);
      console.log(`  邮箱: ${result.email}`);
      console.log(`  是否管理员: ${result.is_admin ? '是' : '否'}`);
      console.log(`  更新时间: ${result.updated_at}`);
    } else {
      console.log('❌ 未找到testadmin用户');
    }
    
    // 验证管理员用户数量
    const adminCount = await User.countDocuments({ is_admin: true });
    console.log(`\n当前管理员用户数量: ${adminCount}`);
    
  } catch (error) {
    console.error('设置管理员失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setAdmin();