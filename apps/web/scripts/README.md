# 数据迁移脚本

本目录包含从MySQL迁移到MongoDB的数据迁移脚本。

## 文件说明

- `migrate-mysql-to-mongodb.ts` - 主要的数据迁移脚本
- `run-migration.js` - 执行迁移的Node.js脚本
- `README.md` - 本说明文件

## 使用方法

### 1. 准备环境变量

复制 `.env.migration.example` 为 `.env` 并填入正确的数据库连接信息：

```bash
cp .env.migration.example .env
```

编辑 `.env` 文件，填入：
- MySQL数据库连接信息（源数据库）
- MongoDB连接信息（目标数据库）

### 2. 执行数据迁移

在项目根目录执行：

```bash
# 方法1：使用Node.js脚本
node scripts/run-migration.js

# 方法2：直接使用ts-node
npx ts-node scripts/migrate-mysql-to-mongodb.ts
```

### 3. 迁移内容

脚本会迁移以下数据表：

- `users` → MongoDB `users` 集合
- `consumption_records` → MongoDB `consumptionrecords` 集合
- `recharge_records` → MongoDB `rechargerecords` 集合
- `workflows` → MongoDB `workflows` 集合

### 4. 注意事项

- 迁移脚本会检查重复数据，避免重复迁移
- 迁移过程中会保持数据完整性
- 建议在迁移前备份原始数据
- 迁移完成后，MySQL数据保持不变

### 5. 错误处理

如果迁移过程中出现错误：

1. 检查数据库连接配置
2. 确保MongoDB服务正常运行
3. 检查MySQL数据库中的数据格式
4. 查看控制台输出的详细错误信息

### 6. 验证迁移结果

迁移完成后，可以通过以下方式验证：

1. 检查MongoDB中的数据数量是否与MySQL一致
2. 随机抽查几条数据的内容是否正确
3. 测试应用功能是否正常