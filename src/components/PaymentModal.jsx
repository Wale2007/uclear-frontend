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

  // Cleanup helper to automatically remove Flutterwave DOM overlay
  const removeFlutterwaveDOM = () => {
    try {
      const flwElements = document.querySelectorAll(
        'iframe[src*="flutterwave"], iframe[name="checkout"], .flw-overlay, #flwpugapiname, [id*="flw"], div[style*="z-index: 2147483647"]'
      );
      flwElements.forEach((el) => el.remove());
      document.body.style.overflow = 'auto';
    } catch (ignored) {}
  };

  useEffect(() => {
    if (isOpen && due) {
      const timer = setTimeout(() => {
        if (window.FlutterwaveCheckout) {
          triggerFlutterwaveSDK();
        }
      }, 200);
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

    // Listen for payment postMessage events from Flutterwave iframe to auto-close
    const messageListener = (event) => {
      if (event?.data?.status === 'successful' || event?.data?.resp?.status === 'successful') {
        window.removeEventListener('message', messageListener);
        setTimeout(removeFlutterwaveDOM, 1000);
      }
    };
    window.addEventListener('message', messageListener);

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
        window.removeEventListener('message', messageListener);

        if (data.status === 'successful' || data.status === 'completed' || data.tx_ref) {
          const newReceipt = {
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
          };

          // Automatically clear Flutterwave modal after brief confirmation and transition immediately to receipt
          setTimeout(() => {
            removeFlutterwaveDOM();
            onPaymentSuccess(newReceipt);
            onClose();
          }, 800);
        }
      },
      onclose: function () {
        window.removeEventListener('message', messageListener);
        removeFlutterwaveDOM();
        onClose();
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
      }, 1000);
    }, 1200);
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
            <h3 className="text-base font-bold text-slate-900">Payment Confirmed</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">Generating your official clearance receipt...</p>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Payment Checkout</span>
            <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs">{due.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSimulatedPayment} className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-2xs text-slate-400 font-medium">Payable Amount</p>
              <p className="text-xl font-extrabold text-slate-900">&#8358;{due.amount.toLocaleString()}</p>
            </div>
            <span className="badge-neutral text-2xs font-mono font-semibold">{due.category}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'transfer', label: 'Transfer', icon: Landmark },
              { id: 'ussd', label: 'USSD', icon: Smartphone }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl p-3 border text-xs font-semibold transition-all ${
                  paymentMethod === id
                    ? 'border-brand-orange bg-brand-orange/5 text-brand-orange ring-1 ring-brand-orange/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="5399 •••• •••• 1234"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="input-field mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="input-field mt-1 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Bank Transfer Details</p>
              <div className="flex justify-between font-mono font-bold text-slate-800">
                <span>Bank:</span>
                <span>Access Bank PLC</span>
              </div>
              <div className="flex justify-between font-mono font-bold text-slate-800">
                <span>Account No:</span>
                <span>0123456789</span>
              </div>
              <div className="flex justify-between font-mono font-bold text-slate-800">
                <span>Account Name:</span>
                <span>FUTA Uclear Bursary</span>
              </div>
            </div>
          )}

          {paymentMethod === 'ussd' && (
            <div className="space-y-2 text-xs">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">Select Bank USSD</label>
              <select
                value={ussdSelected}
                onChange={(e) => setUssdSelected(e.target.value)}
                className="input-field text-xs font-mono"
              >
                <option>GTBank (*737#)</option>
                <option>Access Bank (*901#)</option>
                <option>Zenith Bank (*966#)</option>
                <option>First Bank (*894#)</option>
                <option>UBA (*919#)</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full h-10 text-xs font-semibold justify-center shadow-md gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Processing Secure Payment...
                </>
              ) : (
                `Complete Payment (₦${due.amount.toLocaleString()})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
