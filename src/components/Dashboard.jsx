import React from 'react';
import {
  TrendingUp,
  Hourglass,
  BadgePercent,
  ArrowRight,
  FileStack,
  CalendarDays,
  Rss,
  CircleDollarSign,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, accentColor }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>
      {sub && <p className="text-xs text-slate-400 font-medium">{sub}</p>}
    </div>
  );
}

function TransactionRow({ receipt, onView }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 rounded-lg px-2 -mx-2 transition-all duration-150 hover:bg-slate-50 group">
      <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange transition-transform duration-200 group-hover:scale-110">
        <CircleDollarSign className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 truncate">{receipt.duesName}</p>
        <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{receipt.category}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900">
          &#8358;{receipt.amount.toLocaleString()}
        </p>
        <p className="text-2xs text-slate-400 mt-0.5">
          {new Date(receipt.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <button
        onClick={() => onView(receipt)}
        className="btn-secondary h-7 px-2.5 text-2xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        View
      </button>
    </div>
  );
}

export default function Dashboard({ user = {}, dues = [], receipts = [], onViewReceipt, onNavigate }) {
  const isReceiptForDue = (r, d) => (
    (r?.duesName && d?.name && r.duesName.trim().toLowerCase() === d.name.trim().toLowerCase()) ||
    (r?.duesId && d?.id && r.duesId === d.id) ||
    (r?.dues_id && d?.id && r.dues_id === d.id)
  );

  const duesList = Array.isArray(dues) ? dues : [];
  const receiptsList = Array.isArray(receipts) ? receipts : [];

  const totalPaid    = receiptsList.reduce((s, r) => s + (Number(r?.amount) || 0), 0);
  const paidDues     = duesList.filter(d => receiptsList.some(r => isReceiptForDue(r, d)));
  const pendingDues  = duesList.filter(d => !receiptsList.some(r => isReceiptForDue(r, d)));
  const totalPending = pendingDues.reduce((s, d) => s + (Number(d?.amount) || 0), 0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const overdueDues  = pendingDues.filter(d => d?.isOverdue || (d?.deadline && new Date(d.deadline) < today));
  const pct          = duesList.length ? Math.round((paidDues.length / duesList.length) * 100) : 0;

  const recentReceipts = [...receiptsList]
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
    .slice(0, 5);

  const r     = 38;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const userName = user?.name || 'User';
  const firstName = userName.split(' ')[0] || 'User';

  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDuration: '0.3s' }}>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            FUTA &middot; Academic Session 2025/2026
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === 'student'
              ? `${user?.level || 'Student'}  -  ${user?.department || 'FUTA'}`
              : `${user?.title || 'Staff Member'}  -  ${user?.department || 'FUTA'}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdueDues.length > 0 && (
            <span className="badge-error text-2xs font-semibold">
              {overdueDues.length} Overdue
            </span>
          )}
          <button
            onClick={() => onNavigate && onNavigate('dues')}
            className="btn-primary text-xs h-9 px-3.5"
          >
            Pay Outstanding Dues
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        <StatCard
          label="Total Cleared"
          value={`\u20A6${totalPaid.toLocaleString()}`}
          sub={`${paidDues.length} of ${duesList.length} levies settled`}
          icon={TrendingUp}
          accentColor="#059669"
        />
        <StatCard
          label="Outstanding Balance"
          value={`\u20A6${totalPending.toLocaleString()}`}
          sub={`${pendingDues.length} pending levies`}
          icon={Hourglass}
          accentColor="#FF9B00"
        />

        {/* Clearance Rate Ring */}
        <div className="card-premium p-6 flex items-center justify-between h-36">
          <div className="space-y-1">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Clearance Rate</p>
            <p className="text-2xl font-bold text-slate-900">{pct}%</p>
            <p className="text-xs text-slate-400 font-medium">Compliance standing</p>
          </div>
          <div className="relative flex-shrink-0 h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} className="fill-none stroke-slate-100" strokeWidth="8" />
              <circle
                cx="50" cy="50" r={r}
                className="fill-none transition-all duration-300"
                stroke="#FF9B00"
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-brand-orange">
              <BadgePercent className="h-4.5 w-4.5" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Transactions */}
        <div className="card-premium p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <FileStack className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
            </div>
            <button
              onClick={() => onNavigate('receipts')}
              className="text-xs font-semibold text-brand-orange link-slide"
            >
              Full History
            </button>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
                <FileStack className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No transactions on record</p>
              <p className="text-2xs text-slate-400 mt-0.5">Completed payments will appear here as ledger entries</p>
            </div>
          ) : (
            <div>
              {recentReceipts.map(r => (
                <TransactionRow key={r.id} receipt={r} onView={onViewReceipt} />
              ))}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card-premium p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-slate-900">Notices</h2>
          </div>
          <div className="space-y-3">
            <NoticeCard
              level="urgent"
              title="Registration Deadline"
              body="All departmental and faculty clearances must be fully settled by 15 July 2026."
              icon={CalendarDays}
            />
            <NoticeCard
              level="info"
              title="Paperless Processing"
              body="Receipt entries sync automatically with departments. No physical stamp required."
              icon={Rss}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeCard({ level, title, body, icon: Icon }) {
  const styles = {
    urgent: {
      wrap:  'bg-red-50/60 border-red-100',
      label: 'text-red-700',
      icon:  'text-red-500 bg-red-100/60',
      text:  'text-red-600/90',
    },
    info: {
      wrap:  'bg-slate-50 border-slate-200/60',
      label: 'text-slate-700',
      icon:  'text-slate-500 bg-slate-100',
      text:  'text-slate-500',
    },
  };
  const s = styles[level] || styles.info;

  return (
    <div className={`p-3.5 rounded-lg border ${s.wrap}`}>
      <div className="flex gap-3">
        <div className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${s.icon}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className={`text-2xs font-bold uppercase tracking-wider ${s.label} mb-0.5`}>{title}</p>
          <p className={`text-xs leading-relaxed ${s.text}`}>{body}</p>
        </div>
      </div>
    </div>
  );
}
