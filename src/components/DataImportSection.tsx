"use client";

import { useState } from "react";

// ================================================================
// Types (mirror the import script output)
// ================================================================

interface FieldInfo {
  index: number;
  name: string;
  type: "string" | "number" | "date" | "time" | "mixed";
}

interface SourceValidation {
  source: string;
  fileName: string;
  sheetName: string;
  rawRowCount: number;
  fields: FieldInfo[];
  requiredFields: string[];
  missingRequiredFields: string[];
  validationPassed: boolean;
  issues: string[];
}

interface DataSourceSummary {
  generatedAt: string;
  phase: string;
  sources: SourceValidation[];
}

interface RawAttendanceRecord {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  department: string | null;
  date: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchBreak: string | null;
  workHours: string | null;
  managerEmail: string | null;
}

interface RawBusinessTripRecord {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  approvalStatusRaw: string | null;
  approvalStatusTrimmed: string | null;
  isApproved: boolean;
  workDays: number | null;
}

interface RawLeaveRecord {
  rowIndex: number;
  employeeId: string | null;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: string | null;
  leaveDays: number | null;
}

// ================================================================
// Props
// ================================================================

interface DataImportSectionProps {
  summary: DataSourceSummary;
  attendancePreview: RawAttendanceRecord[];
  tripPreview: RawBusinessTripRecord[];
  leavePreview: RawLeaveRecord[];
}

// ================================================================
// Helpers
// ================================================================

function FieldTypeBadge({ type }: { type: FieldInfo["type"] }) {
  const colorMap: Record<string, string> = {
    string: "bg-slate-100 text-slate-700 border-slate-200",
    number: "bg-cyan-50 text-cyan-700 border-cyan-200",
    date: "bg-violet-50 text-violet-700 border-violet-200",
    time: "bg-sky-50 text-sky-700 border-sky-200",
    mixed: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${colorMap[type] || colorMap.string}`}
    >
      {type}
    </span>
  );
}

function SourceCard({ src }: { src: SourceValidation }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
          XLS
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{src.fileName}</p>
          <p className="text-xs text-gray-500">Sheet: &quot;{src.sheetName}&quot;</p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
          已导入
        </span>
        {src.validationPassed ? (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            校验通过
          </span>
        ) : (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            校验警告
          </span>
        )}
      </div>

      {/* Record count */}
      <div className="mb-3 border-b border-gray-100 pb-3">
        <span className="text-2xl font-bold text-gray-900">{src.rawRowCount}</span>
        <span className="ml-1.5 text-sm text-gray-500">条记录</span>
      </div>

      {/* Fields */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        Fields / 字段 ({src.fields.length})
      </p>
      <div className="mb-3 flex flex-wrap gap-1">
        {src.fields.map((f) => (
          <span
            key={f.index}
            className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-100 px-2 py-0.5 text-xs text-gray-700"
          >
            {f.name}
            <FieldTypeBadge type={f.type} />
          </span>
        ))}
      </div>

      {/* Issues */}
      {src.issues.length > 0 && (
        <div className="mt-auto rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[11px] text-amber-700 leading-relaxed">
          ⚠ {src.issues.length} issue(s): {src.issues.slice(0, 3).join("; ")}
          {src.issues.length > 3 && ` +${src.issues.length - 3} more`}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Preview Table Components
// ================================================================

function AttendancePreview({ data }: { data: RawAttendanceRecord[] }) {
  if (data.length === 0) return <p className="text-xs text-gray-400 py-4">暂无记录</p>;
  const keys: (keyof RawAttendanceRecord)[] = [
    "rowIndex",
    "employeeId",
    "name",
    "department",
    "date",
    "checkInTime",
    "checkOutTime",
    "managerEmail",
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {keys.map((k) => (
              <th key={k} className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-blue-50/30">
              {keys.map((k) => (
                <td key={k} className="whitespace-nowrap px-2.5 py-2 text-gray-700">
                  {r[k] != null ? String(r[k]) : <span className="text-gray-300 italic">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TripPreview({ data }: { data: RawBusinessTripRecord[] }) {
  if (data.length === 0) return <p className="text-xs text-gray-400 py-4">暂无记录</p>;
  const keys: (keyof RawBusinessTripRecord)[] = [
    "rowIndex",
    "employeeId",
    "name",
    "startDate",
    "endDate",
    "approvalStatusRaw",
    "approvalStatusTrimmed",
    "isApproved",
    "workDays",
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {keys.map((k) => (
              <th key={k} className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">
                {k === "isApproved" ? "approved?" : k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-blue-50/30">
              {keys.map((k) => (
                <td key={k} className="whitespace-nowrap px-2.5 py-2 text-gray-700">
                  {k === "isApproved"
                    ? r.isApproved
                      ? "✅"
                      : "❌"
                    : r[k] != null
                      ? String(r[k])
                      : <span className="text-gray-300 italic">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeavePreview({ data }: { data: RawLeaveRecord[] }) {
  if (data.length === 0) return <p className="text-xs text-gray-400 py-4">暂无记录</p>;
  const keys: (keyof RawLeaveRecord)[] = [
    "rowIndex",
    "employeeId",
    "name",
    "startDate",
    "endDate",
    "dayOfWeek",
    "leaveDays",
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {keys.map((k) => (
              <th key={k} className="whitespace-nowrap px-2.5 py-2 font-semibold text-gray-500">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-blue-50/30">
              {keys.map((k) => (
                <td key={k} className="whitespace-nowrap px-2.5 py-2 text-gray-700">
                  {r[k] != null ? String(r[k]) : <span className="text-gray-300 italic">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ================================================================
// Main Component
// ================================================================

export default function DataImportSection({
  summary,
  attendancePreview,
  tripPreview,
  leavePreview,
}: DataImportSectionProps) {
  const [activePreview, setActivePreview] = useState<"attendance" | "trip" | "leave">(
    "attendance"
  );

  const previewTabs: { key: typeof activePreview; label: string; count: number }[] = [
    { key: "attendance", label: "Attendance / 考勤", count: attendancePreview.length },
    { key: "trip", label: "Biz Trip / 出差", count: tripPreview.length },
    { key: "leave", label: "Leave / 休假", count: leavePreview.length },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Data Import
          <span className="ml-2 text-sm font-normal text-gray-500">/ 数据导入</span>
        </h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Phase 1
        </span>
      </div>

      {/* Data Source Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summary.sources.map((src) => (
          <SourceCard key={src.fileName} src={src} />
        ))}
      </div>

      {/* Field Recognition Summary */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          📋 Field Recognition / 字段识别结果
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Source / 数据源</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Sheet</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Records / 记录数</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-500">Required Fields / 必需字段</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500">Validation / 校验</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.sources.map((src) => (
                <tr key={src.fileName} className="hover:bg-blue-50/30">
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-800">
                    {src.fileName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                    {src.sheetName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-800">
                    {src.rawRowCount}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                    {src.requiredFields.join("、")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center">
                    {src.validationPassed ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✅ Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ⚠ Warnings
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Standardization Notes */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          🔧 Data Standardization / 数据标准化
        </h3>
        <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
            <span className="font-semibold text-gray-800">日期标准化</span>
            <p className="mt-0.5">
              Excel 序列号 → <code className="rounded bg-gray-200 px-1 text-[11px]">yyyy-MM-dd</code> 字符串；
              已为字符串格式的日期直接保留
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
            <span className="font-semibold text-gray-800">时间标准化</span>
            <p className="mt-0.5">
              Excel 小数（0–1 day fraction）→ <code className="rounded bg-gray-200 px-1 text-[11px]">HH:mm</code> 字符串
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
            <span className="font-semibold text-gray-800">空值标准化</span>
            <p className="mt-0.5">
              <code className="rounded bg-gray-200 px-1 text-[11px]">null</code> /{" "}
              <code className="rounded bg-gray-200 px-1 text-[11px]">undefined</code> /{" "}
              <code className="rounded bg-gray-200 px-1 text-[11px]">NaN</code> / 空字符串 →{" "}
              <code className="rounded bg-gray-200 px-1 text-[11px]">null</code>
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
            <span className="font-semibold text-blue-800">⭐ 出差审批标准化</span>
            <p className="mt-0.5 text-blue-700">
              <code className="rounded bg-blue-100 px-1 text-[11px]">approvalStatus.trim() === &quot;Approved&quot;</code>；
              包含尾部空格的 &quot;Approved  &quot; 会被正确识别
            </p>
          </div>
        </div>
      </section>

      {/* Preview Tabs */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          👁️ Standardized Record Preview / 标准化记录预览
          <span className="ml-2 text-xs font-normal text-gray-400">（各表前 3 条）</span>
        </h3>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 w-fit">
          {previewTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActivePreview(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreview === tab.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-gray-400">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Preview content */}
        {activePreview === "attendance" && <AttendancePreview data={attendancePreview} />}
        {activePreview === "trip" && <TripPreview data={tripPreview} />}
        {activePreview === "leave" && <LeavePreview data={leavePreview} />}
      </section>

      {/* Phase Note */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-gray-900">
          📌 Current Phase / 当前阶段说明
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">
          本阶段（Phase 1）只完成三张原始 Excel 的数据导入、字段识别和格式标准化。
          下一阶段（Phase 2）将基于标准化后的数据生成员工月度考勤底表。
          异常识别、Dashboard、报表下载、经理通知等功能将在后续阶段实现。
        </p>
      </section>

      {/* Generated timestamp */}
      <p className="text-center text-[11px] text-gray-400">
        Data imported at: {summary.generatedAt}
      </p>
    </section>
  );
}
