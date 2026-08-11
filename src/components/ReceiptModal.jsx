import React, { useRef, useState } from 'react';
import { X, Printer, ShieldCheck, BadgeCheck, Download, Loader2 } from 'lucide-react';

/**
 * Generates the complete self-contained HTML string for the receipt.
 * Used for both the dedicated print window and the PDF export.
 */
function buildReceiptHtml(receipt, txHash, formattedAmount, receiptUrl) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;
  const dateStr = new Date(receipt.date).toLocaleString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Uclear Clearance Receipt - ${receipt.tx_ref}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header row ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-name { font-size: 14px; font-weight: 700; color: #0A2540; }
    .brand-sub { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-top: 2px; }
    .brand-caption { font-size: 9px; color: #94a3b8; }
    .header-right { text-align: right; }
    .badge-success {
      display: inline-block;
      background: #ecfdf5; color: #047857;
      border: 1px solid #a7f3d0;
      font-size: 9px; font-weight: 700;
      padding: 2px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .tx-ref { font-size: 9px; font-family: monospace; color: #94a3b8; margin-top: 4px; font-weight: 600; }

    /* ── Details grid ── */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 32px;
      margin-bottom: 14px;
    }
    .detail-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 3px; }
    .detail-value { font-size: 11px; font-weight: 600; color: #1e293b; }
    .detail-value.mono { font-family: monospace; }

    /* ── Invoice table ── */
    .table-wrap { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th { padding: 8px 12px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; text-align: left; }
    th:last-child { text-align: right; }
    td { padding: 10px 12px; font-size: 10.5px; color: #334155; border-top: 1px solid #e2e8f0; }
    td:last-child { text-align: right; }
    .item-title { font-weight: 700; color: #0f172a; font-size: 11px; }
    .item-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .surcharge td { background: #fafafa; color: #94a3b8; font-size: 10px; }
    .total-row td { border-top: 2px solid #cbd5e1; font-weight: 700; background: #fafafa; }
    .total-label { text-align: right; text-transform: uppercase; font-size: 9px; letter-spacing: .5px; color: #1e293b; }
    .total-amount { color: #FF9B00; font-size: 13px; font-family: monospace; }

    /* ── Footer: QR + Signature ── */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .qr-block { display: flex; gap: 12px; align-items: flex-start; }
    .qr-img { width: 64px; height: 64px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 3px; }
    .seal-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 4px; }
    .seal-hash { font-family: monospace; font-size: 8.5px; color: #94a3b8; word-break: break-all; max-width: 160px; }
    .synced { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700; color: #059669; margin-top: 5px; }
    .sign-block { text-align: right; }
    .sign-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 4px; }
    .signature { font-family: Georgia, serif; font-style: italic; font-size: 20px; color: #0A2540; margin-bottom: 4px; }
    .sign-line { width: 110px; height: 1px; background: #cbd5e1; margin: 4px 0 4px auto; }
    .sign-title { font-size: 9px; color: #64748b; }
    .sign-note { font-size: 8.5px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3L27 7.5V16C27 22.5 22.2 27.5 16 29C9.8 27.5 5 22.5 5 16V7.5L16 3Z" fill="#0A2540"/>
        <path d="M11.5 15.5L14.5 18.5L21.5 11.5" stroke="#FF9B00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <div class="brand-name">Uclear Clearance</div>
        <div class="brand-sub">Federal University of Technology, Akure</div>
        <div class="brand-caption">Electronic Bursary Ledger Clearance System</div>
      </div>
    </div>
    <div class="header-right">
      <span class="badge-success">✔ Verification Success</span>
      <div class="tx-ref">${receipt.tx_ref}</div>
    </div>
  </div>

  <!-- Payer Details -->
  <div class="details-grid">
    <div>
      <div class="detail-label">Payer Name</div>
      <div class="detail-value">${receipt.payerName || 'N/A'}</div>
    </div>
    <div>
      <div class="detail-label">Matric / Staff ID</div>
      <div class="detail-value mono">${receipt.payerId || 'N/A'}</div>
    </div>
    <div>
      <div class="detail-label">Email Address</div>
      <div class="detail-value">${receipt.email || 'N/A'}</div>
    </div>
    <div>
      <div class="detail-label">Ledger Entry Date</div>
      <div class="detail-value">${dateStr}</div>
    </div>
  </div>

  <!-- Invoice Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Category</th>
          <th>Total (NGN)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-title">${receipt.duesName}</div>
            <div class="item-sub">Session 2025/2026 Clearance</div>
          </td>
          <td>${receipt.category || 'General'}</td>
          <td>₦${formattedAmount}</td>
        </tr>
        <tr class="surcharge">
          <td colspan="2" style="text-align:right;">Gateway Surcharge</td>
          <td>0.00</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" class="total-label">Total Settled</td>
          <td class="total-amount">₦${formattedAmount}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer: QR + Signature -->
  <div class="footer-row">
    <div class="qr-block">
      <img class="qr-img" src="${qrUrl}" alt="QR Code" />
      <div>
        <div class="seal-label">Cryptographic Seal</div>
        <div class="seal-hash">${txHash}</div>
        <div class="synced">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
          </svg>
          Bursary Ledger Synced
        </div>
      </div>
    </div>

    <div class="sign-block">
      <div class="sign-label">Authorizing Officer</div>
      <div class="signature">Prof. K. A. Adeleke</div>
      <div class="sign-line"></div>
      <div class="sign-title">University Registrar / Bursary Clearance</div>
      <div class="sign-note">Digitally issued. Valid without physical stamp or wet signature.</div>
    </div>
  </div>

</body>
</html>`;
}

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  const printAreaRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!isOpen || !receipt) return null;

  const txHash = `SHA-${receipt.tx_ref.replace(/[^A-Z0-9]/g, '').slice(0, 20).padEnd(20, '0')}`;
  const formattedAmount = receipt.amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const receiptUrl = `${window.location.origin}${window.location.pathname}?receipt=${receipt.tx_ref}`;

  /**
   * Opens a clean popup window containing only the receipt HTML and triggers print.
   * This avoids all modal/visibility issues with window.print() inside a dialog.
   */
  const handlePrint = () => {
    const html = buildReceiptHtml(receipt, txHash, formattedAmount, receiptUrl);
    const printWin = window.open('', '_blank', 'width=794,height=1123,scrollbars=yes');
    if (!printWin) {
      alert('Please allow popups for this page to enable printing.');
      return;
    }
    printWin.document.write(html);
    printWin.document.close();

    // Wait for images (QR code) to load before printing
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        // Close the window after the print dialog is dismissed
        printWin.onafterprint = () => printWin.close();
      }, 400);
    };
  };

  /**
   * Downloads the receipt as a PDF using jsPDF + html2canvas.
   * Captures the preview panel shown in the modal.
   */
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setGeneratingPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pdfWidth - 20;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, contentWidth, contentHeight);

      // Add extra pages if needed
      const pageH = pdf.internal.pageSize.getHeight();
      let remaining = contentHeight + 10 - pageH;
      let offset = -(pageH - 10);
      while (remaining > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, offset, contentWidth, contentHeight);
        remaining -= pageH;
        offset -= pageH;
      }

      pdf.save(`Uclear-Clearance-${receipt.tx_ref.slice(-10)}.pdf`);
    } catch (err) {
      console.error('[PDF Export] Error:', err);
      handlePrint(); // fallback
    } finally {
      setGeneratingPdf(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-200/80 animate-scale-in">

        {/* -- Header ----------------------------------------------- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-teal" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-slate-800">Payment Clearance Invoice</span>
            <span className="badge-success text-2xs">Verified &amp; Cleared</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="btn-primary h-8 px-3 text-xs gap-1.5 flex items-center"
              title="Download as PDF certificate"
            >
              {generatingPdf
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              }
              {generatingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary h-8 px-3 text-xs gap-1.5 flex items-center"
              title="Print certificate"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
              Print
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <X className="h-4.5 w-4.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Receipt Preview (captured for PDF) ─────────────────── */}
        <div ref={printAreaRef} id="print-receipt-area" className="p-8 space-y-6 bg-white text-slate-900">

          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M16 3L27 7.5V16C27 22.5 22.2 27.5 16 29C9.8 27.5 5 22.5 5 16V7.5L16 3Z" fill="#0A2540" />
                  <path d="M11.5 15.5L14.5 18.5L21.5 11.5" stroke="#FF9B00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-base font-bold tracking-tight text-slate-900">Uclear Clearance</span>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Federal University of Technology, Akure</p>
                <p className="text-2xs text-slate-400">Electronic Bursary Ledger Clearance System</p>
              </div>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-2xs font-bold px-2 py-0.5 rounded border border-emerald-200">
                ✔ Verification Success
              </span>
              <p className="text-2xs font-mono text-slate-400 font-semibold">{receipt.tx_ref}</p>
            </div>
          </div>

          {/* Payer Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Payer Name</p>
              <p className="font-semibold text-slate-800 mt-1">{receipt.payerName}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Matric / Staff ID</p>
              <p className="font-mono font-semibold text-slate-800 mt-1">{receipt.payerId}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
              <p className="font-semibold text-slate-800 mt-1">{receipt.email}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Ledger Entry Date</p>
              <p className="font-semibold text-slate-800 mt-1">
                {new Date(receipt.date).toLocaleString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Invoice Table */}
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
                  <td className="px-4 py-4">{receipt.category}</td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900">₦{formattedAmount}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td colSpan={2} className="px-4 py-3 text-right text-slate-400 font-medium">Gateway Surcharge</td>
                  <td className="px-4 py-3 text-right text-slate-400 font-medium">0.00</td>
                </tr>
                <tr className="border-t-2 border-slate-300 font-bold bg-slate-50/30">
                  <td colSpan={2} className="px-4 py-4 text-right text-slate-900 uppercase tracking-wider text-2xs">Total Settled</td>
                  <td className="px-4 py-4 text-right text-sm text-[#FF9B00]">₦{formattedAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* QR + Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white rounded border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                <img src={qrUrl} alt="Verification QR Code" className="w-full h-full object-contain" loading="lazy" />
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
                <p className="text-xl text-[#0A2540] mt-1 tracking-wider italic select-none" style={{ fontFamily: 'Georgia, serif' }}>
                  Prof. K. A. Adeleke
                </p>
                <div className="h-px w-28 bg-slate-300 my-1 sm:ml-auto" />
                <p className="text-2xs text-slate-400">University Registrar / Bursary Clearance</p>
              </div>
              <p className="text-2xs text-slate-400 mt-2">Digitally issued. Valid without physical stamp or wet signature.</p>
            </div>
          </div>

        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-2">
          <p className="text-2xs text-slate-400 dark:text-slate-500 font-mono">
            {receipt.paymentMethod} · {receipt.tx_ref}
          </p>
          <button onClick={onClose} className="btn-secondary text-xs h-9 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
