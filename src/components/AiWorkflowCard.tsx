const steps = [
  { title: '原始 Excel 数据', en: 'Raw Excel Data', desc: 'attendance / business_trip / leave', color: 'border-slate-300 bg-slate-100 text-slate-700' },
  { title: '字段识别与格式标准化', en: 'Field Parsing & Normalization', desc: '日期序列号转 yyyy-MM-dd，时间小数转 HH:mm', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { title: '员工工号 + 日期三表匹配', en: 'Cross-Table Matching', desc: '按 Employee ID + Date 匹配出差与休假记录', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { title: '规则引擎识别异常', en: 'Rule Engine Detection', desc: '迟到 / 早退 / 缺卡 / 单次打卡 / 疑似旷工', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { title: 'AI Agent 生成解释', en: 'AI Explanation Generation', desc: '生成异常说明与处理建议', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { title: 'Dashboard / 报表 / 经理通知', en: 'Dashboard & Notifications', desc: '可视化看板、异常详情、直线经理邮件通知', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
];

export default function AiWorkflowCard() {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-purple-500" />
        <h2 className="text-xl font-semibold text-slate-900">AI Agent 工作流 <span className="ml-2 text-sm font-normal text-slate-500">/ Processing Pipeline</span></h2>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="hidden items-start gap-0 sm:flex">
          {steps.map((step, index) => (
            <div key={step.title} className="flex min-w-0 flex-1 items-start">
              <div className={`flex-1 rounded-xl border-2 p-4 text-center ${step.color}`}>
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-current bg-white"><span className="text-sm font-bold">{index + 1}</span></div>
                <p className="text-xs font-semibold leading-tight">{step.title}</p>
                <p className="mt-0.5 text-[10px] opacity-80">{step.en}</p>
                <p className="mt-1 text-[10px] leading-tight opacity-70">{step.desc}</p>
              </div>
              {index < steps.length - 1 ? <div className="shrink-0 px-1 pt-10 text-slate-300">→</div> : null}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          {steps.map((step, index) => (
            <div key={step.title} className={`rounded-xl border-2 p-4 text-center ${step.color}`}>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-current bg-white"><span className="text-sm font-bold">{index + 1}</span></div>
              <p className="text-xs font-semibold leading-tight">{step.title}</p>
              <p className="mt-0.5 text-[10px] opacity-80">{step.en}</p>
              <p className="mt-1 text-[10px] leading-tight opacity-70">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
