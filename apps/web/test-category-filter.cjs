// 测试工作流分类过滤功能
const fetch = require('node-fetch');

async function testCategoryFilter() {
  try {
    console.log('=== 测试工作流分类过滤功能 ===\n');
    
    // 1. 获取所有分类
    console.log('1. 获取所有分类...');
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.success) {
      console.error('获取分类失败:', categoriesData.message);
      return;
    }
    
    const categories = categoriesData.data;
    console.log(`找到 ${categories.length} 个分类:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat._id})`);
    });
    
    // 2. 获取所有工作流
    console.log('\n2. 获取所有工作流...');
    const workflowsResponse = await fetch('http://localhost:3000/api/workflows');
    const workflowsData = await workflowsResponse.json();
    
    if (!workflowsData.success) {
      console.error('获取工作流失败:', workflowsData.message);
      return;
    }
    
    const workflows = workflowsData.data;
    console.log(`找到 ${workflows.length} 个工作流`);
    
    // 3. 验证每个工作流都有分类信息
    console.log('\n3. 验证工作流分类信息...');
    const workflowsByCategory = {};
    
    workflows.forEach(workflow => {
      const category = workflow.category || '未分类';
      if (!workflowsByCategory[category]) {
        workflowsByCategory[category] = [];
      }
      workflowsByCategory[category].push(workflow.name);
      console.log(`  ${workflow.name} -> ${category}`);
    });
    
    // 4. 按分类统计
    console.log('\n4. 按分类统计:');
    Object.keys(workflowsByCategory).forEach(category => {
      const count = workflowsByCategory[category].length;
      console.log(`  ${category}: ${count} 个工作流`);
      workflowsByCategory[category].forEach(name => {
        console.log(`    - ${name}`);
      });
    });
    
    // 5. 模拟前端分类过滤逻辑
    console.log('\n5. 模拟前端分类过滤逻辑...');
    categories.forEach(category => {
      const categoryName = category.name;
      const filteredWorkflows = workflows.filter(workflow => workflow.category === categoryName);
      console.log(`  分类 "${categoryName}" 筛选结果: ${filteredWorkflows.length} 个工作流`);
      
      if (filteredWorkflows.length > 0) {
        filteredWorkflows.forEach(workflow => {
          console.log(`    ✅ ${workflow.name}`);
        });
      } else {
        console.log(`    ❌ 没有找到工作流`);
      }
    });
    
    // 6. 测试"全部"分类
    console.log('\n6. 测试"全部"分类过滤...');
    const allWorkflows = workflows; // 全部分类不过滤
    console.log(`  "全部" 分类结果: ${allWorkflows.length} 个工作流`);
    
    console.log('\n=== 测试完成 ===');
    
    // 7. 总结
    const hasUncategorized = workflows.some(w => !w.category || w.category === '未分类');
    const allCategoriesHaveWorkflows = categories.every(cat => 
      workflows.some(w => w.category === cat.name)
    );
    
    console.log('\n=== 测试总结 ===');
    console.log(`✅ 分类API正常: ${categories.length} 个分类`);
    console.log(`✅ 工作流API正常: ${workflows.length} 个工作流`);
    console.log(`${hasUncategorized ? '❌' : '✅'} 工作流分类完整性: ${hasUncategorized ? '存在未分类工作流' : '所有工作流都已分类'}`);
    console.log(`${allCategoriesHaveWorkflows ? '✅' : '⚠️'} 分类使用情况: ${allCategoriesHaveWorkflows ? '所有分类都有工作流' : '部分分类暂无工作流'}`);
    
    if (hasUncategorized || !allCategoriesHaveWorkflows) {
      console.log('\n建议: 前端分类过滤功能应该可以正常工作');
    } else {
      console.log('\n✅ 前端分类过滤功能应该完全正常');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
if (require.main === module) {
  testCategoryFilter().then(() => {
    console.log('\n测试脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testCategoryFilter };