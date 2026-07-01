interface OverviewSectionProps {
  total: number;
  normal: number;
  trip: number;
  leave: number;
  pending: number;
  anomalyRate: string;
}

interface KpiCardProps {
  label: string;
  enLabel: string;
  value: number | string;
  suffix?: string;
  accent: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  subtitle?: string;
}

function KpiCard({ label, enLabel, value, suffix, accent, subtitle }: KpiCardProps) {
  const dotClass = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    red: 'bg-red-600',
    slate: 'bg-slate-500',
  }[accent];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{enLabel}</p>
          <p className="mt-0.5 text-xs text-slate-500">{label}</p>
        </div>
        <span className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {suffix ? <span className="ml-1 text-sm text-slate-500">{suffix}</span> : null}
      </div>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export default function OverviewSection({
  total,
  normal,
  trip,
  leave,
  pending,
  anomalyRate,
}: OverviewSectionProps) {
  return (
    <section id="overview" className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-blue-600" />
        <h2 className="text-xl font-semibold text-slate-900">
          Overview <span className="ml-2 text-sm font-normal text-slate-500">/ 数据概览</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard label="总考勤记录" enLabel="Total Records" value={total} suffix="条" accent="slate" />
        <KpiCard
          label="正常出勤"
          enLabel="Normal"
          value={normal}
          suffix="条"
          accent="emerald"
          subtitle={`占比 ${total > 0 ? ((normal / total) * 100).toFixed(1) : '0'}%`}
        />
        <KpiCard label="已出差" enLabel="Business Trip" value={trip} suffix="条" accent="blue" />
        <KpiCard label="已休假" enLabel="On Leave" value={leave} suffix="条" accent="blue" />
        <KpiCard label="待经理确认" enLabel="Pending Review" value={pending} suffix="条" accent="red" />
        <KpiCard label="异常率" enLabel="Anomaly Rate" value={anomalyRate} suffix="%" accent="amber" />
      </div>
    </section>
  );
}
