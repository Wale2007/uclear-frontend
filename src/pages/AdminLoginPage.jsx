import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { MOCK_ADMINS } from '../data/mockDatabase';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [credential, setCredential] = useState('sug.admin@futa.edu.ng');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(credential, password, 'admin');
      navigate('/admin/overview', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSampleAdmin = (adm) => {
    setCredential(adm.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between p-4 sm:p-6 antialiased">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Logo />
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Portal
        </Link>
      </header>

      {/* Main Admin Box */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6 animate-scale-in">
          {/* Card Header & Shield Badge */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-12 w-12 rounded-xl bg-brand-orange/10 text-brand-orange items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Institutional Admin Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Authorized access for Association Executives, Faculty Deans, and Bursary Officers
              </p>
            </div>
          </div>

          {/* Generalized Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200/60 rounded-xl flex items-start gap-2.5 text-xs text-red-600 font-medium animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
                Admin Institutional Email / ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. sug.admin@futa.edu.ng"
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setError('');
                  }}
                  className="field pl-10 font-mono text-xs"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="field pl-10 text-xs"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full h-10 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Authorization...
                </>
              ) : (
                <>
                  Enter Executive Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sample Admin Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick Select Sample Admin:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-2xs">
              {MOCK_ADMINS.map((adm) => (
                <button
                  key={adm.id}
                  type="button"
                  onClick={() => selectSampleAdmin(adm)}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    credential === adm.email
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange font-bold'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-semibold truncate">{adm.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{adm.department}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Legal Footer */}
      <footer className="text-center text-2xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} Federal University of Technology, Akure &middot; Executive Bursary & Dues Administration
      </footer>
    </div>
  );
}
