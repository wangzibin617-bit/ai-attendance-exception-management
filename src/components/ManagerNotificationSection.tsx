"use client";

import { useMemo, useState } from "react";

// ================================================================
// Types
// ================================================================

interface DailyRecord {
  employeeId: string;
  name: string;
  department: string;
  date: string;
  dayOfWeek: string;
  checkIn: string | null;
  checkOut: string | null;
  standardWorkHours: number;
  creditedWorkHours: number;
  isBusinessTrip: boolean;
  isOnLeave: boolean;
  attendanceStatus: string;
  processStatus: string;
  exceptionTypes: string[];
  riskLevel: string;
  managerEmail: string | null;
  sourceTypes: string[];
  ruleExplanation: string;
}

interface Props {
  dailyRecords: DailyRecord[];
}

interface SendLogEntry {
  id: number;
  timestamp: string;
  employeeId: string;
  name: string;
  date: string;
  exceptionTypes: string[];
  managerEmail: string;
  riskLevel: string;
}

// ================================================================
// Helpers
// ================================================================

const RISK_ORDER: Record<string, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Normal: 3,
};

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Normal: "bg-green-100 text-green-700 border-green-200",
};

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_BADGE[level] || RISK_BADGE.Normal;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}
    >
      {level}
    </span>
  );
}

function formatTime(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

// ================================================================
// Notification Template
// ================================================================

function buildSubject(r: DailyRecord): string {
  const types = r.exceptionTypes.join("、");
  return `【考勤异常提醒】${r.name} ${r.date} ${types}`;
}

function buildBody(r: DailyRecord): string {
  return `您好，

系统识别到员工 ${r.name}（${r.employeeId}）在 ${r.date} 存在考勤异常：

* 部门：${r.department}
* 考勤状态：${r.attendanceStatus}
* 异常类型：${r.exceptionTypes.join("、")}
* 风险等级：${r.riskLevel}
* 上班打卡：${r.checkIn || "—"}
* 下班打卡：${r.checkOut || "—"}
* 规则说明：${r.ruleExplanation}

请您协助确认该异常是否属实，并反馈是否需要 HR 进一步跟进。

此通知为系统模拟发送，用于 Demo 展示。`;
}

// ================================================================
// KPI Cards
// ================================================================

function KpiCards({
  totalPending,
  employeeCount,
  managerCount,
  highRiskCount,
  missingEmailCount,
  sentCount,
}: {
  totalPending: number;
  employeeCount: number;
  managerCount: number;
  highRiskCount: number;
  missingEmailCount: number;
  sentCount: number;
}) {
  const cards = [
    {
      label: "Pending / 待通知",
      value: totalPending,
      accent: "#f59e0b",
    },
    {
      label: "Employees / 涉及员工",
      value: employeeCount,
      accent: "#3b82f6",
    },
    {
      label: "Managers / 涉及经理",
      value: managerCount,
      accent: "#8b5cf6",
    },
    {
      label: "High Risk / 高风险",
      value: highRiskCount,
      accent: "#ef4444",
    },
    {
      label: "Missing Email / 邮箱缺失",
      value: missingEmailCount,
      accent: "#f97316",
    },
    {
      label: "Sent / 已模拟发送",
      value: sentCount,
      accent: "#22c55e",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: c.accent }}
            />
            <span className="text-[10px] font-medium text-gray-500">{c.label}</span>
          </div>
          <span className="mt-2 text-2xl font-bold text-gray-900">{c.value}</span>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// Main Component
// ================================================================

export default function ManagerNotificationSection({ dailyRecords }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [sendLog, setSendLog] = useState<SendLogEntry[]>([]);

  // ---- Pending records (processStatus === "待确认") ----
  const pendingRecords = useMemo(() => {
    const records = dailyRecords
      .filter((r) => r.processStatus === "待确认")
      .sort((a, b) => {
        // Sort by risk: High > Medium > Low, then by date desc
        const riskDiff = (RISK_ORDER[a.riskLevel] ?? 99) - (RISK_ORDER[b.riskLevel] ?? 99);
        if (riskDiff !== 0) return riskDiff;
        return b.date.localeCompare(a.date);
      });
    return records;
  }, [dailyRecords]);

  // Default select first record
  const selectedRecord = useMemo(() => {
    if (selectedId && pendingRecords.some((r) => r.employeeId + r.date === selectedId)) {
      return pendingRecords.find((r) => r.employeeId + r.date === selectedId)!;
    }
    return pendingRecords[0] || null;
  }, [pendingRecords, selectedId]);

  // Auto-select first if none selected
  if (selectedRecord && !selectedId) {
    // Use useEffect-like pattern with setTimeout to avoid setState during render
    setTimeout(() => setSelectedId(selectedRecord.employeeId + selectedRecord.date), 0);
  }

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const totalPending = pendingRecords.length;
    const employeeSet = new Set(pendingRecords.map((r) => r.employeeId));
    const managerSet = new Set(
      pendingRecords.filter((r) => r.managerEmail).map((r) => r.managerEmail!)
    );
    const highRiskCount = pendingRecords.filter((r) => r.riskLevel === "High").length;
    const missingEmailCount = pendingRecords.filter((r) => !r.managerEmail).length;

    return {
      totalPending,
      employeeCount: employeeSet.size,
      managerCount: managerSet.size,
      highRiskCount,
      missingEmailCount,
      sentCount: sentSet.size,
    };
  }, [pendingRecords, sentSet]);

  // ---- Simulate send ----
  const handleSimulateSend = () => {
    if (!selectedRecord || !selectedRecord.managerEmail) return;
    const key = selectedRecord.employeeId + selectedRecord.date;
    if (sentSet.has(key)) return;

    // Mark as sent
    setSentSet((prev) => new Set(prev).add(key));

    // Add to send log
    const entry: SendLogEntry = {
      id: Date.now(),
      timestamp: formatTime(),
      employeeId: selectedRecord.employeeId,
      name: selectedRecord.name,
      date: selectedRecord.date,
      exceptionTypes: selectedRecord.exceptionTypes,
      managerEmail: selectedRecord.managerEmail,
      riskLevel: selectedRecord.riskLevel,
    };
    setSendLog((prev) => [entry, ...prev]);
  };

  const selectedKey = selectedRecord
    ? selectedRecord.employeeId + selectedRecord.date
    : "";
  const isSent = sentSet.has(selectedKey);
  const hasManagerEmail = !!selectedRecord?.managerEmail;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Manager Notification
          <span className="ml-2 text-sm font-normal text-gray-500">/ 经理通知</span>
        </h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Phase 5
        </span>
      </div>

      <p className="text-sm text-gray-500">
        基于待确认异常记录生成直线经理提醒，模拟完成异常处理闭环。
      </p>

      {/* Data Source Notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700">
        💡 经理通知不重新计算异常，而是直接基于 Phase 2 生成的员工每日考勤底表中 processStatus 为「待确认」的记录，保证通知、Dashboard、报表和员工历史考勤数据口径一致。
      </div>

      {/* KPI Cards */}
      <KpiCards
        totalPending={kpis.totalPending}
        employeeCount={kpis.employeeCount}
        managerCount={kpis.managerCount}
        highRiskCount={kpis.highRiskCount}
        missingEmailCount={kpis.missingEmailCount}
        sentCount={kpis.sentCount}
      />

      {/* Two-column layout: List + Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Pending List */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            📋 Pending Notifications / 待通知异常列表
          </h3>
          <p className="mb-3 text-[11px] text-gray-400">
            {pendingRecords.length} records · sorted by risk (High → Low)
          </p>

          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-100">
            {pendingRecords.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">暂无待通知异常</p>
            ) : (
              <table className="min-w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Date / 日期</th>
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Employee / 员工</th>
                    <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Risk / 风险</th>
                    <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingRecords.map((r) => {
                    const key = r.employeeId + r.date;
                    const isSelected = key === selectedKey;
                    const isItemSent = sentSet.has(key);
                    return (
                      <tr
                        key={key}
                        onClick={() => setSelectedId(key)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${
                          isSelected ? "bg-blue-50/60 ring-1 ring-inset ring-blue-200" : ""
                        } ${r.riskLevel === "High" ? "border-l-2 border-l-red-400" : ""}`}
                      >
                        <td className="whitespace-nowrap px-2.5 py-2.5 font-medium text-gray-800">
                          {r.date}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2.5">
                          <span className="font-medium text-gray-800">{r.name}</span>
                          <span className="ml-1 text-gray-400">{r.employeeId}</span>
                          {!r.managerEmail && (
                            <span className="ml-1 inline-flex items-center rounded bg-orange-50 border border-orange-200 px-1 py-0.5 text-[9px] text-orange-600">
                              缺邮箱
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                          <RiskBadge level={r.riskLevel} />
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                          {isItemSent ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              ✓ Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right: Notification Preview */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            ✉️ Notification Preview / 通知预览
          </h3>

          {!selectedRecord ? (
            <p className="py-12 text-center text-xs text-gray-400">
              请从左侧列表选择一条待通知记录
            </p>
          ) : (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-gray-400">Notification Type</span>
                  <p className="font-medium text-gray-700">模拟邮件 / Manager Alert</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-gray-400">Data Source</span>
                  <p className="font-medium text-gray-700">dailyAttendanceRecords</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-gray-400">Generation</span>
                  <p className="font-medium text-gray-700">规则引擎 + AI-ready 模板</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-gray-400">Status</span>
                  <p className="font-medium text-gray-700">
                    {isSent ? "已模拟发送" : hasManagerEmail ? "待发送" : "无法发送"}
                  </p>
                </div>
              </div>

              {/* Email preview card */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {/* To */}
                <div className="mb-3 border-b border-gray-200 pb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">To / 收件人</span>
                  <p className="mt-0.5 text-xs font-mono text-gray-800">
                    {selectedRecord.managerEmail || (
                      <span className="text-orange-500 font-medium">⚠ 缺少经理邮箱</span>
                    )}
                  </p>
                </div>

                {/* Subject */}
                <div className="mb-3 border-b border-gray-200 pb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Subject / 主题</span>
                  <p className="mt-0.5 text-xs font-medium text-gray-800">
                    {buildSubject(selectedRecord)}
                  </p>
                </div>

                {/* Body */}
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Body / 正文</span>
                  <pre className="mt-1 max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded bg-white border border-gray-100 p-3 text-[11px] leading-relaxed text-gray-700 font-sans">
                    {buildBody(selectedRecord)}
                  </pre>
                </div>
              </div>

              {/* Exception detail */}
              <div className="text-[11px] text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Date:</span> {selectedRecord.date}
                  {" · "}
                  <span className="font-medium">Exceptions:</span>{" "}
                  {selectedRecord.exceptionTypes.join("、")}
                  {" · "}
                  <RiskBadge level={selectedRecord.riskLevel} />
                </p>
              </div>

              {/* Simulate Send Button */}
              <div>
                {hasManagerEmail ? (
                  isSent ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      已模拟发送
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSimulateSend}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 shadow-sm"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      模拟发送通知
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
                    title="该员工缺少经理邮箱"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    缺少经理邮箱，无法发送
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Send Log */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          📤 Send Log / 发送记录
        </h3>
        {sendLog.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            暂无发送记录 — 选择待通知记录并点击「模拟发送通知」
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Send Time / 发送时间</th>
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Employee / 员工</th>
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Date / 日期</th>
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Exceptions / 异常类型</th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Risk / 风险</th>
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Manager Email / 经理邮箱</th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Status / 状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sendLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-blue-50/30">
                    <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-gray-600">
                      {entry.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5">
                      <span className="font-medium text-gray-800">{entry.name}</span>
                      <span className="ml-1 text-gray-400">{entry.employeeId}</span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-gray-700">{entry.date}</td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex flex-wrap gap-0.5">
                        {entry.exceptionTypes.map((et) => (
                          <span
                            key={et}
                            className="inline-block rounded bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700"
                          >
                            {et}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                      <RiskBadge level={entry.riskLevel} />
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 font-mono text-gray-500 text-[10px]">
                      {entry.managerEmail}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        已模拟发送
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sendLog.length > 0 && (
          <p className="mt-2 text-[10px] text-gray-400">
            {sendLog.length} notification(s) simulated · Demo only, no real emails sent
          </p>
        )}
      </section>
    </div>
  );
}
