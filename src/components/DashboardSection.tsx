"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ================================================================
// Legacy type exports (for backward compat with old components)
// ================================================================

export interface MatchedTrip {
  employeeId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  workDays: number;
}

export interface MatchedLeave {
  employeeId: string;
  name: string;
  startDate: string;
  endDate: string;
  dayOfWeek: string;
  leaveDays: number;
}

export interface ProcessedRecord {
  employeeId: string;
  name: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  managerEmail: string;
  isBusinessTrip: boolean;
  isOnLeave: boolean;
  status: string;
  exceptionType: string;
  severity: string;
  historicalCount: number;
  matchedBusinessTrip: MatchedTrip | null;
  matchedLeave: MatchedLeave | null;
  fallbackExplanation: string;
}

export type FilterType =
  | "all"
  | "abnormal"
  | "status"
  | "severity"
  | "exceptionType"
  | "department";

export interface FilterState {
  type: FilterType;
  value: string;
}

export function applyDashboardFilter(
  data: ProcessedRecord[],
  filter: FilterState
) {
  switch (filter.type) {
    case "abnormal":
      return data.filter((r) => r.status !== "正常");
    case "status":
      return data.filter((r) => r.status === filter.value);
    case "severity":
      return data.filter((r) => r.severity === filter.value);
    case "exceptionType":
      return data.filter((r) => r.exceptionType.includes(filter.value));
    case "department":
      return data.filter((r) => r.department === filter.value);
    default:
      return data;
  }
}

// ================================================================
// Phase 3 Types
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
// Anomaly detection helpers
// ================================================================

/** Real exception types (exclude 已出差, 已休假, 周末有记录 from core distribution) */
const REAL_EXCEPTION_TYPES = [
  "迟到",
  "严重迟到",
  "早退",
  "上班缺卡",
  "下班缺卡",
  "单次打卡",
  "疑似旷工",
  "工时不足",
  "工时异常过长",
  "审批冲突",
  "数据异常",
  "经理邮箱缺失",
  "重复记录",
  "出差未审批",
];

function isAnomalyRecord(r: DailyRecord): boolean {
  if (r.processStatus === "待确认") return true;
  if (r.exceptionTypes.length === 0) return false;
  // If exceptionTypes is ONLY ["周末有记录"], it's NOT an anomaly
  if (
    r.exceptionTypes.length === 1 &&
    r.exceptionTypes[0] === "周末有记录"
  )
    return false;
  return r.exceptionTypes.length > 0;
}

function getRealExceptionTypes(types: string[]): string[] {
  return types.filter((t) => REAL_EXCEPTION_TYPES.includes(t));
}

// ================================================================
// Colors
// ================================================================

const CHART_COLORS = [
  "#2563eb", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#7c3aed", // purple
  "#059669", // emerald
  "#db2777", // pink
  "#0891b2", // cyan
  "#d97706", // orange
  "#4f46e5", // indigo
  "#65a30d", // lime
  "#9333ea", // violet
  "#0d9488", // teal
  "#be123c", // rose
  "#2563eb", // blue
];

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#eab308",
  Normal: "#22c55e",
};

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Normal: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_BADGE: Record<string, string> = {
  "正常出勤": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "已出差": "bg-blue-50 text-blue-700 border-blue-200",
  "已休假": "bg-purple-50 text-purple-700 border-purple-200",
  "考勤异常": "bg-amber-50 text-amber-700 border-amber-200",
  "疑似旷工": "bg-red-50 text-red-700 border-red-200",
  "审批冲突": "bg-red-50 text-red-700 border-red-200",
  "数据异常": "bg-red-50 text-red-700 border-red-200",
};

// ================================================================
// Sub-components
// ================================================================

function KpiCard({
  label,
  labelZh,
  value,
  sub,
  accent,
  onClick,
  active,
}: {
  label: string;
  labelZh: string;
  value: number | string;
  sub?: string;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col rounded-xl border p-4 text-left transition-all hover:shadow-md ${
        active
          ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-200"
          : "border-gray-100 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span className="text-xs font-medium text-gray-500">
          {label}
          <span className="ml-1 text-gray-400">{labelZh}</span>
        </span>
      </div>
      <span className="mt-2 text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="mt-0.5 text-[10px] text-gray-400">{sub}</span>}
    </button>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_BADGE[level] || RISK_BADGE.Normal;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  );
}

// ================================================================
// KPI Cards Row
// ================================================================

function KpiCards({
  totalEmployees,
  totalRecords,
  anomalyEmployees,
  anomalyRecords,
  pendingRecords,
  highRiskRecords,
  anomalyRate,
  activeFilter,
  onFilterChange,
}: {
  totalEmployees: number;
  totalRecords: number;
  anomalyEmployees: number;
  anomalyRecords: number;
  pendingRecords: number;
  highRiskRecords: number;
  anomalyRate: string;
  activeFilter: string;
  onFilterChange: (f: string) => void;
}) {
  const cards = [
    { key: "all", label: "Total Employees", labelZh: "员工总数", value: totalEmployees, accent: "#6b7280" },
    { key: "all", label: "Daily Records", labelZh: "日记录总数", value: totalRecords, accent: "#6b7280" },
    {
      key: "anomalyEmployees",
      label: "Anomaly Employees",
      labelZh: "异常人数",
      value: anomalyEmployees,
      accent: "#f59e0b",
    },
    {
      key: "anomaly",
      label: "Anomaly Records",
      labelZh: "异常记录数",
      value: anomalyRecords,
      accent: "#ef4444",
    },
    {
      key: "pending",
      label: "Pending Review",
      labelZh: "待确认",
      value: pendingRecords,
      accent: "#f97316",
    },
    {
      key: "highRisk",
      label: "High Risk",
      labelZh: "高风险",
      value: highRiskRecords,
      accent: "#dc2626",
    },
    {
      key: "all",
      label: "Anomaly Rate",
      labelZh: "异常率",
      value: `${anomalyRate}%`,
      accent: "#7c3aed",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {cards.map((c) => (
        <KpiCard
          key={c.key + c.label}
          label={c.label}
          labelZh={c.labelZh}
          value={c.value}
          accent={c.accent}
          active={activeFilter === c.key}
          onClick={() => onFilterChange(c.key)}
        />
      ))}
    </div>
  );
}

// ================================================================
// Exception Type Distribution
// ================================================================

function ExceptionTypeChart({ dailyRecords }: { dailyRecords: DailyRecord[] }) {
  const data = useMemo(() => {
    const anomalyRecords = dailyRecords.filter(isAnomalyRecord);
    const counts = new Map<string, number>();
    for (const r of anomalyRecords) {
      for (const et of getRealExceptionTypes(r.exceptionTypes)) {
        counts.set(et, (counts.get(et) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [dailyRecords]);

  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">无异常类型数据</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#475569" }}
            width={60}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value) => [`${value} 次`, "出现次数"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > 6 && (
        <p className="mt-1 text-center text-[10px] text-gray-400">
          共 {data.length} 种异常类型（可横向滚动查看更多）
        </p>
      )}
    </div>
  );
}

// ================================================================
// Department Distribution
// ================================================================

function DepartmentTable({ dailyRecords }: { dailyRecords: DailyRecord[] }) {
  const data = useMemo(() => {
    const anomalyRecords = dailyRecords.filter(isAnomalyRecord);
    const deptMap = new Map<
      string,
      { anomalyCount: number; employees: Set<string>; highRiskCount: number }
    >();
    for (const r of anomalyRecords) {
      const dept = r.department || "—";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { anomalyCount: 0, employees: new Set(), highRiskCount: 0 });
      }
      const entry = deptMap.get(dept)!;
      entry.anomalyCount++;
      entry.employees.add(r.employeeId);
      if (r.riskLevel === "High") entry.highRiskCount++;
    }
    return [...deptMap.entries()]
      .map(([dept, v]) => ({
        department: dept,
        anomalyCount: v.anomalyCount,
        employeeCount: v.employees.size,
        highRiskCount: v.highRiskCount,
      }))
      .sort((a, b) => b.anomalyCount - a.anomalyCount);
  }, [dailyRecords]);

  if (data.length === 0) return <p className="py-6 text-center text-xs text-gray-400">无部门数据</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Department / 部门</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
              Anomaly Records / 异常记录
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
              Employees / 涉及员工
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">
              High Risk / 高风险
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((d) => (
            <tr key={d.department} className="hover:bg-blue-50/30">
              <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-800">
                {d.department}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-800">
                {d.anomalyCount}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-600">
                {d.employeeCount}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center">
                {d.highRiskCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    {d.highRiskCount}
                  </span>
                ) : (
                  <span className="text-gray-300">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ================================================================
// Risk Level Distribution
// ================================================================

function RiskLevelChart({ dailyRecords }: { dailyRecords: DailyRecord[] }) {
  const data = useMemo(() => {
    const anomalyRecords = dailyRecords.filter(isAnomalyRecord);
    const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0, Normal: 0 };
    for (const r of anomalyRecords) {
      counts[r.riskLevel] = (counts[r.riskLevel] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [dailyRecords]);

  if (data.length === 0) return <p className="py-6 text-center text-xs text-gray-400">无风险数据</p>;

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ name, value }) => `${name} (${value})`}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="hidden sm:flex flex-col gap-1.5 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_COLORS[d.name] }}
            />
            <span className="font-medium text-gray-700">{d.name}</span>
            <span className="text-gray-400">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// 7-Day Trend
// ================================================================

function TrendChart({ dailyRecords }: { dailyRecords: DailyRecord[] }) {
  const data = useMemo(() => {
    // Get all unique dates sorted
    const dateSet = new Set(dailyRecords.map((r) => r.date));
    const sortedDates = [...dateSet].sort((a, b) => b.localeCompare(a)); // newest first

    // Last 7 dates that have records (or all if < 7)
    const last7 = sortedDates.slice(0, 7).reverse(); // chronological order

    return last7.map((date) => {
      const dayRecords = dailyRecords.filter((r) => r.date === date);
      const anomalyCount = dayRecords.filter(isAnomalyRecord).length;
      return { date, anomalyCount, totalCount: dayRecords.length };
    });
  }, [dailyRecords]);

  if (data.length === 0) return <p className="py-6 text-center text-xs text-gray-400">无趋势数据</p>;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="anomalyCount"
            name="异常记录"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4, fill: "#ef4444" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="totalCount"
            name="总记录"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#94a3b8" }}
          />
        </LineChart>
      </ResponsiveContainer>
      {data.length < 7 && (
        <p className="mt-1 text-center text-[10px] text-gray-400">
          当前仅 {data.length} 个有记录日期
        </p>
      )}
    </div>
  );
}

// ================================================================
// Drill-down Table
// ================================================================

type DrillFilter =
  | "all"
  | "anomaly"
  | "pending"
  | "highRisk"
  | "late"
  | "missingPunch"
  | "workHours"
  | "approvalData";

const FILTER_OPTIONS: { key: DrillFilter; label: string; labelZh: string }[] = [
  { key: "all", label: "All Anomalies", labelZh: "全部异常" },
  { key: "pending", label: "Pending", labelZh: "待确认" },
  { key: "highRisk", label: "High Risk", labelZh: "高风险" },
  { key: "late", label: "Late/Serious Late", labelZh: "迟到/严重迟到" },
  { key: "missingPunch", label: "Missing Punch", labelZh: "缺卡" },
  { key: "workHours", label: "Work Hours Issue", labelZh: "工时异常" },
  { key: "approvalData", label: "Approval/Data", labelZh: "审批/数据问题" },
];

function filterRecords(records: DailyRecord[], f: DrillFilter): DailyRecord[] {
  switch (f) {
    case "all":
      return records;
    case "pending":
      return records.filter((r) => r.processStatus === "待确认");
    case "highRisk":
      return records.filter((r) => r.riskLevel === "High");
    case "late":
      return records.filter((r) =>
        r.exceptionTypes.some((t) => t === "迟到" || t === "严重迟到")
      );
    case "missingPunch":
      return records.filter((r) =>
        r.exceptionTypes.some(
          (t) => t === "上班缺卡" || t === "下班缺卡" || t === "单次打卡"
        )
      );
    case "workHours":
      return records.filter((r) =>
        r.exceptionTypes.some(
          (t) => t === "工时不足" || t === "工时异常过长"
        )
      );
    case "approvalData":
      return records.filter((r) =>
        r.exceptionTypes.some(
          (t) =>
            t === "审批冲突" ||
            t === "数据异常" ||
            t === "出差未审批" ||
            t === "经理邮箱缺失" ||
            t === "重复记录"
        )
      );
    default:
      return records;
  }
}

function DrillDownTable({ dailyRecords }: { dailyRecords: DailyRecord[] }) {
  const [filter, setFilter] = useState<DrillFilter>("all");

  const anomalyRecords = useMemo(
    () => dailyRecords.filter(isAnomalyRecord),
    [dailyRecords]
  );

  const displayed = useMemo(
    () => filterRecords(anomalyRecords, filter).sort((a, b) => b.date.localeCompare(a.date)),
    [anomalyRecords, filter]
  );

  return (
    <div>
      {/* Filter buttons */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filter === opt.key
                ? "border-blue-300 bg-blue-600 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {opt.label} {opt.labelZh}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="mb-2 text-xs text-gray-400">
        Showing {displayed.length} of {anomalyRecords.length} anomaly records
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Date / 日期</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Employee / 员工</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Dept / 部门</th>
              <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Status / 状态</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">Exceptions / 异常类型</th>
              <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Risk / 风险</th>
              <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold text-gray-500">Process / 处理</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500 hidden lg:table-cell">
                Explanation / 规则说明
              </th>
              <th className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500 hidden xl:table-cell">
                Manager / 经理邮箱
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((r, i) => (
              <tr
                key={`${r.employeeId}-${r.date}-${i}`}
                className={`transition-colors hover:bg-blue-50/30 ${
                  r.riskLevel === "High"
                    ? "bg-red-50/30"
                    : r.processStatus === "待确认"
                      ? "bg-amber-50/20"
                      : ""
                }`}
              >
                <td className="whitespace-nowrap px-2.5 py-2 font-medium text-gray-800">
                  {r.date}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2">
                  <span className="font-medium text-gray-800">{r.name}</span>
                  <span className="ml-1 text-gray-400">{r.employeeId}</span>
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-gray-600">{r.department}</td>
                <td className="whitespace-nowrap px-2.5 py-2 text-center">
                  <StatusBadge status={r.attendanceStatus} />
                </td>
                <td className="px-2.5 py-2 max-w-[180px]">
                  <div className="flex flex-wrap gap-0.5">
                    {r.exceptionTypes.map((et) => (
                      <span
                        key={et}
                        className={`inline-block rounded px-1 py-0.5 text-[10px] ${
                          et === "周末有记录"
                            ? "bg-gray-50 text-gray-500"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-center">
                  <RiskBadge level={r.riskLevel} />
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      r.processStatus === "待确认"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {r.processStatus}
                  </span>
                </td>
                <td className="px-2.5 py-2 text-gray-500 hidden lg:table-cell max-w-[220px] truncate" title={r.ruleExplanation}>
                  {r.ruleExplanation}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-gray-400 hidden xl:table-cell">
                  {r.managerEmail || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================================================================
// Main Dashboard Component
// ================================================================

export default function DashboardSection({ dailyRecords, monthlySummaries }: Props) {
  const [activeKpiFilter, setActiveKpiFilter] = useState<string>("all");

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const totalEmployees = monthlySummaries.length;
    const totalRecords = dailyRecords.length;
    const anomalyEmployees = monthlySummaries.filter(
      (e) => e.anomalyDays > 0 || e.pendingReviewDays > 0
    ).length;
    const anomalyRecords = dailyRecords.filter(isAnomalyRecord).length;
    const pendingRecords = dailyRecords.filter(
      (r) => r.processStatus === "待确认"
    ).length;
    const highRiskRecords = dailyRecords.filter(
      (r) => r.riskLevel === "High"
    ).length;
    const anomalyRate =
      totalRecords > 0
        ? ((anomalyRecords / totalRecords) * 100).toFixed(1)
        : "0";

    return {
      totalEmployees,
      totalRecords,
      anomalyEmployees,
      anomalyRecords,
      pendingRecords,
      highRiskRecords,
      anomalyRate,
    };
  }, [dailyRecords, monthlySummaries]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Dashboard
          <span className="ml-2 text-sm font-normal text-gray-500">/ 异常看板</span>
        </h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Phase 3
        </span>
      </div>

      <p className="text-sm text-gray-500">
        基于员工月度考勤底表提取异常记录，帮助 HR 快速识别异常规模、异常类型和部门分布。
      </p>

      {/* Data Source Notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700">
        💡 本看板不直接从原始 Excel 重新计算，而是基于 Phase 2 生成的员工每日考勤底表进行异常提取，保证 Dashboard 与员工历史考勤数据口径一致。
      </div>

      {/* KPI Cards */}
      <KpiCards
        totalEmployees={kpis.totalEmployees}
        totalRecords={kpis.totalRecords}
        anomalyEmployees={kpis.anomalyEmployees}
        anomalyRecords={kpis.anomalyRecords}
        pendingRecords={kpis.pendingRecords}
        highRiskRecords={kpis.highRiskRecords}
        anomalyRate={kpis.anomalyRate}
        activeFilter={activeKpiFilter}
        onFilterChange={setActiveKpiFilter}
      />

      {/* Charts Row 1: Exception Types + Department */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exception Type Distribution */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            📊 Exception Type Distribution / 异常类型分布
          </h3>
          <ExceptionTypeChart dailyRecords={dailyRecords} />
        </section>

        {/* Department Distribution */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            🏢 Department Distribution / 部门分布
          </h3>
          <DepartmentTable dailyRecords={dailyRecords} />
        </section>
      </div>

      {/* Charts Row 2: Risk Level + Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Level */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            ⚡ Risk Level Distribution / 风险等级分布
          </h3>
          <p className="mb-3 text-[10px] text-gray-400">
            Based on anomaly records only / 仅统计异常记录
          </p>
          <RiskLevelChart dailyRecords={dailyRecords} />
        </section>

        {/* 7-Day Trend */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            📈 Recent 7-Day Trend / 近 7 日异常趋势
          </h3>
          <TrendChart dailyRecords={dailyRecords} />
        </section>
      </div>

      {/* Drill-down Table */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          🔍 Anomaly Drill-Down / 异常下钻明细
        </h3>
        <DrillDownTable dailyRecords={dailyRecords} />
      </section>
    </div>
  );
}
