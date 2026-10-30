<div align="center">
  <a href="https://credit-card-ledger.vercel.app/landing.html">
    <img src="./docs/assets/credit-ledger-readme.svg" alt="Credit Ledger 信用卡管理账本：额度、账单与还款的产品展示插画" width="100%" />
  </a>
  <h1>Credit Ledger · 信用卡管理账本</h1>
  <p><strong>让每一张卡，都有自己的节奏。</strong></p>
  <p>从额度到还款，从手续费到积分，把分散的信用卡信息整理成清楚的日常。</p>
  <p>
    <a href="https://credit-card-ledger.vercel.app/landing.html"><img src="https://img.shields.io/badge/浏览产品展示-E07157?style=for-the-badge" alt="浏览产品展示" /></a>
    <a href="https://credit-card-ledger.vercel.app/index.html"><img src="https://img.shields.io/badge/打开在线账本-17231F?style=for-the-badge" alt="打开在线账本" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/原生_JavaScript-17231F?style=flat-square" alt="原生 JavaScript" />
    <img src="https://img.shields.io/badge/Supabase_云同步-CBDCC5?style=flat-square" alt="Supabase 云同步" />
    <img src="https://img.shields.io/badge/响应式布局-F4F0E8?style=flat-square" alt="响应式布局" />
    <img src="https://img.shields.io/badge/JSON_备份-E07157?style=flat-square" alt="JSON 备份" />
  </p>
  <sub>封面为产品展示插画，所示金额均为示例数据。</sub>
</div>

<br />

<p align="center">
  <a href="#项目介绍">项目介绍</a> ·
  <a href="#功能亮点">功能亮点</a> ·
  <a href="#适用场景">适用场景</a> ·
  <a href="#开始使用">开始使用</a> ·
  <a href="#部署与开发">部署与开发</a> ·
  <a href="https://github.com/ajinggo/credit-card-ledger/issues">问题反馈</a>
</p>

## 项目介绍

**Credit Ledger 是一个面向个人的信用卡管理账本。** 当手里的卡越来越多，额度分散在不同银行，账单日和还款日交错，积分与年费任务也各有期限，管理成本便不再只是“记一笔账”。这个项目把卡片、共享额度、月度账单、还款进度、手续费和积分放在同一个工作台，帮助你看清当下的资金安排，也记住接下来要处理的事。

它围绕一条简单的日常流程展开：**整理卡片 → 记录账单 → 跟进还款 → 复盘成本与积分**。你可以从一张卡开始，逐步建立自己的管理习惯；也可以集中管理多张卡，按统一的口径查看额度与账单，减少重复统计和来回核对。

项目使用 **HTML、CSS 和原生 JavaScript** 构建，无需前端构建步骤，支持浏览器本地缓存、JSON 导入导出，以及基于 Supabase 的账户登录与云端同步。桌面端适合集中整理，手机端方便随时查看和更新。

> **看清额度，记住日期，跟进每一笔还款。**
> 信用卡信息由你手动维护；账本中的提醒和统计，帮助你把这些记录真正用起来。

## 功能亮点

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>💳 卡片与共享额度</h3>
      <p>集中整理固定额度、临时额度、账单日、还款日与年费规则。同一授信账户下的多张卡统一管理，避免总额度重复累计。</p>
    </td>
    <td width="50%" valign="top">
      <h3>🗓️ 账单与还款进度</h3>
      <p>按月记录账单，跟进全额、部分、最低还款或分期安排。结合剩余应还与逾期状态，明确每张卡的处理进度。</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📊 手续费与成本复盘</h3>
      <p>记录手续费与费率，结合积分估值查看净收益和趋势。把分散的成本放在一起，方便回顾自己的用卡情况。</p>
    </td>
    <td width="50%" valign="top">
      <h3>✈️ 积分与到期待办</h3>
      <p>管理航空、酒店等积分，记录到期或滚动有效期。在待办中心查看账单、还款、临时额度、积分和年费相关事项。</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>☁️ 登录、同步与备份</h3>
      <p>支持 Supabase 邮箱注册、登录、密码找回和会话恢复。结合云端账本快照与 JSON 导入导出，让换设备和留存备份更方便。</p>
    </td>
    <td width="50%" valign="top">
      <h3>🌗 适合日常使用的界面</h3>
      <p>响应式布局适配桌面与手机，配合深色模式和金额隐私开关，在不同设备、不同环境下保持清楚的阅读体验。</p>
    </td>
  </tr>
</table>

## 适用场景

| 你的日常 | 账本如何帮忙 |
| :--- | :--- |
| 多张卡的账单日、还款日总要反复确认 | 将日期与待办集中展示，逐项跟进 |
| 同一家银行的多张卡共用额度 | 按额度账户汇总，避免把同一份授信算多次 |
| 想知道每月还剩多少账单没处理 | 记录还款安排，查看剩余应还和当前状态 |
| 手续费、积分、年费任务各记在一处 | 放到同一个账本里，方便核对与复盘 |
| 想自己部署，也想保留数据备份 | 静态文件部署，按需配置 Supabase，并导出 JSON |

## 开始使用

### 01 · 打开你的账本

先浏览 [产品展示页](https://credit-card-ledger.vercel.app/landing.html)，或直接进入 [在线账本](https://credit-card-ledger.vercel.app/index.html)。当前在线版本需要按页面提示注册或登录。

### 02 · 整理卡片，再记账单

添加卡片和对应额度账户，填写账单日、还款日等信息；随后录入当月账单与还款安排。共享额度的卡片应归入同一个额度账户。

### 03 · 跟进待办，定期留一份备份

日常查看还款与到期事项，及时更新处理进度。使用 JSON 导出保存阶段性备份；启用云同步时，先确认本地和云端哪一份是你希望保留的账本。

## 数据与计算口径

**共享额度只计算一次。** 例如，两张卡同属一个 ¥50,000 的授信账户：


```text
额度账户总额   ¥50,000（只计一次）
共享额度已用   两张卡当月账单金额之和
共享额度可用   额度账户总额 − 共享额度已用
```

账单消费金额已经包含其中的取现部分；取现属于分析子项，不应再次叠加到消费总额中。

**本地缓存与云端快照各有用途。** 浏览器缓存用于保存本机账本状态；配置 Supabase 后，可通过账户同步云端快照。首次同步需要确认采用本地还是云端数据，不应把它视作自动合并两份账本。

- 清理浏览器数据、迁移设备前，建议先导出 JSON 备份。
- 云端通过行级安全策略（RLS）按用户隔离数据，核心条件为 `auth.uid() = user_id`。
- 金额隐私开关用于遮挡界面上的金额。请避免在备注中保存完整卡号、CVV 或支付密码。
- 账本依赖手动录入；页面内的待办提示不代表银行自动扣款或短信通知。实际账单与还款结果请以银行记录为准。

## 部署与开发

<details>
<summary><strong>本地运行 · 无需安装前端依赖</strong></summary>

克隆项目后，使用静态服务器打开：

```bash
git clone https://github.com/ajinggo/credit-card-ledger.git
cd credit-card-ledger
python3 -m http.server 8768
```

- 产品展示页：<http://127.0.0.1:8768/landing.html>
- 账本应用：<http://127.0.0.1:8768/index.html>

项目为原生静态页面，无需运行 `npm install` 或构建命令。登录与同步行为取决于 `supabase-config.js` 中的配置；使用云功能时，需将本地地址加入 Supabase 允许的重定向地址。

</details>

<details>
<summary><strong>Supabase 配置 · 账户与云同步</strong></summary>

1. 创建 Supabase 项目，并启用邮箱与密码登录。
2. 在 SQL Editor 执行 [supabase/schema.sql](./supabase/schema.sql)，创建数据表与访问策略。
3. 在 Authentication 的 URL Configuration 中配置站点地址与允许的重定向地址，覆盖正式域名以及实际使用的本地地址。
4. 在 [supabase-config.js](./supabase-config.js) 中填写项目 URL 和公开客户端密钥。
5. 打开账本，检查注册、登录、密码找回和同步流程。

云端使用 `ledger_state` 保存每位用户的 JSONB 账本快照，并通过 RLS 限制用户访问自己的记录。

**前端只能使用公开客户端密钥，不要放入 `service_role` 密钥。** 数据访问控制应由数据库的行级安全策略保障。

</details>

<details>
<summary><strong>项目结构 · 从这些文件开始</strong></summary>

```text
credit-card-ledger/
├── landing.html                 # 产品展示页
├── landing.css                  # 展示页样式
├── index.html                   # 账本应用与表单
├── app.js                       # 主要业务与交互
├── credit-account-model.js      # 共享额度模型
├── card-sort-model.js           # 卡片排序
├── fee-visibility-model.js      # 手续费显示逻辑
├── auth-flow-model.js           # 认证流程模型
├── styles.css                   # 应用样式
├── organic-liquid.css           # 视觉主题
├── cloud-sync.js                # Supabase 云同步
├── supabase-config.js           # 公开客户端配置
├── supabase/schema.sql          # 数据表与 RLS 策略
├── docs/assets/                 # README 展示素材
├── tests/                       # 回归检查
└── vercel.json                  # 部署与路由配置
```

</details>

<details>
<summary><strong>开发检查 · 模型、布局与语法</strong></summary>

在安装 Node.js 的开发环境中运行：

```bash
node --test tests/credit-account-model.test.cjs
node --test tests/mobile-responsive-layout.test.mjs
node tests/toast-layout.test.mjs
node --check app.js
node --check cloud-sync.js
git diff --check
```

这些命令用于开发检查，不是运行静态站点的前置步骤。

</details>

<details>
<summary><strong>发布到 Vercel · 展示页与账本入口</strong></summary>

将仓库导入 Vercel，按静态站点部署，无需前端构建步骤。仓库中的 `vercel.json` 将根路径 `/` 重写到 `/landing.html`，账本继续通过 `/index.html` 访问。

已配置 Vercel CLI 的环境也可以运行：

```bash
npx vercel --prod
```

更换域名后，同步更新 Supabase 的站点与重定向地址，以及 README 中的在线链接。

</details>

## 反馈与许可

欢迎通过 [Issues](https://github.com/ajinggo/credit-card-ledger/issues) 提交问题或改进建议。描述问题时，附上操作步骤、设备与浏览器信息，并隐去截图中的个人账单和账户信息。

仓库目前尚未附带开源许可证；使用、修改或分发前，请先与作者确认授权范围。

---

<p align="center">
  <strong>把复杂的卡片管理，变成有条理的日常。</strong><br />
  <sub>Credit Ledger · 清楚记录，从容安排。</sub>
</p>
