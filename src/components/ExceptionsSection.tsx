'use client';

import { useMemo, useState } from 'react';
import { applyDashboardFilter, FilterState, ProcessedRecord } from './DashboardSection';

interface ExceptionsSectionProps {
  data: ProcessedRecord[];
  filter: FilterState;
}

const severityLabel: Record<string, string> = {
  normal: '正常',
  low: '低',
  medium: '中',
  high: '高',
};

export default function ExceptionsSection({ data, filter }: ExceptionsSectionProps) {
  const exceptionRecords = useMemo(() => {
    return applyDashboardFilter(data, filter).filter((record) => record.status !== '正常');
  }, [data, filter]);

  const filterKey = `${filter.type}:${filter.value}`;
  const firstKey = getRecordKey(exceptionRecords[0]);
  const [selection, setSelection] = useState({ filterKey: '', recordKey: '' });
  const effectiveSelectedKey = selection.filterKey === filterKey ? selection.recordKey : firstKey;
  const selectedRecord = exceptionRecords.find((record) => getRecordKey(record) === effectiveSelectedKey) ?? exceptionRecords[0];

  return (
    <section id="exceptions" className="scroll-mt-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">
            Exceptions <span className="ml-2 text-sm font-normal text-slate-500">/ 异常详情</span>
          </h2>
        </div>
        <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
          {exceptionRecords.length} 条异常记录
        </span>
      </div>

      <p className="-mt-3 mb-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        异常详情区域跟随 Dashboard 筛选结果联动。筛选变化后默认选中第一条异常记录，点击左侧不同记录可查看对应规则解释。
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">异常记录列表</h3>
            <p className="mt-1 text-xs text-slate-500">当前筛选下默认选中第一条</p>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-2">
            {exceptionRecords.map((record) => {
              const key = getRecordKey(record);
              const active = key === getRecordKey(selectedRecord);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelection({ filterKey, recordKey: key })}
                  className={`mb-2 w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    active ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{record.name || record.employeeId}</span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{record.exceptionType}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {record.date} · 部门 {record.department} · {record.employeeId}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {record.checkIn ?? '-'} 至 {record.checkOut ?? '-'} · {record.status}
                  </div>
                </button>
              );
            })}
            {exceptionRecords.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">当前筛选下没有异常记录</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {selectedRecord ? <ExceptionDetail record={selectedRecord} allData={data} /> : <EmptyDetail />}
        </div>
      </div>
    </section>
  );
}

function ExceptionDetail({ record, allData }: { record: ProcessedRecord; allData: ProcessedRecord[] }) {
  const employeeHistory = useMemo(() => {
    return allData
      .filter((r) => r.employeeId === record.employeeId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allData, record.employeeId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{record.name || record.employeeId}</h3>
          <p className="mt-1 text-sm text-slate-500">{record.date} 的考勤异常详情</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>{record.status}</Pill>
          <Pill tone="amber">{record.exceptionType}</Pill>
          <Pill tone={record.severity === 'high' ? 'red' : 'blue'}>严重程度：{severityLabel[record.severity] ?? record.severity}</Pill>
        </div>
      </div>

      <InfoGrid
        title="员工基础信息"
        items={[
          ['员工工号', record.employeeId],
          ['姓名', record.name || '-'],
          ['部门', `部门 ${record.department}`],
          ['直线经理邮箱', record.managerEmail],
          ['历史异常次数', `${record.historicalCount} 次`],
        ]}
      />

      <InfoGrid
        title="考勤记录"
        items={[
          ['日期', record.date],
          ['上班打卡', record.checkIn ?? '缺失'],
          ['下班打卡', record.checkOut ?? '缺失'],
          ['考勤状态', record.status],
          ['异常类型', record.exceptionType],
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MatchCard
          title="出差匹配"
          matched={record.isBusinessTrip}
          emptyText="未匹配到审批通过的出差记录"
          rows={record.matchedBusinessTrip ? [
            ['出差员工', `${record.matchedBusinessTrip.name} (${record.matchedBusinessTrip.employeeId})`],
            ['开始日期', record.matchedBusinessTrip.startDate],
            ['结束日期', record.matchedBusinessTrip.endDate],
            ['审批状态', record.matchedBusinessTrip.status],
            ['工作日', `${record.matchedBusinessTrip.workDays} 天`],
          ] : []}
        />
        <MatchCard
          title="休假匹配"
          matched={record.isOnLeave}
          emptyText="未匹配到休假记录"
          rows={record.matchedLeave ? [
            ['休假员工', `${record.matchedLeave.name} (${record.matchedLeave.employeeId})`],
            ['开始日期', record.matchedLeave.startDate],
            ['结束日期', record.matchedLeave.endDate],
            ['星期', record.matchedLeave.dayOfWeek],
            ['休假天数', `${record.matchedLeave.leaveDays} 天`],
          ] : []}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-900">规则判断说明</h4>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>状态判断：{record.status === '待经理确认' ? '未被出差或休假记录覆盖，需要经理核实。' : `该记录已被系统识别为“${record.status}”。`}</li>
          <li>打卡判断：上班打卡 {record.checkIn ?? '缺失'}，下班打卡 {record.checkOut ?? '缺失'}，异常类型为 {record.exceptionType}。</li>
          <li>匹配判断：出差匹配 {record.isBusinessTrip ? '是' : '否'}，休假匹配 {record.isOnLeave ? '是' : '否'}。</li>
        </ul>
      </div>

      {/* ── Monthly Summary ── */}
      <MonthlySummary history={employeeHistory} />

      {/* ── Employee History ── */}
      <div>
        <h4 className="mb-1 text-sm font-semibold text-slate-900">
          Employee Attendance History
          <span className="ml-2 text-xs font-normal text-slate-500">/ 员工历史考勤记录</span>
        </h4>
        <p className="mb-3 text-xs text-slate-500">
          展示该员工本月所有考勤记录，帮助 HR 判断异常是否为偶发情况或连续异常。
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">日期</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">上班打卡</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">下班打卡</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">状态</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">异常类型</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">严重程度</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-600">出差</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-600">休假</th>
              </tr>
            </thead>
            <tbody>
              {employeeHistory.map((h) => {
                const isSelected = h.date === record.date && h.employeeId === record.employeeId;
                return (
                  <tr
                    key={`${h.employeeId}-${h.date}`}
                    className={`border-b border-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className={`px-3 py-2.5 whitespace-nowrap ${isSelected ? 'font-semibold text-blue-700' : 'text-slate-700'}`}>
                      {isSelected && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      {h.date}
                    </td>
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap text-slate-600">
                      {h.checkIn ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap text-slate-600">
                      {h.checkOut ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {h.exceptionType === '正常' || h.exceptionType === '已出差' || h.exceptionType === '已休假' ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="text-slate-700">{h.exceptionType}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <SeverityBadge severity={h.severity} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {h.isBusinessTrip ? (
                        <span className="text-emerald-600 font-medium">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {h.isOnLeave ? (
                        <span className="text-purple-600 font-medium">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-950">fallbackExplanation</h4>
        <p className="mt-2 text-sm leading-relaxed text-blue-900">{record.fallbackExplanation || '暂无 AI 解释。'}</p>
      </div>
    </div>
  );
}

function InfoGrid({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
      <dl className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MatchCard({ title, matched, emptyText, rows }: { title: string; matched: boolean; emptyText: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <Pill tone={matched ? 'blue' : 'slate'}>{matched ? '已匹配' : '未匹配'}</Pill>
      </div>
      {rows.length > 0 ? (
        <dl className="mt-3 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-right font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'amber' | 'red' | 'blue' }) {
  const className = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }[tone];

  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    '正常': 'bg-emerald-50 text-emerald-700',
    '已出差': 'bg-blue-50 text-blue-700',
    '已休假': 'bg-purple-50 text-purple-700',
    '待经理确认': 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    normal: 'bg-emerald-50 text-emerald-700',
    low: 'bg-blue-50 text-blue-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
  };
  const label: Record<string, string> = {
    normal: '正常',
    low: '低',
    medium: '中',
    high: '高',
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${map[severity] ?? 'bg-slate-100 text-slate-600'}`}>
      {label[severity] ?? severity}
    </span>
  );
}

// ─── Monthly Attendance Summary ─────────────────────────────────────────────

function parseTimeToHours(time: string | null): number | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function calculateWorkHours(record: ProcessedRecord): number {
  const checkInH = parseTimeToHours(record.checkIn);
  const checkOutH = parseTimeToHours(record.checkOut);
  if (checkInH === null || checkOutH === null) return 0;
  let hours = checkOutH - checkInH;
  if (hours < 0) hours += 24;
  if (hours > 6) hours -= 1; // deduct 1h lunch break
  return Math.max(0, hours);
}

function MonthlySummary({ history }: { history: ProcessedRecord[] }) {
  const totalRecords = history.length;
  const totalWorkHours = history.reduce((sum, r) => sum + calculateWorkHours(r), 0);
  const normalDays = history.filter((r) => r.status === '正常').length;
  const tripDays = history.filter((r) => r.isBusinessTrip).length;
  const leaveDays = history.filter((r) => r.isOnLeave).length;
  const pendingDays = history.filter((r) => r.status === '待经理确认').length;
  const anomalyDays = history.filter(
    (r) => r.status !== '正常' && r.status !== '已出差' && r.status !== '已休假',
  ).length;
  const avgDailyHours =
    totalRecords > 0 ? (totalWorkHours / totalRecords).toFixed(1) : '0';

  const conclusions: string[] = [];
  if (pendingDays >= 5) {
    conclusions.push('该员工本月存在较多待确认考勤异常，建议 HR 与直线经理重点跟进。');
  }
  if (tripDays > 0) {
    conclusions.push('该员工本月存在出差记录，部分考勤异常可能由出差安排解释。');
  }
  if (leaveDays > 0) {
    conclusions.push('该员工本月存在休假记录，考勤判断时需结合休假审批情况。');
  }
  if (normalDays > 0 && normalDays / totalRecords >= 0.6) {
    conclusions.push('该员工本月整体出勤较稳定。');
  }

  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-900">
        Monthly Attendance Summary
        <span className="ml-2 text-xs font-normal text-slate-500">/ 月度考勤汇总</span>
      </h4>
      <p className="mb-3 text-xs text-slate-500">
        汇总该员工本月工时、出勤、出差、休假和异常情况，帮助 HR 快速判断考勤状态。
      </p>

      {/* Metric cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="本月记录数" value={`${totalRecords} 天`} tone="slate" />
        <SummaryCard
          label="本月总工时"
          value={`${totalWorkHours.toFixed(1)} h`}
          tone="blue"
        />
        <SummaryCard label="正常出勤" value={`${normalDays} 天`} tone="emerald" />
        <SummaryCard label="出差天数" value={`${tripDays} 天`} tone="blue" />
        <SummaryCard label="休假天数" value={`${leaveDays} 天`} tone="purple" />
        <SummaryCard label="待经理确认" value={`${pendingDays} 天`} tone="amber" />
        <SummaryCard label="异常天数" value={`${anomalyDays} 天`} tone="red" />
        <SummaryCard label="平均每日工时" value={`${avgDailyHours} h`} tone="slate" />
      </div>

      {/* Conclusion card */}
      {conclusions.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h5 className="text-xs font-semibold text-blue-900 mb-2">月度总结</h5>
          <ul className="space-y-1">
            {conclusions.map((text, i) => (
              <li key={i} className="text-xs text-blue-800 leading-relaxed">
                • {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'slate' | 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
}) {
  const dotColor = {
    slate: 'bg-slate-400',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }[tone];

  const bgColor = {
    slate: 'bg-slate-50',
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
  }[tone];

  return (
    <div className={`rounded-lg border border-slate-200 ${bgColor} px-3 py-2.5`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      <span className="text-base font-bold text-slate-900">{value}</span>
    </div>
  );
}

// ─── Empty Detail ──────────────────────────────────────────────────────────

function EmptyDetail() {
  return <div className="py-20 text-center text-sm text-slate-500">请选择一条异常记录查看详情</div>;
}

function getRecordKey(record?: ProcessedRecord) {
  return record ? `${record.employeeId}-${record.date}-${record.exceptionType}-${record.checkIn ?? ''}-${record.checkOut ?? ''}` : '';
}


