import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('student');
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(credential, password, role);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setCredential('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans antialiased">
      {/* ── Left Hero Banner (Deep Navy Brand) ── */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 xl:p-16 text-white bg-[#0A2540] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3a] via-[#0A2540] to-[#061527] opacity-95" />

        {/* Ambient decorative glowing circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Logo size="lg" light />
        </div>

        {/* Value Proposition Content */}
        <div className="relative z-10 max-w-xl space-y-8 my-auto">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Clear university dues <br />
              <span className="text-brand-orange">in seconds.</span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              A secure, unified portal for students and staff to manage, pay, and track institutional dues. Instant verification and digitally signed e-receipts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-2xs text-slate-400 pt-8 border-t border-white/10">
          <span>Federal University of Technology, Akure &middot; Uclear Portal</span>
          <span>Session 2025/2026</span>
        </div>
      </div>

      {/* ── Right Login Form Area ── */}
      <div className="lg:col-span-5 flex flex-col justify-between px-6 sm:px-12 xl:px-16 py-10 bg-slate-50 min-h-screen">
        {/* Top Mobile Brand & Executive Link */}
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>
          <Link
            to="/admin/login"
            className="ml-auto text-xs font-semibold text-slate-600 hover:text-brand-orange flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-brand-orange" strokeWidth={1.5} />
            Executive Admin
          </Link>
        </div>

        {/* Main Form Center Box */}
        <div className="w-full max-w-sm mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access your clearance portal
            </p>
          </div>

          {/* Student / Staff Selector */}
          <div className="tabs-container">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`tab-btn flex-1 flex items-center justify-center gap-2 ${
                role === 'student' ? 'active' : ''
              }`}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={1.5} />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('staff')}
              className={`tab-btn flex-1 flex items-center justify-center gap-2 ${
                role === 'staff' ? 'active' : ''
              }`}
            >
              <Briefcase className="h-4 w-4" strokeWidth={1.5} />
              Staff
            </button>
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
                {role === 'student' ? 'Matriculation Number' : 'Staff ID Number'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={role === 'student' ? 'e.g. SEN/22/9292' : 'e.g. FUTA/STF/CS/1092'}
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setError('');
                  }}
                  className="field pl-10 font-mono text-xs uppercase"
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center text-2xs text-slate-400 pt-6 border-t border-slate-200/60">
          &copy; {new Date().getFullYear()} Federal University of Technology, Akure
        </footer>
      </div>
    </div>
  );
}
