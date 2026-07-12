# 信用卡管理账本

一个面向个人信用卡管理的纯前端账本，集中管理信用卡额度、月度账单、还款进度、手续费记录、积分账户和到期提醒。

**在线体验：[https://credit-card-ledger.vercel.app](https://credit-card-ledger.vercel.app)**

> 当前版本的数据仅保存在访问者自己的浏览器中，不会上传到服务器。首次从本地版本迁移到在线版本时，请通过“数据备份与恢复”导出并导入 JSON 备份。

## 核心功能

- 信用卡额度管理：固定额度、临时额度、可用额度和使用率。
- 月度账单管理：账单月份、账单金额、最低还款额、应还日期和还款方式。
- 还款闭环：待还、部分已还、已还清和逾期状态。
- 手续费记录：套现金额、渠道、手续费率、手续费和积分价值。
- 消费看板：年度消费、月度消费、额度汇总和临额到期提醒。
- 还款概览：本月待还、已还金额和剩余待还金额。
- 手续费分析：净收益、平均费率、积分回报率和趋势对比。
- 积分账户：积分余额、到期时间、滚动有效期和提醒设置。
- 待办中心：账单日、还款日、临额、积分和年费任务提醒。
- 数据备份：完整 JSON 导出与导入。
- 隐私模式、深色模式和响应式布局。

## 财务口径

本项目采用以下计算规则，避免账单消费与套现金额重复累计：

```text
账单消费 = 本期总消费，已经包含套现金额
套现金额 = 账单消费中的分析子项

年度消费 = 年度账单消费
月度消费 = 月度账单消费
本月已用额度 = 月度账单消费
```

因此，消费、额度使用率、年费任务和预计还款不会再次把套现金额累加到账单金额上。

## 使用方式

直接访问在线版本：

[打开信用卡管理账本](https://credit-card-ledger.vercel.app)

也可以下载项目后直接打开 `index.html`。项目不依赖构建工具或后端服务。

### 本地运行

```bash
git clone https://github.com/ajinggo/credit-card-ledger.git
cd credit-card-ledger
open index.html
```

如需通过本地 HTTP 服务运行：

```bash
python3 -m http.server 8765
```

然后访问：

```text
http://127.0.0.1:8765/
```

## 数据与隐私

- 当前使用 `localStorage` 保存卡片、账单、手续费记录、积分账户和设置。
- 不同浏览器、设备和域名之间的数据不会自动同步。
- `file://` 本地页面与 Vercel 在线地址拥有各自独立的数据空间。
- 更换浏览器、清理网站数据或更换域名前，请先导出完整备份。
- 建议只保存银行名称和卡片尾号，不要录入完整卡号、CVV、交易密码或身份证信息。
- GitHub 仓库只保存网站代码，不保存浏览器中的个人账本数据。

## 项目结构

```text
.
├── index.html          # 页面结构与表单
├── app.js              # 数据、计算和交互逻辑
├── styles.css          # 基础样式
├── organic-liquid.css  # 当前视觉系统与响应式样式
├── .gitignore
└── .vercelignore
```

## 技术栈

- HTML5
- CSS3
- 原生 JavaScript
- Browser Local Storage
- GitHub
- Vercel

项目目前不需要 Node.js 构建流程，也没有引入 React、Vue 或其他前端框架。

## 开发与发布

修改代码后进行语法检查：

```bash
node --check app.js
```

提交到 GitHub：

```bash
git add index.html app.js styles.css organic-liquid.css README.md
git commit -m "Describe the change"
git push
```

当前可通过 Vercel CLI 发布生产版本：

```bash
npx vercel --prod
```

正式地址保持不变：

```text
https://credit-card-ledger.vercel.app
```

## 后续计划

- 接入 Supabase Auth，实现账号注册、登录和会话管理。
- 使用 Supabase PostgreSQL 保存卡片、账单、还款和积分数据。
- 为所有业务表启用 RLS，确保用户只能访问自己的数据。
- 支持多设备同步、云端备份和离线状态。
- 增加独立还款流水，让一张账单支持多次还款。
- 增加积分获得、兑换、过期和调整流水。

## 许可说明

本仓库当前未附带开源许可证。未经明确授权，不代表允许复制、修改或再分发。
