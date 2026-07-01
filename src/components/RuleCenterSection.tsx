"use client";

import {
  workHoursConfig,
  statusPriority,
  processingStatuses,
  processingStatusDescription,
  exceptionRules,
  singleDayRiskLevels,
  monthlyRiskRules,
  ruleEnginePhilosophy,
} from "@/config/attendanceRules";

// ---- Helpers ----

function RiskBadge({ level }: { level: string }) {
  const config = singleDayRiskLevels[level as keyof typeof singleDayRiskLevels];
  if (!config) return <span>{level}</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
    >
      {config.labelZh}
    </span>
  );
}

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

function FlowBadge({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}

// ---- Sub-components ----

function WorkHoursCard() {
  const rows: [string, string][] = [
    ["Standard Daily Hours / 标准日工时", `${workHoursConfig.standardWorkHours} 小时`],
    ["Check-in Time / 上班时间", workHoursConfig.standardCheckIn],
    ["Check-out Time / 下班时间", workHoursConfig.standardCheckOut],
    ["Serious Late Threshold / 严重迟到阈值", `晚于 ${workHoursConfig.seriousLateAfter}`],
    ["Lunch Break Deduction / 午休扣除", `${workHoursConfig.lunchBreakHours} 小时`],
    ["Overtime Threshold / 工时异常过长阈值", `> ${workHoursConfig.overtimeThresholdHours} 小时`],
    ["Workdays / 工作日", workHoursConfig.workdays.join("、")],
    ["Weekend Policy / 周末处理", workHoursConfig.weekendPolicy],
    [
      "Holiday / Schedule / 节假日与排班",
      `${workHoursConfig.holidayPolicy}；${workHoursConfig.schedulePolicy}`,
    ],
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        ⚙️ Standard Work Hours / 标准工时规则
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3"
          >
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-gray-800">
              {value}
            </dd>
          </div>
        ))}
      </div>
    </section>
  );
}

function PriorityFlowCard() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        🔍 Status Judgment Priority / 状态判断优先级
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        逐级匹配，命中即停止。优先级从高到低：
      </p>
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
        {statusPriority.map((status, i) => (
          <span key={status} className="flex items-center">
            <FlowBadge
              label={status}
              active={i < 3}
            />
            {i < statusPriority.length - 1 && <Arrow />}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        数据异常、审批冲突、已休假、已出差优先于考勤异常判定，确保合理原因不被误判。
      </p>
    </section>
  );
}

function ProcessingStatusCard() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        📋 Processing Status / 处理状态
      </h3>
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
        {processingStatuses.map((status, i) => (
          <span key={status} className="flex items-center">
            <FlowBadge label={status} active />
            {i < processingStatuses.length - 1 && <Arrow />}
          </span>
        ))}
      </div>
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
        <p className="text-xs leading-relaxed text-blue-700">
          💡 {processingStatusDescription}
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {processingStatuses.map((s) => (
          <div
            key={s}
            className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2 text-xs text-gray-600"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            {s === "待确认" && "系统自动判定异常后，等待 HR 确认"}
            {s === "已通知经理" && "已向员工直属经理发送提醒通知"}
            {s === "已确认" && "HR 已确认异常，纳入当月考勤统计"}
            {s === "已忽略" && "HR 判定无需处理，不计入异常"}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExceptionRulesTable() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        📊 Exception Type Rules / 异常类型规则
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-600">
                Rule Type / 规则类型
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-600">
                Criteria / 判断标准
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-600">
                Exception Mgmt / 异常管理
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-600">
                Risk / 风险
              </th>
              <th className="hidden whitespace-nowrap px-3 py-2.5 font-semibold text-gray-600 sm:table-cell">
                Notes / 说明
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {exceptionRules.map((rule) => (
              <tr
                key={rule.type}
                className="transition-colors hover:bg-blue-50/30"
              >
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-800">
                  {rule.type}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                  {rule.criteria}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  {rule.entersExceptionMgmt ? (
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 border border-orange-200">
                      是
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 border border-green-200">
                      否
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  <RiskBadge level={rule.riskLevel} />
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2.5 text-gray-500 sm:table-cell">
                  {rule.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        共 {exceptionRules.length} 条规则。移动端可左右滑动查看完整表格。
      </p>
    </section>
  );
}

function RiskLevelCard() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        ⚡ Risk Levels / 风险等级
      </h3>
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Single Day */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            📅 Single-Day Risk / 单日风险等级
          </h4>
          <div className="space-y-2">
            {(
              ["High", "Medium", "Low", "Normal"] as Array<
                keyof typeof singleDayRiskLevels
              >
            ).map((key) => {
              const cfg = singleDayRiskLevels[key];
              const examples: Record<string, string> = {
                High: "疑似旷工、审批冲突、严重迟到、数据异常",
                Medium: "缺卡、单次打卡、工时不足、工时异常过长、经理邮箱缺失",
                Low: "单次迟到、单次早退、周末有记录",
                Normal: "正常出勤、已出差、已休假",
              };
              return (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600">{examples[key]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Aggregate */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            📆 Monthly Aggregate Risk / 月度聚合风险等级
          </h4>
          <div className="space-y-2">
            {monthlyRiskRules.map((rule) => {
              const cfg =
                singleDayRiskLevels[
                  rule.level as keyof typeof singleDayRiskLevels
                ];
              return (
                <div
                  key={rule.level}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600">{rule.condition}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhilosophyCard() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        🧠 Rule Engine Philosophy / 规则引擎说明
      </h3>
      <blockquote className="text-sm leading-relaxed text-gray-600">
        {ruleEnginePhilosophy}
      </blockquote>
    </section>
  );
}

// ---- Main Export ----

export default function RuleCenterSection() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      <WorkHoursCard />
      <PriorityFlowCard />
      <ProcessingStatusCard />
      <ExceptionRulesTable />
      <RiskLevelCard />
      <PhilosophyCard />
    </div>
  );
}
