'use client';

import { useMemo, useState } from 'react';
import AiWorkflowCard from '@/components/AiWorkflowCard';
import NotificationsSection from '@/components/NotificationsSection';
import { FilterState, ProcessedRecord } from '@/components/DashboardSection';
import ExceptionsSection from '@/components/ExceptionsSection';
import Navbar from '@/components/Navbar';
import OverviewSection from '@/components/OverviewSection';

export default function HomeClient({ data }: { data: ProcessedRecord[] }) {
  const [filter, setFilter] = useState<FilterState>({ type: 'all', value: '' });

  const stats = useMemo(() => {
    const total = data.length;
    const normal = data.filter((record) => record.status === '正常').length;
    const trip = data.filter((record) => record.isBusinessTrip).length;
    const leave = data.filter((record) => record.isOnLeave).length;
    const pending = data.filter((record) => record.status === '待经理确认').length;
    const anomalyRate = total > 0 ? ((pending / total) * 100).toFixed(1) : '0';

    const uniqueTrips = new Map<string, NonNullable<ProcessedRecord['matchedBusinessTrip']>>();
    const uniqueLeaves = new Map<string, NonNullable<ProcessedRecord['matchedLeave']>>();

    data.forEach((record) => {
      if (record.matchedBusinessTrip) {
        const tripRecord = record.matchedBusinessTrip;
        uniqueTrips.set(`${tripRecord.employeeId}-${tripRecord.startDate}-${tripRecord.endDate}`, tripRecord);
      }
      if (record.matchedLeave) {
        const leaveRecord = record.matchedLeave;
        uniqueLeaves.set(`${leaveRecord.employeeId}-${leaveRecord.startDate}-${leaveRecord.endDate}`, leaveRecord);
      }
    });

    return { total, normal, trip, leave, pending, anomalyRate, uniqueTrips: uniqueTrips.size, uniqueLeaves: uniqueLeaves.size };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="pb-2 pt-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">AI 智能考勤管理平台</h1>
          <p className="mt-2 text-base text-slate-600">AI Attendance Management Platform</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            将传统月度考勤统计升级为实时识别、实时展示、实时解释的 AI 智能考勤管理平台。
          </p>
        </section>

        <OverviewSection total={stats.total} normal={stats.normal} trip={stats.trip} leave={stats.leave} pending={stats.pending} anomalyRate={stats.anomalyRate} />
        <ExceptionsSection data={data} filter={filter} />
        <NotificationsSection data={data} />
        <AiWorkflowCard />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          HR Attendance AI · Demo Prototype · 仅供面试展示使用
        </div>
      </footer>
    </div>
  );
}
