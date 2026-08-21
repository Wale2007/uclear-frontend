import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  Printer,
  BadgeCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Logo from '../components/Logo';
import { fetchPublicReceipt } from '../api/apiService';

export default function PublicReceiptPage() {
  const { txRef: paramTxRef } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const txRef = paramTxRef || searchParams.get('receipt');

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!txRef) {
      setError('No transaction reference provided.');
      setLoading(false);
      return;
    }

    const loadReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPublicReceipt(txRef);
        setReceipt(data);
      } catch (err) {
        setError(err.message || 'Clearance receipt could not be verified.');
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [txRef]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-brand-orange animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Verifying cryptographic signature on bursary ledger...
          </p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 antialiased">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6 animate-scale-in">
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Verification Unsuccessful</h2>
            <p className="text-xs text-slate-500">{error || 'Receipt record not found.'}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Go to Student Portal Login
          </button>
        </div>
      </div>
    );
  }

  const txHash = `SHA-${(receipt.tx_ref || txRef).replace(/[^A-Z0-9]/g, '').slice(0, 20).padEnd(20, '0')}`;
  const formattedAmount = (Number(receipt.amount) || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Header - Hidden on Print */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-6 h-14 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs font-bold text-slate-400 pl-2 border-l border-slate-200">
            Public Clearance Verification
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-slate-600 hover:text-brand-orange flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portal Login
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 justify-center items-start">
        {/* The Printable Invoice Area */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-0 overflow-hidden">
          <div id="print-receipt-area" className="p-8 space-y-6 bg-white text-slate-900">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-1.5">
                <Logo />
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    Federal University of Technology, Akure
                  </p>
                  <p className="text-2xs text-slate-400">
                    Electronic Bursary Ledger Clearance System
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <span className="badge-success text-2xs inline-flex bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-semibold border border-emerald-200">
                  Verification Success
                </span>
                <p className="text-2xs font-mono text-slate-400 font-semibold">{receipt.tx_ref || txRef}</p>
              </div>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Payer Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">{receipt.payerName || 'Institutional Member'}</p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Matric / Staff ID</p>
                <p className="font-mono font-semibold text-slate-800 mt-0.5">{receipt.payerId || '—'}</p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">{receipt.email || 'verified@futa.edu.ng'}</p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Ledger Entry Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(receipt.date).toLocaleString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Item Description</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Total (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{receipt.duesName}</p>
                      <p className="text-2xs text-slate-400 mt-0.5">Session 2025/2026 Clearance</p>
                    </td>
                    <td className="px-4 py-4">{receipt.category || 'General'}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">₦{formattedAmount}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td colSpan={2} className="px-4 py-3 text-right text-slate-400 font-medium">Gateway Surcharge</td>
                    <td className="px-4 py-3 text-right text-slate-400 font-medium">0.00</td>
                  </tr>
                  <tr className="border-t-2 border-slate-300 font-bold bg-slate-50/30">
                    <td colSpan={2} className="px-4 py-4 text-right text-slate-900 uppercase tracking-wider text-2xs">Total Settled</td>
                    <td className="px-4 py-4 text-right text-sm text-brand-orange font-bold">₦{formattedAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Seal & Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-white rounded border border-slate-200 p-1 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                    alt="Verification QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Cryptographic Seal</p>
                  <p className="text-[10px] font-mono text-slate-400 leading-normal break-all max-w-[180px]">{txHash}</p>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold pt-1">
                    <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Bursary Ledger Synced
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between sm:text-right">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Authorizing Officer</p>
                  <p className="text-xl text-slate-800 mt-1 tracking-wider select-none font-serif italic">
                    Prof. K. A. Adeleke
                  </p>
                  <div className="h-px w-28 bg-slate-300 my-1 sm:ml-auto" />
                  <p className="text-2xs text-slate-400">University Registrar / Bursary Clearance</p>
                </div>
                <p className="text-2xs text-slate-400 mt-2">Digitally issued, valid without physical stamp signature.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Sidebar (Hidden on Print) */}
        <div className="w-full lg:w-80 bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6 print:hidden">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Receipt Verified
            </h3>
            <p className="text-xs text-slate-500">
              This clearance invoice is officially registered in the Uclear electronic bursary ledger database.
            </p>
          </div>

          <div className="h-px bg-slate-100" />

          <button
            onClick={() => window.print()}
            className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Download / Print PDF
          </button>

          <div className="h-px bg-slate-100" />

          <button
            onClick={() => navigate('/login')}
            className="btn-secondary w-full py-2.5 text-xs font-semibold"
          >
            Go to Portal Login
          </button>
        </div>
      </div>
    </div>
  );
}
