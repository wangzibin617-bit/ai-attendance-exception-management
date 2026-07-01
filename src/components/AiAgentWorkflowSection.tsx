"use client";

// ================================================================
// AiAgentWorkflowSection — 设计思路与智能体工作流
// Pure presentation component for interview demo
// ================================================================

function Arrow() {
  return (
    <svg
      className="mx-1 h-4 w-4 shrink-0 text-blue-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function StepBadge({ num, label, active }: { num: number; label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-600"
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
        {num}
      </span>
      {label}
    </span>
  );
}

// ================================================================
// Sections
// ================================================================

function ProductDesignFlow() {
  const steps = [
    "三张原始数据",
    "数据标准化",
    "员工月度考勤底表",
    "异常提取",
    "Dashboard 分析",
    "报表导出",
    "经理通知",
    "AI 解释与摘要",
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        🧩 Product Design Logic / 产品设计思路
      </h3>

      {/* Flow */}
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center">
            <span className="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              {step}
            </span>
            {i < steps.length - 1 && <Arrow />}
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-blue-700">
        本 Demo 没有直接从原始 Excel 跳到异常看板，而是先建立异常规则中心，再完成三张数据导入、员工月度考勤底表、异常看板、报表和经理通知，保证每一步数据口径一致、可解释、可追溯。
      </div>
    </section>
  );
}

function RuleVsAi() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        🤖 Rule Engine vs AI Agent / 规则引擎与 AI Agent 分工
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Rule Engine */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm">
              ⚙️
            </span>
            <h4 className="text-sm font-semibold text-emerald-800">Rule Engine / 规则引擎</h4>
          </div>
          <p className="mb-3 text-[11px] text-emerald-600">负责确定性判断</p>
          <ul className="space-y-1.5 text-xs text-gray-600">
            {[
              "字段校验（日期、工号、时间格式）",
              "日期 / 时间标准化",
              "出差 / 休假跨表匹配",
              "迟到、早退、缺卡、工时不足、审批冲突识别",
              "风险等级计算（High / Medium / Low / Normal）",
              "处理状态流转（待确认 → 已通知 → 已确认 → 已忽略）",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-emerald-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: AI Agent */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-sm">
              🧠
            </span>
            <h4 className="text-sm font-semibold text-purple-800">AI Agent / 智能体</h4>
          </div>
          <p className="mb-3 text-[11px] text-purple-600">负责解释、摘要和流程推动</p>
          <ul className="space-y-1.5 text-xs text-gray-600">
            {[
              "生成自然语言异常解释",
              "生成经理通知文案",
              "生成日报 / 周报 / 月报摘要",
              "识别高频异常原因",
              "提出流程优化建议",
              "支持 HR 问答查询（\"本月哪个部门异常最多？\"）",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-purple-500">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs font-medium text-blue-700">
        💡 AI 不直接替代规则判断，而是在规则结果之上做解释、摘要和流程推动。
      </div>
    </section>
  );
}

function AgentWorkflow() {
  const steps = [
    { num: 1, label: "读取标准化数据\n(raw JSON)" },
    { num: 2, label: "调用规则引擎\n生成 daily records" },
    { num: 3, label: "提取异常和\n风险等级" },
    { num: 4, label: "生成 Dashboard\n和报表" },
    { num: 5, label: "为待确认异常\n生成经理通知" },
    { num: 6, label: "沉淀异常原因\n用于流程优化" },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        🔄 Agent Workflow / 智能体工作流
      </h3>
      <div className="flex flex-wrap items-start gap-1 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-4">
        {steps.map((step, i) => (
          <span key={step.num} className="flex items-center">
            <span className="flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-center shadow-sm min-w-[100px]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {step.num}
              </span>
              <span className="text-[11px] font-medium text-gray-700 whitespace-pre-line leading-tight">
                {step.label}
              </span>
            </span>
            {i < steps.length - 1 && (
              <svg
                className="mx-1 h-4 w-4 shrink-0 self-center text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}

function DemoHighlights() {
  const highlights = [
    {
      icon: "📊",
      title: "三表合并",
      desc: "考勤、出差、休假统一成员工月度考勤底表，消除数据孤岛",
    },
    {
      icon: "📋",
      title: "可解释规则",
      desc: "先定义 Rule Center，再做异常识别，每一步可追溯、可解释",
    },
    {
      icon: "👤",
      title: "真实 HR 视角",
      desc: "支持当前考勤状态、月度汇总、历史 Timecard 三级下钻",
    },
    {
      icon: "🔁",
      title: "处理闭环",
      desc: "Dashboard → 报表下载 → 经理通知，完整异常处理流程",
    },
    {
      icon: "🔌",
      title: "可落地扩展",
      desc: "可接入 HRIS、Kronos、Power BI、Teams / Outlook 通知",
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        ✨ Demo Highlights / Demo 亮点
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center transition-shadow hover:shadow-sm"
          >
            <span className="mb-2 text-2xl">{h.icon}</span>
            <h4 className="text-sm font-semibold text-gray-800">{h.title}</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{h.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FutureRoadmap() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        🗺️ Future Roadmap / 后续落地思路
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Short term */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5">
          <div className="mb-3 inline-flex items-center rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
            短期
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">→</span>
              接入真实 Excel 上传和 HRIS 数据源
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500">→</span>
              支持 HR 自定义规则阈值
            </li>
          </ul>
        </div>

        {/* Medium term */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-5">
          <div className="mb-3 inline-flex items-center rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
            中期
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-1.5">
              <span className="text-purple-500">→</span>
              接入 Outlook / Teams / 企业微信通知
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-purple-500">→</span>
              报表同步到 Power BI
            </li>
          </ul>
        </div>

        {/* Long term */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
          <div className="mb-3 inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            长期
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-500">→</span>
              接入企业内部大模型
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-500">→</span>
              NL 问答（"本月哪个部门异常最多？"）
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-500">→</span>
              日报 / 周报 / 月报摘要
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-500">→</span>
              识别制度或流程优化机会
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function InterviewSummary() {
  return (
    <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        💬 Interview Summary / 面试总结口径
      </h3>
      <blockquote className="text-sm leading-relaxed text-gray-600">
        这个 Demo 的核心不是单纯做一个异常图表，而是搭建了一个从规则定义、数据导入、月度考勤、异常识别、报表下载到经理通知的完整 HR 自动化流程。规则引擎保证判断准确和可解释，AI Agent 负责解释、摘要和流程推动，体现了数据分析、流程优化和 AI 应用在 HR 场景中的结合。
      </blockquote>
    </section>
  );
}

// ================================================================
// Main Export
// ================================================================

export default function AiAgentWorkflowSection() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          AI Agent Workflow
          <span className="ml-2 text-sm font-normal text-gray-500">/ 设计思路与智能体工作流</span>
        </h2>
      </div>

      <p className="text-sm text-gray-500">
        通过"规则引擎 + AI Agent + 流程自动化"的分层设计，将传统月度考勤统计升级为实时识别、实时展示、实时提醒的 HR 智能管理工具。
      </p>

      <ProductDesignFlow />
      <RuleVsAi />
      <AgentWorkflow />
      <DemoHighlights />
      <FutureRoadmap />
      <InterviewSummary />
    </div>
  );
}
