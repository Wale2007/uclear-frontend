import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  History,
  Settings as SettingsIcon,
  LogOut,
  GraduationCap,
  Briefcase,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useDues } from '../context/DuesContext';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/dues', label: 'Pay Dues', Icon: CreditCard },
  { to: '/receipts', label: 'Receipts', Icon: History },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function StudentStaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    selectedDueForPayment,
    paymentModalOpen,
    closePaymentModal,
    handlePaymentSuccess,
    selectedReceiptForView,
    receiptModalOpen,
    closeReceiptModal,
    settings,
  } = useDues();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'student';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo />
        </div>

        {/* User Identity Pill */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              {user.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                {user.name}
              </p>
              <p className="text-2xs font-mono text-slate-400">
                {user.matricNo || user.staffId}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Layout Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* ── Desktop Left Sidebar ────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 p-4 justify-between flex-shrink-0">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Navigation
              </p>
              <nav className="space-y-1">
                {NAV.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-brand-orange/10 text-brand-orange'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* User profile footer card */}
          {user && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Signed in as
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {isStudent ? (
                    <GraduationCap className="h-3 w-3 text-brand-orange flex-shrink-0" />
                  ) : (
                    <Briefcase className="h-3 w-3 text-brand-teal flex-shrink-0" />
                  )}
                  <p className="text-2xs text-slate-500 truncate">
                    <span className="capitalize font-semibold text-slate-700">
                      {user.role}
                    </span>{' '}
                    &middot; {user.department || 'General'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          )}
        </aside>

        {/* ── Mobile Navigation Drawer ─────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col w-64 max-w-[80%] bg-white h-full p-4 justify-between z-10 animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <Logo />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {NAV.map(({ to, label, Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-brand-orange/10 text-brand-orange'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {label}
                    </NavLink>
                  ))}
                </nav>
              </div>

              {user && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main Page Content Outlet ─────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* ── Global Payment Modal ──────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={closePaymentModal}
        due={selectedDueForPayment}
        user={user}
        settings={settings}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* ── Global Receipt Modal ──────────────────────────────────────────────── */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={closeReceiptModal}
        receipt={selectedReceiptForView}
      />
    </div>
  );
}
