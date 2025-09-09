// 测试工作流分类API
const fetch = require('node-fetch');

async function testCategoriesAPI() {
  try {
    console.log('测试工作流分类API...');
    
    // 测试获取分类列表
    const response = await fetch('http://localhost:3000/api/categories');
    const result = await response.json();
    
    console.log('API响应状态:', response.status);
    console.log('API响应结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n分类列表:');
      result.data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`);
        console.log(`   ID: ${category.id}`);
        console.log(`   描述: ${category.description || '无'}`);
        console.log(`   排序: ${category.sort_order}`);
        console.log(`   状态: ${category.status}`);
        console.log('---');
      });
      
      console.log(`\n总计: ${result.data.length} 个分类`);
    } else {
      console.error('API调用失败:', result.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 执行测试
if (require.main === module) {
  testCategoriesAPI().then(() => {
    console.log('\n分类API测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('分类API测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testCategoriesAPI };