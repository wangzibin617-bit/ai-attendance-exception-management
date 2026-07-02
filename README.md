# AI 考勤异常管理平台

> AI-Powered HR Attendance Exception Management Demo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

一个面向 HR 考勤管理场景的 AI 内部提效产品 Demo，将传统月度考勤统计升级为实时异常识别、可视化分析、报表导出和经理通知闭环。

---

## 🎯 项目简介

**AI 考勤异常管理平台** 是一个完整的 HR 考勤异常管理 Demo，展示了从规则定义、三表数据导入、月度考勤管理、异常识别、Dashboard 分析、报表导出到经理通知的全链路产品设计。

该项目不是商业上线系统，而是作为 **AI 产品经理 / AI 产品实习生作品集项目**，用来展示对企业内部提效、HR SaaS、异常识别、数据结构化、Dashboard、工作流和 AI Agent 场景的理解。

---

## ✨ 项目亮点

- 🏢 **HR SaaS 场景理解** — 深入理解考勤管理业务流程，覆盖规则配置、数据导入、异常识别到经理通知的完整闭环
- ⚙️ **规则引擎设计** — 先定义可解释的考勤异常规则，再做结构化判断，保证每一步可追溯、可解释
- 🔍 **异常识别** — 支持迟到、早退、缺卡、工时不足、审批冲突、疑似旷工等 17 种异常类型
- 📊 **数据结构化** — 三张原始 Excel 数据（考勤、出差、休假）合并为员工月度考勤底表，消除数据孤岛
- 📈 **Dashboard 可视化** — KPI 卡片、异常类型分布、部门分布、风险等级饼图、7 日趋势折线图、异常下钻明细
- 📋 **报表导出** — 支持异常明细、月度汇总、每日明细三种 CSV 报表导出（UTF-8 BOM，Excel 直接打开无乱码）
- ✉️ **经理通知** — 基于待确认异常自动生成直线经理通知模板，模拟完成异常处理闭环
- 🧠 **AI Agent 工作流** — 设计"规则引擎 + AI Agent"分层架构，AI 不直接替代规则判断，而是在规则结果之上做解释、摘要和流程推动
- 🔗 **完整产品链路** — 从数据导入到异常闭环，每一步数据口径一致、可追溯

---

## 🧩 核心功能

### Phase 0: 规则中心 (Rule Center)

- 标准工时规则（上班时间、下班时间、午休扣除、加班阈值）
- 状态判断优先级（数据异常 → 审批冲突 → 已休假 → 已出差 → 正常出勤 → 考勤异常 → 疑似旷工）
- 处理状态流转（待确认 → 已通知经理 → 已确认 → 已忽略）
- 17 种异常类型规则（含判断标准、风险等级、异常管理说明）
- 风险等级体系（单日风险 + 月度聚合风险）

### Phase 1: 数据导入 (Data Import)

- 三张原始 Excel 数据读取与字段识别
- 日期/时间格式标准化（Excel 序列号 → 标准字符串）
- 出差审批状态清洗（trim + 大小写精确匹配）
- 空值标准化与数据校验
- 标准化记录预览

### Phase 2: 月度考勤管理 (Monthly Attendance)

- 每日考勤底表生成（按员工 × 日期粒度）
- 员工月度汇总统计
- 按日期筛选查看当天所有员工考勤状态
- 员工月度 Timecard 历史明细
- 异常类型标记与风险等级计算

### Phase 3: 异常 Dashboard

- 7 个 KPI 卡片（员工总数、日记录数、异常人数、异常记录数、待确认数、高风险数、异常率）
- 异常类型分布横向柱状图
- 部门异常分布表
- 风险等级饼图
- 近 7 日异常趋势折线图
- 异常下钻明细表（支持按类别筛选）

### Phase 4: 报表导出 (Report Export)

- 异常明细报表（CSV）
- 员工月度考勤汇总报表（CSV）
- 员工每日考勤明细报表（CSV）
- 报表预览与 Excel 兼容性说明

### Phase 5: 经理通知 (Manager Notification)

- 待通知异常列表（按风险等级排序）
- 通知邮件预览（收件人、主题、正文）
- 模拟发送功能与发送记录日志

### AI Agent 工作流

- 产品设计思路全景（三表 → 标准化 → 月度底表 → 异常提取 → 分析 → 通知 → AI 解释）
- 规则引擎 vs AI Agent 分工说明
- 6 步 Agent 工作流设计
- Demo 亮点总结
- 后续落地 Roadmap

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js 16](https://nextjs.org/) | 全栈框架（App Router + Server Components） |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [React 19](https://react.dev/) | UI 组件 |
| [Tailwind CSS 4](https://tailwindcss.com/) | 样式 |
| [Recharts](https://recharts.org/) | 数据可视化图表 |
| [xlsx](https://docs.sheetjs.com/) | Excel 数据读取与处理 |
| CSV Utilities | 报表导出（BOM 编码，Excel 兼容） |
| Rule Engine (custom) | 考勤异常规则引擎 |
| AI Agent Workflow Design | 智能体工作流设计 |

---

## 🚀 本地运行

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/your-username/ai-attendance-exception-management.git
cd ai-attendance-exception-management

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看 Demo。

### 数据生成

项目已内置示例考勤数据（`public/data/` 目录），可直接运行。

如需基于自己的 Excel 数据重新生成：

> ⚠️ 注意：原始 Excel 文件需要放置在 `public/data/` 目录下。

```bash
# Step 1: 导入原始 Excel 数据
npm run import

# Step 2: 生成月度考勤底表
npm run build:monthly
```

### 构建

```bash
npm run build
npm run start
```

---

## 🔧 环境变量

当前 Demo 可直接本地运行，**无需额外配置环境变量**。

如需自定义应用名称等，可参考 `.env.example`。

---

## 📊 示例数据说明

项目中所有考勤数据、员工信息、部门数据均为**虚构示例数据**，仅用于 Demo 演示。数据包括：

- 员工工号：虚构格式（EMP001-EMP004）
- 员工姓名：仅保留姓氏（张、付、陈、叶）
- 部门信息：去标识化部门编号
- 经理邮箱：示例域名（`@example.com`）
- 考勤日期：2026 年 3 月
- 打卡时间：模拟考勤场景生成

**不代表任何真实企业或个人的数据。**

---

## 📁 项目结构

```
hr-attendance-ai/
├── public/
│   └── data/                    # 示例考勤数据 (JSON)
│       ├── dailyAttendanceRecords.json
│       ├── employeeMonthlySummary.json
│       ├── dataSourceSummary.json
│       ├── rawAttendanceRecords.json
│       ├── rawBusinessTripRecords.json
│       └── rawLeaveRecords.json
├── scripts/
│   ├── import-raw-data.ts       # 数据导入脚本 (Phase 1)
│   └── build-monthly-attendance.ts  # 月度考勤生成脚本 (Phase 2)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # 主页面（Server Component）
│   ├── components/
│   │   ├── HomeClient.tsx
│   │   ├── Navbar.tsx
│   │   ├── OverviewSection.tsx
│   │   ├── RuleCenterSection.tsx  # Phase 0: 规则中心
│   │   ├── DataImportSection.tsx  # Phase 1: 数据导入
│   │   ├── AttendanceManagementSection.tsx  # Phase 2: 月度考勤
│   │   ├── DashboardSection.tsx   # Phase 3: 异常 Dashboard
│   │   ├── ReportExportSection.tsx # Phase 4: 报表导出
│   │   ├── ManagerNotificationSection.tsx # Phase 5: 经理通知
│   │   └── AiAgentWorkflowSection.tsx # AI Agent 工作流
│   └── config/
│       └── attendanceRules.ts    # 考勤规则引擎配置
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 🎓 项目定位

该项目为**个人作品集 Demo**，主要用于展示：

- AI 产品设计思路与业务场景拆解
- 企业内部提效场景理解
- HR 管理流程与考勤规则体系认知
- 前端实现能力（Next.js + TypeScript + 可视化）
- AI Agent 工作流设计理念

**不代表真实企业系统**，不包含真实用户数据或生产环境配置。

---

## 📸 Screenshots

> Coming soon.

---

## 🗺️ 后续扩展方向

| 阶段 | 内容 |
|------|------|
| 短期 | 接入真实 Excel 上传、HR 自定义规则阈值 |
| 中期 | 接入 Outlook / Teams / 企业微信通知、报表同步 Power BI |
| 长期 | 接入企业内部大模型、NL 问答、日报/周报/月报 AI 摘要、流程优化识别 |

---

## 📄 License

[MIT License](LICENSE) — 可自由使用、修改和分发。

---

