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

interface MonthlySummary {
  employeeId: string;
  name: string;
  department: string;
  totalRecordDays: number;
  normalAttendanceDays: number;
  businessTripDays: number;
  leaveDays: number;
  anomalyDays: number;
  pendingReviewDays: number;
  highRiskDays: number;
  totalCreditedWorkHours: number;
  standardWorkHoursPerDay: number;
  managerEmail: string | null;
  latestAttendanceStatus: string;
  latestRecordDate: string;
}

interface Props {
  dailyRecords: DailyRecord[];
  monthlySummaries: MonthlySummary[];
}

// ================================================================
// Helpers
// ================================================================

const RISK_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Normal: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  "正常出勤": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "已出差": "bg-blue-50 text-blue-700 border-blue-200",
  "已休假": "bg-purple-50 text-purple-700 border-purple-200",
  "考勤异常": "bg-amber-50 text-amber-700 border-amber-200",
  "疑似旷工": "bg-red-50 text-red-700 border-red-200",
  "审批冲突": "bg-red-50 text-red-700 border-red-200",
  "数据异常": "bg-red-50 text-red-700 border-red-200",
};

const PROCESS_COLORS: Record<string, string> = {
  "无需处理": "bg-gray-50 text-gray-600 border-gray-200",
  "待确认": "bg-orange-50 text-orange-700 border-orange-200",
  "已通知经理": "bg-blue-50 text-blue-700 border-blue-200",
  "已确认": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "已忽略": "bg-gray-50 text-gray-500 border-gray-200",
};

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_COLORS[level] || RISK_COLORS.Normal;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status, type }: { status: string; type: "attendance" | "process" }) {
  const map = type === "attendance" ? STATUS_COLORS : PROCESS_COLORS;
  const cls = map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  // Map attendance status to shorter display
  const label =
    type === "attendance"
      ? status
      : status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

// ================================================================
// Section 1: Current Attendance Status
// ================================================================

function CurrentStatus({
  dailyRecords,
}: {
  dailyRecords: DailyRecord[];
}) {
  const dates = useMemo(() => {
    const set = new Set(dailyRecords.map((r) => r.date));
    return [...set].sort((a, b) => b.localeCompare(a)); // newest first
  }, [dailyRecords]);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || "");

  const dayRecords = useMemo(
    () => dailyRecords.filter((r) => r.date === selectedDate),
    [dailyRecords, selectedDate]
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        📍 Current Attendance Status / 当前考勤状态
      </h3>

      {/* Date selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Date / 日期:</span>
        {dates.slice(0, 14).map((d) => {
          const dow = dailyRecords.find((r) => r.date === d)?.dayOfWeek || "";
          const isWeekend = dow === "周六" || dow === "周日";
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedDate === d
                  ? "border-blue-300 bg-blue-600 text-white shadow-sm"
                  : isWeekend
                    ? "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d}
              <span className="opacity-60 text-[10px]">{dow}</span>
            </button>
          );
        })}
        {dates.length > 14 && (
          <span className="text-xs text-gray-400">+{dates.length - 14} more</span>
        )}
      </div>

      {/* Status table */}
      {dayRecords.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          该日期无考勤记录
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Employee / 员工</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Department / 部门</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Check In / 上班</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Check Out / 下班</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Credited Hrs / 计入工时</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Attendance Status / 考勤状态</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Process / 处理</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Source / 数据来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dayRecords.map((r) => (
                <tr key={`${r.employeeId}-${r.date}`} className="hover:bg-blue-50/30">
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="ml-1.5 text-gray-400">{r.employeeId}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">{r.department}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    {r.checkIn ? (
                      <span className="font-mono text-gray-700">{r.checkIn}</span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    {r.checkOut ? (
                      <span className="font-mono text-gray-700">{r.checkOut}</span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    <span className="font-mono font-semibold text-gray-800">{r.creditedWorkHours}h</span>
                    <span className="text-[10px] text-gray-400"> / {r.standardWorkHours}h</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    <StatusBadge status={r.attendanceStatus} type="attendance" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    <StatusBadge status={r.processStatus} type="process" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-500 text-[10px]">
                    {r.sourceTypes.join(" + ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-[10px] text-gray-400">
        Records for {selectedDate}: {dayRecords.length} employee(s)
      </p>
    </div>
  );
}

// ================================================================
// Section 2: Employee Monthly Summary
// ================================================================

function MonthlySummaryTable({
  summaries,
  selectedId,
  onSelect,
}: {
  summaries: MonthlySummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        👥 Employee Monthly Summary / 员工月度考勤汇总
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Employee / 员工</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Dept / 部门</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Total / 总天数</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-emerald-600">Normal / 正常</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-blue-600">Trip / 出差</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-purple-600">Leave / 休假</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-amber-600">Anomaly / 异常</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-orange-600">Pending / 待确认</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
                <span className="text-red-600">High Risk / 高风险</span>
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Credited Hrs / 计入工时</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {summaries.map((emp) => {
              const isSelected = emp.employeeId === selectedId;
              return (
                <tr
                  key={emp.employeeId}
                  onClick={() => onSelect(emp.employeeId)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${
                    isSelected ? "bg-blue-50/60 ring-1 ring-inset ring-blue-200" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-medium text-gray-800">{emp.name}</span>
                    <span className="ml-1.5 text-gray-400">{emp.employeeId}</span>
                    {isSelected && (
                      <span className="ml-1.5 text-[10px] text-blue-600">◀ selected</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">{emp.department}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-800">
                    {emp.totalRecordDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-700">
                    {emp.normalAttendanceDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-blue-700">
                    {emp.businessTripDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-purple-700">
                    {emp.leaveDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-medium text-amber-700">
                    {emp.anomalyDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-medium text-orange-700">
                    {emp.pendingReviewDays}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    {emp.highRiskDays > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        {emp.highRiskDays}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono font-semibold text-gray-800">
                    {emp.totalCreditedWorkHours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-gray-400">
        Click a row to view the employee&apos;s full month timecard below. / 点击行查看员工整月考勤明细。
      </p>
    </div>
  );
}

// ================================================================
// Section 3: Employee Timecard
// ================================================================

function Timecard({
  records,
  employeeName,
  employeeId,
}: {
  records: DailyRecord[];
  employeeName: string;
  employeeId: string;
}) {
  const sorted = useMemo(() => records.sort((a, b) => a.date.localeCompare(b.date)), [records]);

  const stats = useMemo(() => {
    const total = sorted.length;
    const normal = sorted.filter((r) => r.attendanceStatus === "正常出勤").length;
    const trip = sorted.filter((r) => r.isBusinessTrip).length;
    const leave = sorted.filter((r) => r.isOnLeave).length;
    const anomaly = total - normal - trip - leave;
    const credited = sorted.reduce((s, r) => s + r.creditedWorkHours, 0);
    return { total, normal, trip, leave, anomaly, credited };
  }, [sorted]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        📅 Employee Timecard / 员工历史考勤明细
      </h3>

      {/* Employee info bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{employeeName}</span>
        <span className="text-xs text-gray-500">{employeeId}</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs text-gray-600">
          Total <span className="font-semibold text-gray-800">{stats.total}</span> days
        </span>
        <span className="text-xs text-emerald-600">
          Normal <span className="font-semibold">{stats.normal}</span>
        </span>
        <span className="text-xs text-blue-600">
          Trip <span className="font-semibold">{stats.trip}</span>
        </span>
        <span className="text-xs text-purple-600">
          Leave <span className="font-semibold">{stats.leave}</span>
        </span>
        <span className="text-xs text-amber-600">
          Anomaly <span className="font-semibold">{stats.anomaly}</span>
        </span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs font-semibold text-gray-800">
          Credited: {stats.credited}h
        </span>
      </div>

      {/* Timecard table */}
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">该员工无考勤记录</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-500">Date / 日期</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-500">DOW / 星期</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Check In / 上班</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Check Out / 下班</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Credited / 计入</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Status / 状态</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Process / 处理</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 text-center font-semibold text-gray-500">Risk / 风险</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-500">Exceptions / 异常类型</th>
                <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-500">Source / 来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((r) => (
                <tr
                  key={`${r.employeeId}-${r.date}`}
                  className={`transition-colors hover:bg-blue-50/30 ${
                    r.riskLevel === "High"
                      ? "bg-red-50/30"
                      : r.attendanceStatus === "考勤异常"
                        ? "bg-amber-50/20"
                        : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-medium text-gray-800">{r.date}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-gray-500">{r.dayOfWeek}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center font-mono">
                    {r.checkIn ? (
                      <span className="text-gray-700">{r.checkIn}</span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center font-mono">
                    {r.checkOut ? (
                      <span className="text-gray-700">{r.checkOut}</span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                    <span className="font-semibold text-gray-800">{r.creditedWorkHours}h</span>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                    <StatusBadge status={r.attendanceStatus} type="attendance" />
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                    <StatusBadge status={r.processStatus} type="process" />
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-center">
                    <RiskBadge level={r.riskLevel} />
                  </td>
                  <td className="px-2.5 py-2.5 text-gray-600 max-w-[200px]">
                    {r.exceptionTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-0.5">
                        {r.exceptionTypes.map((et) => (
                          <span
                            key={et}
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              et === "周末有记录"
                                ? "bg-gray-50 text-gray-500"
                                : et === "出差未审批"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : et === "重复记录" || et === "经理邮箱缺失"
                                    ? "bg-gray-50 text-gray-600"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {et}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-[10px] text-gray-400">
                    {r.sourceTypes.join("+")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400">
        <span>🔴 High risk rows highlighted in light red</span>
        <span>🟡 Anomaly rows highlighted in light amber</span>
        <span>Trip/Leave days without punch records are shown with —</span>
      </div>
    </div>
  );
}

// ================================================================
// Main Export
// ================================================================

export default function AttendanceManagementSection({
  dailyRecords,
  monthlySummaries,
}: Props) {
  // Default select first employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    monthlySummaries[0]?.employeeId || ""
  );

  const selectedRecords = useMemo(
    () =>
      dailyRecords.filter((r) => r.employeeId === selectedEmployeeId),
    [dailyRecords, selectedEmployeeId]
  );

  const selectedEmp = monthlySummaries.find(
    (e) => e.employeeId === selectedEmployeeId
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Monthly Attendance Management
          <span className="ml-2 text-sm font-normal text-gray-500">/ 月度考勤管理</span>
        </h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Phase 2
        </span>
      </div>

      {/* Section 1: Current Status */}
      <CurrentStatus dailyRecords={dailyRecords} />

      {/* Section 2: Monthly Summary */}
      <MonthlySummaryTable
        summaries={monthlySummaries}
        selectedId={selectedEmployeeId}
        onSelect={setSelectedEmployeeId}
      />

      {/* Section 3: Timecard */}
      {selectedEmp && (
        <Timecard
          records={selectedRecords}
          employeeName={selectedEmp.name}
          employeeId={selectedEmp.employeeId}
        />
      )}
    </div>
  );
}
