'use client';

const navItems = [
  { label: 'Overview', zh: '数据概览', href: '#overview' },
  { label: 'Data Import', zh: '数据导入', href: '#data-import' },
  { label: 'Dashboard', zh: '考勤看板', href: '#dashboard' },
  { label: 'Exceptions', zh: '异常详情', href: '#exceptions' },
  { label: 'Notifications', zh: '经理通知', href: '#notifications' },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="#overview" className="flex shrink-0 items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              AI
            </span>
            <span className="hidden sm:block">
              <span className="text-lg font-semibold text-slate-900">HR Attendance AI</span>
              <span className="ml-2 text-xs font-normal text-slate-500">智能考勤管理平台</span>
            </span>
          </a>

          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="inline-flex whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-blue-700 no-underline transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="text-xs sm:hidden">{item.zh}</span>
                  <span className="ml-1.5 hidden text-xs text-slate-500 sm:inline">/ {item.zh}</span>
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="text-xs sm:hidden">{item.zh}</span>
                  <span className="ml-1.5 hidden text-xs text-slate-400 sm:inline">/ {item.zh}</span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
