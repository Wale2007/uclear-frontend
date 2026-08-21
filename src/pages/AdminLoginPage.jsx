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
  Building,
  KeyRound,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans antialiased">
      {/* ── Left Hero Banner (Deep Navy Brand) ── */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 xl:p-16 text-white bg-[#0A2540] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#08182b] via-[#0A2540] to-[#040e1a] opacity-95" />

        {/* Ambient decorative glowing circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Logo size="lg" light />
        </div>

        {/* Value Proposition Content */}
        <div className="relative z-10 max-w-xl space-y-8 my-auto">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Executive Bursary &amp; <br />
              <span className="text-brand-orange">Dues Administration.</span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Authorized portal for Association Executives, Faculty Deans, and Bursary Officers to manage institutional levies, monitor settlement ledgers, and audit student clearances.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-2xs text-slate-400 pt-8 border-t border-white/10">
          <span>Federal University of Technology, Akure &middot; Executive Admin Portal</span>
          <span>Security Level 3</span>
        </div>
      </div>

      {/* ── Right Login Form Area ── */}
      <div className="lg:col-span-5 flex flex-col justify-between px-6 sm:px-12 xl:px-16 py-10 bg-slate-50 min-h-screen">
        {/* Top Return Link */}
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>
          <Link
            to="/login"
            className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Student &amp; Staff Portal
          </Link>
        </div>

        {/* Main Form Box */}
        <div className="w-full max-w-sm mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 rounded-xl bg-brand-orange/10 text-brand-orange items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Executive Admin Portal
            </h2>
            <p className="text-xs text-slate-500">
              Sign in with your institutional administrator credentials
            </p>
          </div>

          {/* Generalized Error Box */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200/60 rounded-xl flex items-start gap-2.5 text-xs text-red-600 font-medium animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                Admin Email / ID Code
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
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="Enter account password"
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
              className="btn-primary w-full h-11 text-xs font-semibold flex items-center justify-center gap-2 shadow-md mt-2"
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
        </div>

        {/* Footer */}
        <footer className="text-center text-2xs text-slate-400 pt-6 border-t border-slate-200/60">
          &copy; {new Date().getFullYear()} Federal University of Technology, Akure &middot; Executive Administration
        </footer>
      </div>
    </div>
  );
}
