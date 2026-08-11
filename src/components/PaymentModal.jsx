import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, Smartphone, AlertCircle, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, due, user, settings, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [ussdSelected, setUssdSelected] = useState('GTBank (*737#)');

  const flwPublicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || settings?.publicKey || 'FLWPUBK_TEST-d024d9409d82dc750045a43347fe46c2-X';
  const useLiveGateway = true;

  useEffect(() => {
    if (isOpen && due) {
      const timer = setTimeout(() => {
        if (window.FlutterwaveCheckout) {
          triggerFlutterwaveSDK();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const triggerFlutterwaveSDK = () => {
    if (!window.FlutterwaveCheckout) {
      console.error('Flutterwave SDK not loaded. Check index.html script tag.');
      alert('Payment gateway unavailable. Please check your internet connection and try again.');
      onClose();
      return;
    }

    const txRef = `EDUES-${user?.matricNo || user?.staffId || 'USR'}-${Date.now()}`;

    window.FlutterwaveCheckout({
      public_key: flwPublicKey,
      tx_ref: txRef,
      amount: due.amount,
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      customer: {
        email: user?.email || 'student@futa.edu.ng',
        phone_number: user?.phone || '08000000000',
        name: user?.name || 'Student',
      },
      customizations: {
        title: 'Uclear Checkout',
        description: `Payment for ${due.name}`,
        logo: 'https://res.cloudinary.com/flutterwave/image/upload/v1595492543/flutterwave-logo-colored.svg',
      },
      callback: function (data) {
        if (data.status === 'successful' || data.status === 'completed') {
          setIsProcessing(true);
          setTimeout(() => {
            onPaymentSuccess({
              id: data.transaction_id || Date.now(),
              tx_ref: data.tx_ref || txRef,
              amount: due.amount,
              duesName: due.name,
              category: due.category,
              date: new Date().toISOString(),
              paymentMethod: data.charge_type || 'Flutterwave',
              email: user?.email,
              phone: user?.phone,
              payerName: user?.name,
              payerId: user?.matricNo || user?.staffId,
            });
            setIsProcessing(false);
            onClose();
          }, 800);
        }
      },
      onclose: function () {
        if (!isProcessing) onClose();
      },
    });
  };

  const handleSimulatedPayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAnimation(true);

      setTimeout(() => {
        onPaymentSuccess({
          id: Math.floor(Math.random() * 100000000),
          tx_ref: `FLW-MOCK-${Date.now()}`,
          amount: due.amount,
          duesName: due.name,
          category: due.category,
          date: new Date().toISOString(),
          paymentMethod: paymentMethod.toUpperCase(),
          email: user?.email,
          phone: user?.phone,
          payerName: user?.name,
          payerId: user?.matricNo || user?.staffId,
        });
        setSuccessAnimation(false);
        onClose();
      }, 1500);
    }, 1800);
  };

  if (!isOpen || !due) return null;

  // Live Mode Flutterwave Gateway Card
  if (useLiveGateway) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80 space-y-5 text-center">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-left">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Flutterwave Gateway</p>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{due.name}</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50">
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
            <p className="text-2xl font-extrabold text-slate-900">&#8358;{due.amount.toLocaleString()}</p>
            <p className="text-2xs text-slate-500 font-mono truncate">{user?.email || 'student@futa.edu.ng'}</p>
          </div>

          <button
            onClick={triggerFlutterwaveSDK}
            className="btn-primary w-full h-11 text-xs font-semibold justify-center shadow-lg gap-2"
          >
            <ShieldCheck className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
            Pay Now via Flutterwave
          </button>

          <button
            onClick={onClose}
            className="btn-secondary w-full text-xs h-9"
          >
            Cancel Payment
          </button>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-2xs text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>Encrypted via Flutterwave F4B Payment Gateway</span>
          </div>
        </div>
      </div>
    );
  }

  // Simulated Mode Checkout UI
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white text-slate-800 shadow-xl border border-slate-200/80">

        {successAnimation && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-6 text-center animate-fade-in">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200/40">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Payment Successful</h3>
            <p className="text-xs text-slate-400">Generating digital e-receipt record...</p>
          </div>
        )}

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Demo Checkout</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{due.name}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Amount Payable</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">&#8358;{due.amount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Payer Account</p>
            <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5 max-w-[150px] truncate">{user?.email}</p>
          </div>
        </div>

        <div className="tabs-container m-6 mb-4">
          {[
            { id: 'card', label: 'Card Payment' },
            { id: 'bank', label: 'Bank Transfer' },
            { id: 'ussd', label: 'USSD Code' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              disabled={isProcessing}
              className={`tab-btn text-2xs py-1.5 ${paymentMethod === id ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSimulatedPayment} className="px-6 pb-6 space-y-4">
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="5531 8412 9012 3456"
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setCardNumber(raw.replace(/(.{4})/g, '$1 ').trim());
                  }}
                  disabled={isProcessing}
                  className="field"
                />
                <p className="text-2xs text-slate-400">Test Card: 5531 8412 9012 3456 &middot; Expiry: 12/28 &middot; CVV: 123</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    maxLength="5"
                    value={cardExpiry}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setCardExpiry(raw.length >= 2 ? `${raw.slice(0,2)}/${raw.slice(2,4)}` : raw);
                    }}
                    disabled={isProcessing}
                    className="field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider">CVV Code</label>
                  <input
                    type="password"
                    required
                    placeholder="123"
                    maxLength="3"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    disabled={isProcessing}
                    className="field"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200/40 rounded-lg flex gap-2 text-2xs text-amber-700 font-medium">
                <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                <span>Transfer exactly &#8358;{due.amount.toLocaleString()} to the test account. Instant ledger confirmation enabled.</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs font-mono text-slate-700">
                <div className="flex justify-between"><span>Bank Name:</span><span className="font-semibold text-slate-900">Uclear Settlement Bank</span></div>
                <div className="flex justify-between"><span>Account Number:</span><span className="font-semibold text-slate-900">9912034958</span></div>
                <div className="flex justify-between"><span>Beneficiary:</span><span className="font-semibold text-slate-900">FUTA Bursary Account</span></div>
              </div>
            </div>
          )}

          {paymentMethod === 'ussd' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider">Select Financial Institution</label>
                <select
                  value={ussdSelected}
                  onChange={(e) => setUssdSelected(e.target.value)}
                  disabled={isProcessing}
                  className="field"
                >
                  <option>GTBank (*737#)</option>
                  <option>Access Bank (*901#)</option>
                  <option>Zenith Bank (*966#)</option>
                  <option>UBA (*919#)</option>
                  <option>First Bank (*894#)</option>
                </select>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-1">
                <p className="text-2xs text-slate-400">Dial string on registered line:</p>
                <p className="text-lg font-mono font-bold text-brand-orange tracking-wide">
                  {ussdSelected.match(/\*\d+#/)?.[0] || '*737#'}*000*{due.amount}#
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-2xs text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
            <span>256-Bit Encrypted Simulation Gateway</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full btn-primary text-sm h-10 mt-1"
          >
            {isProcessing ? 'Processing Payment...' : `Complete Payment of \u20A6${due.amount.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
}
