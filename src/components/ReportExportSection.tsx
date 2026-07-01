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
// CSV Utilities
// ================================================================

/** Escape a CSV field value */
function csvEscape(val: string): string {
  if (
    val.includes(",") ||
    val.includes('"') ||
    val.includes("\n") ||
    val.includes("\r")
  ) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/** Join array fields with "; " */
function joinArray(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "";
  return arr.join("; ");
}

/** Format value for CSV cell */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "是" : "否";
  return String(v);
}

/** Build a CSV string with BOM */
function buildCsv(headers: string[], rows: string[][]): string {
  const BOM = "﻿";
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((row) => row.map(csvEscape).join(","));
  return BOM + [headerLine, ...dataLines].join("\n");
}

/** Trigger browser download of a CSV file */
function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ================================================================
// Anomaly detection helper (same as Dashboard)
// ================================================================

function isAnomalyRecord(r: DailyRecord): boolean {
  if (r.processStatus === "待确认") return true;
  if (r.exceptionTypes.length === 0) return false;
  if (
    r.exceptionTypes.length === 1 &&
    r.exceptionTypes[0] === "周末有记录"
  )
    return false;
  return r.exceptionTypes.length > 0;
}

// ================================================================
// Report Definitions
// ================================================================

function buildExceptionDetailRows(
  dailyRecords: DailyRecord[]
): { headers: string[]; rows: string[][] } {
  const anomalyRecords = dailyRecords.filter(isAnomalyRecord);

  const headers = [
    "日期", "员工工号", "姓名", "部门",
    "上班打卡", "下班打卡", "标准工时", "计入工时",
    "考勤状态", "异常类型", "风险等级", "处理状态",
    "规则说明", "经理邮箱", "数据来源",
  ];

  const rows = anomalyRecords.map((r) => [
    cell(r.date),
    cell(r.employeeId),
    cell(r.name),
    cell(r.department),
    cell(r.checkIn),
    cell(r.checkOut),
    cell(r.standardWorkHours),
    cell(r.creditedWorkHours),
    cell(r.attendanceStatus),
    joinArray(r.exceptionTypes),
    cell(r.riskLevel),
    cell(r.processStatus),
    cell(r.ruleExplanation),
    cell(r.managerEmail),
    joinArray(r.sourceTypes),
  ]);

  return { headers, rows };
}

function buildMonthlySummaryRows(
  monthlySummaries: MonthlySummary[]
): { headers: string[]; rows: string[][] } {
  const headers = [
    "员工工号", "姓名", "部门",
    "总记录天数", "正常出勤天数", "出差天数", "休假天数",
    "异常天数", "待确认天数", "高风险天数",
    "本月计入工时", "标准日工时", "最新考勤状态",
    "最新记录日期", "经理邮箱",
  ];

  const rows = monthlySummaries.map((m) => [
    cell(m.employeeId),
    cell(m.name),
    cell(m.department),
    cell(m.totalRecordDays),
    cell(m.normalAttendanceDays),
    cell(m.businessTripDays),
    cell(m.leaveDays),
    cell(m.anomalyDays),
    cell(m.pendingReviewDays),
    cell(m.highRiskDays),
    cell(m.totalCreditedWorkHours),
    cell(m.standardWorkHoursPerDay),
    cell(m.latestAttendanceStatus),
    cell(m.latestRecordDate),
    cell(m.managerEmail),
  ]);

  return { headers, rows };
}

function buildDailyDetailRows(
  dailyRecords: DailyRecord[]
): { headers: string[]; rows: string[][] } {
  const headers = [
    "日期", "星期", "员工工号", "姓名", "部门",
    "上班打卡", "下班打卡", "标准工时", "计入工时",
    "是否出差", "是否休假", "考勤状态", "异常类型",
    "风险等级", "处理状态", "规则说明", "数据来源", "经理邮箱",
  ];

  const rows = dailyRecords.map((r) => [
    cell(r.date),
    cell(r.dayOfWeek),
    cell(r.employeeId),
    cell(r.name),
    cell(r.department),
    cell(r.checkIn),
    cell(r.checkOut),
    cell(r.standardWorkHours),
    cell(r.creditedWorkHours),
    cell(r.isBusinessTrip),
    cell(r.isOnLeave),
    cell(r.attendanceStatus),
    joinArray(r.exceptionTypes),
    cell(r.riskLevel),
    cell(r.processStatus),
    cell(r.ruleExplanation),
    joinArray(r.sourceTypes),
    cell(r.managerEmail),
  ]);

  return { headers, rows };
}

// ================================================================
// Components
// ================================================================

function ReportCard({
  title,
  titleZh,
  dataSource,
  scope,
  recordCount,
  useCase,
  filename,
  onDownload,
}: {
  title: string;
  titleZh: string;
  dataSource: string;
  scope: string;
  recordCount: number;
  useCase: string;
  filename: string;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
          CSV
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{titleZh}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mb-3 space-y-1.5 text-[11px] text-gray-500">
        <div className="flex justify-between">
          <span>Data Source / 数据来源</span>
          <span className="font-medium text-gray-700">{dataSource}</span>
        </div>
        <div className="flex justify-between">
          <span>Scope / 导出范围</span>
          <span className="font-medium text-gray-700">{scope}</span>
        </div>
        <div className="flex justify-between">
          <span>Records / 记录数</span>
          <span className="font-semibold text-gray-900">{recordCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Use Case / 适用场景</span>
          <span className="font-medium text-gray-700 text-right max-w-[140px]">{useCase}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-3 border-b border-gray-100" />

      {/* Filename */}
      <p className="mb-3 text-[10px] text-gray-400 font-mono truncate" title={filename}>
        {filename}
      </p>

      {/* Download button */}
      <button
        type="button"
        onClick={onDownload}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download CSV / 下载
      </button>
    </div>
  );
}

// ================================================================
// Preview Table
// ================================================================

type PreviewTab = "exception" | "monthly" | "daily";

function PreviewArea({
  dailyRecords,
  monthlySummaries,
}: {
  dailyRecords: DailyRecord[];
  monthlySummaries: MonthlySummary[];
}) {
  const [tab, setTab] = useState<PreviewTab>("exception");

  const tabs: { key: PreviewTab; label: string; labelZh: string }[] = [
    { key: "exception", label: "Exception Detail", labelZh: "异常明细" },
    { key: "monthly", label: "Monthly Summary", labelZh: "月度汇总" },
    { key: "daily", label: "Daily Detail", labelZh: "每日明细" },
  ];

  const previewData = useMemo(() => {
    switch (tab) {
      case "exception": {
        const { headers, rows } = buildExceptionDetailRows(dailyRecords);
        return { headers, rows: rows.slice(0, 5) };
      }
      case "monthly": {
        const { headers, rows } = buildMonthlySummaryRows(monthlySummaries);
        return { headers, rows };
      }
      case "daily": {
        const { headers, rows } = buildDailyDetailRows(dailyRecords);
        return { headers, rows: rows.slice(0, 5) };
      }
    }
  }, [tab, dailyRecords, monthlySummaries]);

  return (
    <div>
      {/* Tab buttons */}
      <div className="mb-3 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label} {t.labelZh}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {previewData.headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {previewData.rows.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="whitespace-nowrap px-2.5 py-2 text-gray-700"
                  >
                    {cell || <span className="text-gray-300 italic">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-gray-400">
        Preview: first {previewData.rows.length} row(s) — full data available via download
      </p>
    </div>
  );
}

// ================================================================
// Main Component
// ================================================================

export default function ReportExportSection({
  dailyRecords,
  monthlySummaries,
}: Props) {
  // Pre-compute report data
  const exceptionData = useMemo(
    () => buildExceptionDetailRows(dailyRecords),
    [dailyRecords]
  );
  const monthlyData = useMemo(
    () => buildMonthlySummaryRows(monthlySummaries),
    [monthlySummaries]
  );
  const dailyData = useMemo(
    () => buildDailyDetailRows(dailyRecords),
    [dailyRecords]
  );

  const handleExceptionDownload = () => {
    const csv = buildCsv(exceptionData.headers, exceptionData.rows);
    downloadCsv("exception_detail_report_2026_03.csv", csv);
  };

  const handleMonthlyDownload = () => {
    const csv = buildCsv(monthlyData.headers, monthlyData.rows);
    downloadCsv("monthly_attendance_summary_2026_03.csv", csv);
  };

  const handleDailyDownload = () => {
    const csv = buildCsv(dailyData.headers, dailyData.rows);
    downloadCsv("daily_attendance_detail_2026_03.csv", csv);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Report Export
          <span className="ml-2 text-sm font-normal text-gray-500">/ 报表下载</span>
        </h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Phase 4
        </span>
      </div>

      <p className="text-sm text-gray-500">
        基于员工每日考勤底表和月度汇总结果，生成可下载的 HR 考勤报表，支持异常跟进和月度归档。
      </p>

      {/* Report Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ReportCard
          title="Exception Detail Report"
          titleZh="异常明细报表"
          dataSource="dailyAttendanceRecords"
          scope="异常记录（待确认 or 有异常类型）"
          recordCount={exceptionData.rows.length}
          useCase="异常跟进与处理"
          filename="exception_detail_report_2026_03.csv"
          onDownload={handleExceptionDownload}
        />
        <ReportCard
          title="Monthly Attendance Summary"
          titleZh="员工月度考勤汇总报表"
          dataSource="employeeMonthlySummary"
          scope="全部员工月度汇总"
          recordCount={monthlyData.rows.length}
          useCase="月度考勤归档"
          filename="monthly_attendance_summary_2026_03.csv"
          onDownload={handleMonthlyDownload}
        />
        <ReportCard
          title="Daily Attendance Detail"
          titleZh="员工每日考勤明细报表"
          dataSource="dailyAttendanceRecords"
          scope="全部每日考勤记录"
          recordCount={dailyData.rows.length}
          useCase="详细考勤审计"
          filename="daily_attendance_detail_2026_03.csv"
          onDownload={handleDailyDownload}
        />
      </div>

      {/* Data Source Notice */}
      <section className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700">
        💡 报表下载不重新计算原始 Excel，而是直接基于 Phase 2 生成的员工每日考勤底表和员工月度汇总结果，保证报表、Dashboard 和员工历史考勤数据口径一致。
      </section>

      {/* CSV Format Note */}
      <section className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500">
        <span className="font-medium text-gray-700">CSV Format / 格式说明：</span>
        UTF-8 BOM 编码，Excel 直接打开无乱码；数组字段用 &quot;; &quot; 拼接；空值留空；字段含逗号或换行时自动双引号转义。
      </section>

      {/* Preview Area */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          👁️ Report Preview / 报表预览
        </h3>
        <PreviewArea dailyRecords={dailyRecords} monthlySummaries={monthlySummaries} />
      </section>
    </div>
  );
}
