import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  ReceiptText,
  BadgeCheck,
  CircleSlash,
  Download,
} from 'lucide-react';
import { useDues } from '../context/DuesContext';

export default function ReceiptsPage() {
  const { receipts = [], viewReceipt } = useDues();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  const categories = useMemo(() => {
    const set = new Set(['All']);
    safeReceipts.forEach((r) => {
      if (r?.category) set.add(r.category);
    });
    return Array.from(set);
  }, [safeReceipts]);

  const filteredReceipts = useMemo(() => {
    const term = (search || '').toLowerCase().trim();
    return safeReceipts.filter((r) => {
      if (!r) return false;
      const matchCategory =
        categoryFilter === 'All' || r.category === categoryFilter;

      const matchSearch =
        !term ||
        (r.duesName && r.duesName.toLowerCase().includes(term)) ||
        (r.tx_ref && r.tx_ref.toLowerCase().includes(term)) ||
        (r.paymentMethod && r.paymentMethod.toLowerCase().includes(term));

      return matchCategory && matchSearch;
    });
  }, [safeReceipts, search, categoryFilter]);

  const totalSettled = useMemo(() => {
    return safeReceipts.reduce((acc, r) => acc + (Number(r?.amount) || 0), 0);
  }, [safeReceipts]);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Page Title & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Clearance Receipts &amp; Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {receipts.length} cleared transaction{receipts.length !== 1 ? 's' : ''} &middot; Total Settled:{' '}
            <strong className="text-slate-800">
              &#8358;{totalSettled.toLocaleString()}
            </strong>
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-premium p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search receipts by levy name, transaction ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-10 text-xs"
          />
        </div>

        {categories.length > 2 && (
          <div className="tabs-container w-full sm:w-auto overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`tab-btn text-2xs px-3 whitespace-nowrap ${
                  categoryFilter === cat ? 'active' : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Receipts Table or Empty State */}
      {filteredReceipts.length === 0 ? (
        <div className="card-premium p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <CircleSlash className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No Receipts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || categoryFilter !== 'All'
              ? 'No receipts match your search or filter criteria.'
              : 'You have not cleared any dues yet. Go to Pay Dues to settle your outstanding levies.'}
          </p>
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Item Description</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Date Cleared</th>
                  <th className="table-th">Method</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((r) => (
                  <tr key={r.id || r.tx_ref} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <p className="font-semibold text-slate-900">{r.duesName}</p>
                      <p className="font-mono text-2xs text-slate-400 mt-0.5">{r.tx_ref}</p>
                    </td>
                    <td className="table-td">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-600">
                        {r.category || 'General'}
                      </span>
                    </td>
                    <td className="table-td text-slate-500 font-medium">
                      {new Date(r.date).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="table-td">
                      <span className="badge-success text-2xs uppercase">
                        {r.paymentMethod || 'CARD'}
                      </span>
                    </td>
                    <td className="table-td text-right font-bold text-slate-900">
                      &#8358;{Number(r.amount).toLocaleString()}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => viewReceipt(r)}
                        className="btn-secondary h-7 px-3 text-2xs font-semibold gap-1.5 inline-flex items-center"
                      >
                        <ReceiptText className="h-3.5 w-3.5 text-brand-orange" strokeWidth={1.5} />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
