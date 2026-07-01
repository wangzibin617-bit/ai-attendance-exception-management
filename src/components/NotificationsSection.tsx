'use client';

import { useMemo, useState } from 'react';
import type { ProcessedRecord } from './DashboardSection';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SendLogEntry {
  time: string;
  name: string;
  managerEmail: string;
  exceptionType: string;
}

// ─── Badge Helpers ─────────────────────────────────────────────────────────

const severityLabel: Record<string, string> = {
  normal: '正常',
  low: '低',
  medium: '中',
  high: '高',
};

const severityClass: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700',
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        severityClass[severity] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {severityLabel[severity] ?? severity}
    </span>
  );
}

// ─── Notification Text Generator ───────────────────────────────────────────

function generateNotification(record: ProcessedRecord): string {
  const { name, date, exceptionType, historicalCount, severity } = record;
  const lines: string[] = [];

  // Body
  if (historicalCount <= 1) {
    lines.push(
      `您好，系统检测到您团队成员 ${name} 在 ${date} 存在 ${exceptionType} 情况，目前未匹配到有效出差或休假记录。请您协助确认是否需要补卡、说明或进一步处理。`,
    );
  } else {
    lines.push(
      `您好，系统检测到您团队成员 ${name} 本月已出现 ${historicalCount} 次考勤异常，本次异常为 ${exceptionType}。建议您及时核实原因，并根据公司考勤流程进行跟进。`,
    );
  }

  // High severity addendum
  if (severity === 'high') {
    lines.push('');
    lines.push('该记录已被系统标记为高风险异常，请优先处理。');
  }

  return lines.join('\n');
}

// ─── CSV Export ────────────────────────────────────────────────────────────

function exportCSV(records: ProcessedRecord[]) {
  const headers = [
    'date',
    'employeeId',
    'name',
    'department',
    'checkIn',
    'checkOut',
    'status',
    'exceptionType',
    'severity',
    'managerEmail',
    'fallbackExplanation',
  ];

  const rows = records.map((r) =>
    [
      r.date,
      r.employeeId,
      r.name,
      r.department,
      r.checkIn ?? '',
      r.checkOut ?? '',
      r.status,
      r.exceptionType,
      r.severity,
      r.managerEmail,
      `"${(r.fallbackExplanation || '').replace(/"/g, '""')}"`,
    ].join(','),
  );

  const bom = '﻿';
  const csv = bom + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `attendance_exceptions_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function NotificationsSection({ data }: { data: ProcessedRecord[] }) {
  const pendingRecords = useMemo(
    () => data.filter((r) => r.status === '待经理确认'),
    [data],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [sendLog, setSendLog] = useState<SendLogEntry[]>([]);

  const selectedRecord = pendingRecords.find(
    (r) => recordKey(r) === selectedId,
  );

  function handleSimulateSend(record: ProcessedRecord) {
    const key = recordKey(record);
    setSentSet((prev) => new Set(prev).add(key));
    const now = new Date();
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setSendLog((prev) => [
      {
        time,
        name: record.name,
        managerEmail: record.managerEmail,
        exceptionType: record.exceptionType,
      },
      ...prev,
    ]);
  }

  const notificationText = selectedRecord
    ? generateNotification(selectedRecord)
    : '';

  return (
    <section id="notifications" className="scroll-mt-24">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-amber-500" />
          <h2 className="text-xl font-semibold text-slate-900">
            Notifications
            <span className="ml-2 text-sm font-normal text-slate-500">
              / 经理通知
            </span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            const abnormal = data.filter((r) => r.status !== '正常');
            exportCSV(abnormal);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          导出异常报表 CSV
        </button>
      </div>

      <p className="-mt-3 mb-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        系统基于待确认异常记录，自动生成面向直线经理的提醒内容，并支持导出异常报表用于 HR
        跟进。
      </p>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* ── Left: Pending records list ── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              待通知异常
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {pendingRecords.length} 条待经理确认记录
            </p>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-2">
            {pendingRecords.map((record) => {
              const key = recordKey(record);
              const active = key === selectedId;
              const sent = sentSet.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedId(key)}
                  className={`mb-2 w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      {record.name}
                    </span>
                    <SeverityBadge severity={record.severity} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {record.date} · 部门 {record.department} · {record.employeeId}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {record.exceptionType}
                    </span>
                    {sent && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ 已发送
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {pendingRecords.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-slate-400">
                暂无待确认异常记录
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Notification preview ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {selectedRecord ? (
            <div className="space-y-5">
              {/* Email card */}
              <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                {/* Email header */}
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      邮件预览
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="shrink-0 text-slate-500">收件人：</span>
                      <span className="font-medium text-slate-800">
                        {selectedRecord.managerEmail}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="shrink-0 text-slate-500">主题：</span>
                      <span className="font-semibold text-slate-900">
                        考勤异常提醒 / Attendance Exception Alert
                      </span>
                    </div>
                  </div>
                </div>
                {/* Email body */}
                <div className="px-5 py-5">
                  <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    source: rule-based fallback
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {notificationText}
                  </div>
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    <p className="font-medium text-slate-600 mb-2">
                      📋 异常详情
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>日期：{selectedRecord.date}</span>
                      <span>员工：{selectedRecord.name}</span>
                      <span>部门：{selectedRecord.department}</span>
                      <span>工号：{selectedRecord.employeeId}</span>
                      <span>
                        打卡：{selectedRecord.checkIn ?? '—'} ~{' '}
                        {selectedRecord.checkOut ?? '—'}
                      </span>
                      <span>当月异常次数：{selectedRecord.historicalCount}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-400">
                    <p>此邮件由 HR Attendance AI 系统自动生成，请勿回复。</p>
                    <p>如有疑问请联系 HR 部门。</p>
                  </div>
                </div>
              </div>

              {/* Send button */}
              <div className="flex items-center gap-3">
                {sentSet.has(recordKey(selectedRecord)) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    已模拟发送
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulateSend(selectedRecord)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                    模拟发送提醒
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="mb-3 h-10 w-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <p className="text-sm text-slate-400">
                请从左侧选择一条异常记录
              </p>
              <p className="mt-1 text-xs text-slate-400">
                选择后将显示经理通知预览
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Send Log ── */}
      {sendLog.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              发送记录
              <span className="ml-2 text-xs font-normal text-slate-400">
                Simulated Send Log
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    员工姓名
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    直线经理邮箱
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    异常类型
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {sendLog.map((entry, i) => (
                  <tr
                    key={`${entry.time}-${i}`}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {entry.time}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {entry.name}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {entry.managerEmail}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        {entry.exceptionType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ 已模拟发送
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function recordKey(r: ProcessedRecord): string {
  return `${r.employeeId}-${r.date}`;
}
