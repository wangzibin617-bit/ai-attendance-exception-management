import { readFileSync, existsSync } from "fs";
import path from "path";
import RuleCenterSection from "@/components/RuleCenterSection";
import DataImportSection from "@/components/DataImportSection";
import AttendanceManagementSection from "@/components/AttendanceManagementSection";
import DashboardSection from "@/components/DashboardSection";
import ReportExportSection from "@/components/ReportExportSection";
import ManagerNotificationSection from "@/components/ManagerNotificationSection";
import AiAgentWorkflowSection from "@/components/AiAgentWorkflowSection";

// ================================================================
// Flow Steps
// ================================================================

const FLOW_STEPS = [
  { index: 0, label: "Rule Center", labelZh: "异常规则中心" },
  { index: 1, label: "Data Import", labelZh: "数据导入" },
  { index: 2, label: "Monthly Attendance", labelZh: "月度考勤管理" },
  { index: 3, label: "Dashboard", labelZh: "Dashboard" },
  { index: 4, label: "Report Download", labelZh: "报表下载" },
  { index: 5, label: "Manager Notification", labelZh: "经理通知" },
] as const;

const ACTIVE_STEP = 5;

// ================================================================
// Data Loading (server-side)
// ================================================================

function loadJson<T>(filename: string): T | null {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function loadPreview<T>(filename: string, limit = 3): T[] {
  const data = loadJson<T[]>(filename);
  if (!data) return [];
  return data.slice(0, limit);
}

// ================================================================
// Page
// ================================================================

export default function Home() {
  // Phase 1 data
  const summary = loadJson<any>("dataSourceSummary.json");
  const attendancePreview = loadPreview<any>("rawAttendanceRecords.json", 3);
  const tripPreview = loadPreview<any>("rawBusinessTripRecords.json", 3);
  const leavePreview = loadPreview<any>("rawLeaveRecords.json", 3);

  // Phase 2 data
  const dailyRecords = loadJson<any[]>("dailyAttendanceRecords.json");
  const monthlySummaries = loadJson<any[]>("employeeMonthlySummary.json");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Hero ---- */}
      <header className="border-b border-gray-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            AI 智能考勤管理平台
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
            先定义可解释的考勤异常规则，再基于三张原始数据生成月度考勤、异常看板、报表和经理通知。
          </p>

          {/* ---- Flow Steps ---- */}
          <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
            {FLOW_STEPS.map((step, i) => (
              <span key={step.index} className="inline-flex items-center">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium transition-colors ${
                    step.index === ACTIVE_STEP
                      ? "border-blue-300 bg-blue-600 text-white shadow-sm"
                      : step.index < ACTIVE_STEP
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-400"
                  }`}
                >
                  <span className="text-[10px] opacity-70">{step.index}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.labelZh}</span>
                </span>
                {i < FLOW_STEPS.length - 1 && (
                  <svg
                    className="mx-0.5 h-3 w-3 shrink-0 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="space-y-4 py-8">
        {/* Phase 0: Rule Center */}
        <section>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Phase 0: Rule Center
                <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
              </h2>
            </div>
          </div>
          <RuleCenterSection />
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* Phase 1: Data Import */}
        {summary ? (
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Phase 1: Data Import
                  <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
                </h2>
              </div>
            </div>
            <DataImportSection
              summary={summary}
              attendancePreview={attendancePreview}
              tripPreview={tripPreview}
              leavePreview={leavePreview}
            />
          </section>
        ) : (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Data Import
                <span className="ml-2 text-sm font-normal text-gray-500">/ 数据导入</span>
              </h2>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 数据文件尚未生成
              </p>
              <p className="mt-1 text-xs text-amber-600">
                请先运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px]">npm run import</code> 来导入三张原始 Excel 数据。
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* Phase 2: Monthly Attendance */}
        {dailyRecords && monthlySummaries ? (
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Phase 2: Monthly Attendance
                  <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
                </h2>
              </div>
            </div>
            <AttendanceManagementSection
              dailyRecords={dailyRecords}
              monthlySummaries={monthlySummaries}
            />
          </section>
        ) : (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 月度考勤数据尚未生成
              </p>
              <p className="mt-1 text-xs text-amber-600">
                请先运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px]">npm run build:monthly</code> 来生成月度考勤底表。
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* Phase 3: Dashboard */}
        {dailyRecords && monthlySummaries ? (
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Phase 3: Dashboard
                  <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
                </h2>
              </div>
            </div>
            <DashboardSection
              dailyRecords={dailyRecords}
              monthlySummaries={monthlySummaries}
            />
          </section>
        ) : (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 月度考勤数据尚未生成
              </p>
              <p className="mt-1 text-xs text-amber-600">
                请先运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px]">npm run build:monthly</code> 来生成月度考勤底表。
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* Phase 4: Report Export */}
        {dailyRecords && monthlySummaries ? (
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Phase 4: Report Export
                  <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
                </h2>
              </div>
            </div>
            <ReportExportSection
              dailyRecords={dailyRecords}
              monthlySummaries={monthlySummaries}
            />
          </section>
        ) : (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 月度考勤数据尚未生成
              </p>
              <p className="mt-1 text-xs text-amber-600">
                请先运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px]">npm run build:monthly</code> 来生成月度考勤底表。
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* Phase 5: Manager Notification */}
        {dailyRecords ? (
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Phase 5: Manager Notification
                  <span className="ml-2 text-sm font-normal text-green-600">✅ 已完成</span>
                </h2>
              </div>
            </div>
            <ManagerNotificationSection dailyRecords={dailyRecords} />
          </section>
        ) : (
          <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6">
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 月度考勤数据尚未生成
              </p>
              <p className="mt-1 text-xs text-amber-600">
                请先运行 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px]">npm run build:monthly</code> 来生成月度考勤底表。
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <hr className="border-gray-200" />
        </div>

        {/* AI Agent Workflow (Final Summary) */}
        <AiAgentWorkflowSection />
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-400">
        HR Attendance AI · Demo Prototype · All Phases Complete
      </footer>
    </div>
  );
}
