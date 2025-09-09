// 删除工作流分类中的description字段
const mongoose = require('mongoose');

// 工作流分类Schema（更新后的版本，不包含description）
const WorkflowCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sort_order: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const WorkflowCategoryModel = mongoose.models.WorkflowCategory || mongoose.model('WorkflowCategory', WorkflowCategorySchema);

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:hpt6pq6r@dbconn.sealoshzh.site:39853/exchange?directConnection=true&authSource=admin';

async function removeCategoryDescription() {
  try {
    console.log('开始连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB连接成功');

    // 获取所有分类
    const categories = await WorkflowCategoryModel.find({});
    console.log(`找到 ${categories.length} 个分类`);

    if (categories.length === 0) {
      console.log('没有找到分类数据');
      return;
    }

    // 显示当前分类信息
    console.log('\n当前分类信息:');
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   ID: ${category._id}`);
      if (category.description) {
        console.log(`   描述: ${category.description}`);
      }
      console.log(`   排序: ${category.sort_order}`);
      console.log(`   状态: ${category.status}`);
      console.log('---');
    });

    // 删除description字段
    console.log('\n开始删除description字段...');
    const result = await WorkflowCategoryModel.updateMany(
      {},
      { $unset: { description: 1 } }
    );

    console.log(`成功更新 ${result.modifiedCount} 个分类，删除了description字段`);

    // 验证删除结果
    console.log('\n验证删除结果:');
    const updatedCategories = await WorkflowCategoryModel.find({});
    updatedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   ID: ${category._id}`);
      console.log(`   排序: ${category.sort_order}`);
      console.log(`   状态: ${category.status}`);
      if (category.description) {
        console.log(`   ⚠️  仍有描述字段: ${category.description}`);
      } else {
        console.log(`   ✅ 描述字段已删除`);
      }
      console.log('---');
    });

    console.log('\n✅ description字段删除完成');

  } catch (error) {
    console.error('删除description字段失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 执行删除
if (require.main === module) {
  removeCategoryDescription().then(() => {
    console.log('\n分类description字段删除完成');
    process.exit(0);
  }).catch(error => {
    console.error('分类description字段删除失败:', error);
    process.exit(1);
  });
}

module.exports = { removeCategoryDescription };