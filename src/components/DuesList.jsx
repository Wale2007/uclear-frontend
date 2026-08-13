import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertOctagon,
  Hourglass,
  ArrowRight,
  ReceiptText,
  ListFilter,
  CircleSlash,
} from 'lucide-react';

const CATEGORIES = ['All', 'Departmental', 'Faculty', 'Student Union', 'Staff Union', 'Other'];
const STATUSES   = ['All', 'Pending', 'Paid', 'Overdue'];

const checkIsOverdue = (due, isPaid) => {
  if (isPaid) return false;
  if (!due.deadline) return !!due.isOverdue;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(due.deadline);
  return deadlineDate < today;
};

function DueCard({ due, isPaid, receipt, onPay, onViewReceipt }) {
  const isOverdue = checkIsOverdue(due, isPaid);

  return (
    <div className="card-premium-hover p-6 flex flex-col justify-between h-56">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block rounded-md bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-slate-500">
          {due.category}
        </span>
        {isPaid    && <span className="badge-success"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />Cleared</span>}
        {isOverdue && <span className="badge-error"><AlertOctagon  className="h-3.5 w-3.5" strokeWidth={1.5} />Overdue</span>}
        {!isPaid && !isOverdue && <span className="badge-warning"><Hourglass className="h-3.5 w-3.5" strokeWidth={1.5} />Pending</span>}
      </div>

      <div className="flex-1 mt-4">
        <h3 className="text-sm font-semibold text-slate-800 leading-snug">{due.name}</h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">{due.description}</p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Deadline</p>
          <p className={`text-xs font-semibold mt-0.5 ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>
            {new Date(due.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Amount</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            &#8358;{due.amount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isPaid ? (
          <button
            onClick={() => onViewReceipt(receipt)}
            className="btn-secondary w-full text-xs h-9 px-3.5 gap-1.5"
          >
            <ReceiptText className="h-4 w-4" strokeWidth={1.5} />
            View Clearance Receipt
          </button>
        ) : (
          <button
            onClick={() => onPay(due)}
            className={`btn-primary w-full text-xs h-9 px-3.5 gap-1.5 ${isOverdue ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            Proceed to Payment
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DuesList({ dues, receipts, onInitiatePayment, onViewReceipt }) {
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('All');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return dues.filter(due => {
      const isPaid    = receipts.some(r => r.duesName === due.name);
      const isOverdue = checkIsOverdue(due, isPaid);

      const matchStatus =
        status === 'All' ||
        (status === 'Paid'    && isPaid)    ||
        (status === 'Overdue' && isOverdue) ||
        (status === 'Pending' && !isPaid && !isOverdue);

      const matchCategory = category === 'All' || due.category === category;
      const matchSearch   = due.name.toLowerCase().includes(search.toLowerCase()) ||
                            due.category.toLowerCase().includes(search.toLowerCase());

      return matchStatus && matchCategory && matchSearch;
    });
  }, [dues, receipts, search, status, category]);

  const paidCount    = dues.filter(d => receipts.some(r => r.duesName === d.name)).length;
  const pendingCount = dues.length - paidCount;

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dues &amp; Levies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {paidCount} cleared &middot; {pendingCount} outstanding &middot; Academic Session 2025/2026
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-premium p-4 shadow-sm bg-white">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search dues and levies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="field pl-10"
            />
          </div>

          <div className="tabs-container flex-shrink-0">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`tab-btn text-2xs px-4 py-1.5 ${status === s ? 'active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative flex-shrink-0 lg:w-48">
            <ListFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="field pl-10 appearance-none cursor-pointer"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium py-16 text-center shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <CircleSlash className="h-5 w-5 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No matching dues found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust the search term or clear the active filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(due => {
            const receipt = receipts.find(r => 
              (r.duesName && due.name && r.duesName.trim().toLowerCase() === due.name.trim().toLowerCase()) ||
              r.duesId === due.id ||
              r.dues_id === due.id
            );
            const isPaid = !!receipt;
            return (
              <DueCard
                key={due.id}
                due={due}
                isPaid={isPaid}
                receipt={receipt}
                onPay={onInitiatePayment}
                onViewReceipt={onViewReceipt}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
