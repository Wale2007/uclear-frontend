import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Loader2,
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
  const [credential, setCredential] = useState('SEN/22/9292');
  const [password, setPassword] = useState('password123');
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
    setError('');
    if (newRole === 'student') {
      setCredential('SEN/22/9292');
    } else {
      setCredential('FUTA/STF/CS/1092');
    }
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between p-4 sm:p-6 antialiased">
      {/* Top Navbar Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Logo />
        <Link
          to="/admin/login"
          className="text-xs font-semibold text-slate-600 hover:text-brand-orange flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white shadow-sm"
        >
          <ShieldCheck className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
          Executive Admin Portal
        </Link>
      </header>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6 animate-scale-in">
          {/* Card Header & Title */}
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Clearance & Dues Portal
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with your institutional credentials to manage and clear your dues
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="tabs-container">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`tab-btn flex-1 flex items-center justify-center gap-2 ${
                role === 'student' ? 'active' : ''
              }`}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={1.5} />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('staff')}
              className={`tab-btn flex-1 flex items-center justify-center gap-2 ${
                role === 'staff' ? 'active' : ''
              }`}
            >
              <Briefcase className="h-4 w-4" strokeWidth={1.5} />
              Staff Portal
            </button>
          </div>

          {/* Error Message Box (Generalized) */}
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
                {role === 'student' ? 'Matriculation Number' : 'Staff Identification Number'}
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
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-2xs text-slate-400">
              Demo Credentials: Password is <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-semibold">password123</code>
            </p>
            <div className="flex justify-center gap-2 text-2xs">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className="text-brand-orange hover:underline font-semibold"
              >
                Sample Student
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className="text-brand-teal hover:underline font-semibold"
              >
                Sample Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Legal Footer */}
      <footer className="text-center text-2xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} Federal University of Technology, Akure &middot; Electronic Dues & Clearance Verification
      </footer>
    </div>
  );
}
