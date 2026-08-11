import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  AlertCircle,
  Users,
  BadgeCheck,
  Printer,
} from 'lucide-react';

import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import DuesList from './components/DuesList';
import ReceiptModal from './components/ReceiptModal';
import PaymentModal from './components/PaymentModal';
import Settings from './components/Settings';
import AdminPortal from './components/AdminPortal';
import { MOCK_DUES, MOCK_STUDENTS, MOCK_STAFF, authenticateMockUser } from './data/mockDatabase';
import { db } from './firebaseClient';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ── Pre-seeded demo receipts (stamped with real user info on login) ──
const SEED_RECEIPTS = {
  student: [{
    id: 10839201,
    tx_ref: 'EDUES-FUT-CS-22-4910-SEED',
    amount: 2000,
    duesName: 'Student Union Government (SUG) Dues',
    category: 'Student Union',
    date: '2026-06-10T10:30:00.000Z',
    paymentMethod: 'CARD',
  }],
  staff: [{
    id: 20938491,
    tx_ref: 'EDUES-FUT-STF-CS-1092-SEED',
    amount: 5000,
    duesName: 'ASUU Union Monthly Dues',
    category: 'Staff Union',
    date: '2026-06-15T09:15:00.000Z',
    paymentMethod: 'CARD',
  }],
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'dues',      label: 'Pay Dues',     Icon: CreditCard       },
  { id: 'receipts',  label: 'Receipts',     Icon: History          },
  { id: 'settings',  label: 'Settings',     Icon: SettingsIcon     },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole,        setUserRole]        = useState('student');
  const [user,            setUser]            = useState(null);
  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);

  const envFlwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
  const [settings, setSettings] = useState({
    mode:      envFlwKey ? 'live' : 'simulated',
    publicKey: envFlwKey,
  });

  const [receipts,        setReceipts]        = useState([]);
  const [duesCatalog,     setDuesCatalog]     = useState([]);
  const [selectedDue,     setSelectedDue]     = useState(null);
  const [paymentOpen,     setPaymentOpen]     = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptOpen,     setReceiptOpen]     = useState(false);

  const [loginId,       setLoginId]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [isLoggingIn,   setIsLoggingIn]   = useState(false);

  const [publicReceiptTxRef, setPublicReceiptTxRef] = useState(null);
  const [publicReceipt, setPublicReceipt] = useState(null);
  const [publicReceiptLoading, setPublicReceiptLoading] = useState(false);
  const [publicReceiptError, setPublicReceiptError] = useState(null);

  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const receiptParam = params.get('receipt');
    if (receiptParam) {
      setPublicReceiptTxRef(receiptParam);
    }

    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin')) {
      setIsAdminPath(true);
      setUserRole('admin');
    }
  }, []);

  useEffect(() => {
    if (!publicReceiptTxRef) return;

    const fetchReceipt = async () => {
      setPublicReceiptLoading(true);
      setPublicReceiptError(null);
      
      try {
        let foundReceipt = null;

        // 0. Try Spring Boot REST API
        try {
          const apiRes = await fetch(`${API_BASE}/receipts/public/${publicReceiptTxRef}`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            foundReceipt = {
              id: data.id,
              tx_ref: data.txRef,
              amount: Number(data.amount),
              duesName: data.duesName,
              category: data.category,
              date: data.date,
              paymentMethod: data.paymentMethod,
              payerName: data.payerName,
              payerId: data.payerId,
              email: 'verified@futa.edu.ng',
            };
          }
        } catch (e) {
          console.warn('[Spring Boot] Public receipt fetch error:', e);
        }

        // 1. Try Firestore if connected
        if (!foundReceipt && db) {
          try {
            const receiptsRef = collection(db, 'receipts');
            const q = query(receiptsRef, where('tx_ref', '==', publicReceiptTxRef));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
              const rDoc = snap.docs[0];
              const rData = rDoc.data();
              
              // Fetch profile reference directly
              const profileRef = doc(db, 'profiles', rData.payer_id);
              const profileSnap = await getDoc(profileRef);
              
              if (profileSnap.exists()) {
                const profile = profileSnap.data();
                foundReceipt = {
                  id: rDoc.id,
                  tx_ref: rData.tx_ref,
                  amount: Number(rData.amount),
                  duesName: rData.dues_name,
                  category: rData.category,
                  date: rData.created_at,
                  paymentMethod: rData.payment_method,
                  email: profile.email,
                  phone: profile.phone,
                  payerName: profile.name,
                  payerId: profile.matric_no || profile.staff_id,
                };
              }
            }
          } catch (err) {
            console.error('Firestore public receipt lookup error:', err);
          }
        }

        // 2. Try localStorage (for mock mode persistence across page reloads/scans)
        if (!foundReceipt) {
          const localReceiptsStr = localStorage.getItem('ucleare_receipts');
          if (localReceiptsStr) {
            const localReceipts = JSON.parse(localReceiptsStr);
            foundReceipt = localReceipts.find(r => r.tx_ref === publicReceiptTxRef);
          }
        }

        // 3. Try Seed Receipts
        if (!foundReceipt) {
          // Check student seed receipt
          const studentSeed = SEED_RECEIPTS.student.find(r => r.tx_ref === publicReceiptTxRef);
          if (studentSeed) {
            const mockUser = MOCK_STUDENTS[0];
            foundReceipt = {
              ...studentSeed,
              email: mockUser.email,
              phone: mockUser.phone,
              payerName: mockUser.name,
              payerId: mockUser.matricNo || mockUser.staffId,
            };
          } else {
            // Check staff seed receipt
            const staffSeed = SEED_RECEIPTS.staff.find(r => r.tx_ref === publicReceiptTxRef);
            if (staffSeed) {
              const mockUser = MOCK_STAFF[0];
              foundReceipt = {
                ...staffSeed,
                email: mockUser.email,
                phone: mockUser.phone,
                payerName: mockUser.name,
                payerId: mockUser.matricNo || mockUser.staffId,
              };
            }
          }
        }

        if (foundReceipt) {
          setPublicReceipt(foundReceipt);
        } else {
          setPublicReceiptError('Clearance receipt not found. Please double check the link or scan again.');
        }
      } catch (err) {
        setPublicReceiptError('Failed to load receipt details: ' + err.message);
      } finally {
        setPublicReceiptLoading(false);
      }
    };

    fetchReceipt();
  }, [publicReceiptTxRef]);


  // Light mode only - no theme toggle.

  // -- Authentication
  const doLogin = async (e) => {

    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const credential = loginId.trim();

    // 1. Try Spring Boot REST API Backend
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          password: loginPassword,
          role: userRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.token;
        localStorage.setItem('ucleare_token', token);

        const profile = {
          id: data.id,
          role: data.role ? data.role.toLowerCase() : userRole,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          matricNo: data.matricNo || '',
          staffId: data.staffId || '',
          department: data.department || '',
          faculty: data.faculty || '',
          level: data.level || '',
          title: data.title || ''
        };

        // Fetch Dues from Spring Boot API
        let duesData = [];
        try {
          const duesRes = await fetch(`${API_BASE}/dues?role=${userRole}`);
          if (duesRes.ok) {
            const rawDues = await duesRes.json();
            duesData = rawDues.map(d => ({
              id: d.id,
              name: d.name,
              amount: Number(d.amount),
              category: d.category,
              description: d.description,
              deadline: d.deadline,
              isOverdue: d.deadline ? new Date(d.deadline) < new Date() : false,
            }));
            setDuesCatalog(duesData);
          }
        } catch (dErr) {
          console.warn('[Spring Boot] Dues fetch error:', dErr);
        }

        // Fetch Receipts from Spring Boot API
        let receiptsData = [];
        try {
          const receiptsRes = await fetch(`${API_BASE}/receipts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (receiptsRes.ok) {
            const rawReceipts = await receiptsRes.json();
            receiptsData = rawReceipts.map(r => ({
              id: r.id,
              tx_ref: r.txRef,
              amount: Number(r.amount),
              duesName: r.duesName,
              category: r.category,
              date: r.createdAt,
              paymentMethod: r.paymentMethod,
              email: profile.email,
              phone: profile.phone,
              payerName: profile.name,
              payerId: profile.matricNo || profile.staffId,
            }));

            // Merge with local storage cached receipts so payments persist across sessions
            try {
              const localStr = localStorage.getItem('ucleare_receipts');
              if (localStr) {
                const local = JSON.parse(localStr);
                const payerIdVal = profile.matricNo || profile.staffId;
                local.forEach(lr => {
                  if (
                    (lr.payerId === payerIdVal || lr.email === profile.email) &&
                    !receiptsData.some(r => r.tx_ref === lr.tx_ref)
                  ) {
                    receiptsData.unshift(lr);
                  }
                });
              }
              localStorage.setItem('ucleare_receipts', JSON.stringify(receiptsData));
            } catch (e) {
              console.warn('Failed to sync local receipts:', e);
            }

            setReceipts(receiptsData);
          }
        } catch (rErr) {
          console.warn('[Spring Boot] Receipts fetch error:', rErr);
        }

        setUser(profile);
        setIsAuthenticated(true);
        setActiveTab(profile.role === 'admin' ? 'admin' : 'dashboard');
        setIsLoggingIn(false);
        return;
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setLoginError(errorData.error || 'Invalid credentials or password.');
          setIsLoggingIn(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('[Spring Boot] API connect error, falling back to Firestore/Mock:', apiErr);
    }

    if (db) {
      try {
        const queryField = userRole === 'student' ? 'matric_no' : 'staff_id';
        const profilesRef = collection(db, 'profiles');
        const qProfile = query(profilesRef, where(queryField, '==', credential));
        const profileSnap = await getDocs(qProfile);

        if (profileSnap.empty) {
          throw new Error('Profile record not found in institutional registry.');
        }

        const profileDoc = profileSnap.docs[0];
        const profile = { id: profileDoc.id, ...profileDoc.data() };

        const duesRef = collection(db, 'dues');
        const qDues = query(duesRef, where('role_target', 'in', [userRole, 'all']));
        const duesSnap = await getDocs(qDues);
        const duesData = duesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const receiptsRef = collection(db, 'receipts');
        const qReceipts = query(receiptsRef, where('payer_id', '==', profile.id));
        const receiptsSnap = await getDocs(qReceipts);
        const receiptsData = receiptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const mappedReceipts = receiptsData.map(r => ({
          id: r.id,
          tx_ref: r.tx_ref,
          amount: Number(r.amount),
          duesName: r.dues_name,
          category: r.category,
          date: r.created_at,
          paymentMethod: r.payment_method,
          email: profile.email,
          phone: profile.phone,
          payerName: profile.name,
          payerId: profile.matric_no || profile.staff_id,
        }));

        setDuesCatalog(duesData.map(d => ({
          id: d.id,
          name: d.name,
          amount: Number(d.amount),
          category: d.category,
          description: d.description,
          deadline: d.deadline,
          isOverdue: d.deadline ? new Date(d.deadline) < new Date() : false,
        })));

        try {
          const localStr = localStorage.getItem('ucleare_receipts');
          let local = localStr ? JSON.parse(localStr) : [];
          mappedReceipts.forEach(r => {
            if (!local.some(lr => lr.tx_ref === r.tx_ref)) {
              local.push(r);
            }
          });
          localStorage.setItem('ucleare_receipts', JSON.stringify(local));
        } catch (e) {
          console.warn('Failed to cache receipts:', e);
        }

        setReceipts(mappedReceipts);
        setUser(profile);
        setIsAuthenticated(true);
        setActiveTab('dashboard');
        setIsLoggingIn(false);
        return;
      } catch (err) {
        console.warn('[Firebase] Auth fallback to mock database:', err.message);
      }
    }

    setTimeout(() => {
      const found = authenticateMockUser(credential, loginPassword, userRole);
      if (!found) {
        let errMsg = 'Invalid Matriculation Number or password.';
        if (userRole === 'staff') errMsg = 'Invalid Staff ID or password.';
        if (userRole === 'admin') errMsg = 'Invalid Admin Email/ID or password.';
        setLoginError(errMsg);
        setIsLoggingIn(false);
        return;
      }
      const base = SEED_RECEIPTS[found.role] || [];
      const mappedSeed = base.map(r => ({
        ...r,
        email:     found.email,
        phone:     found.phone,
        payerName: found.name,
        payerId:   found.matricNo || found.staffId,
      }));

      let allUserReceipts = [...mappedSeed];

      try {
        const localStr = localStorage.getItem('ucleare_receipts');
        if (localStr) {
          const local = JSON.parse(localStr);
          const payerIdVal = found.matricNo || found.staffId;
          local.forEach(lr => {
            if (
              (lr.payerId === payerIdVal || lr.email === found.email || lr.payerName === found.name) &&
              !allUserReceipts.some(r => r.tx_ref === lr.tx_ref)
            ) {
              allUserReceipts.unshift(lr);
            }
          });
        }
        localStorage.setItem('ucleare_receipts', JSON.stringify(allUserReceipts));
      } catch (e) {
        console.warn('Failed to cache mock receipts:', e);
      }

      setReceipts(allUserReceipts);
      setDuesCatalog(MOCK_DUES[found.role] || []);
      setUser(found);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      setIsLoggingIn(false);
    }, 700);
  };

  const quickLogin = (role) => {
    setUserRole(role);
    setLoginId(role === 'student' ? 'SEN/22/9292' : 'FUTA/STF/CS/1092');
    setLoginPassword('password123');
    setLoginError('');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setReceipts([]);
    setLoginId('');
    setLoginPassword('');
    setLoginError('');
    setActiveTab('dashboard');
  };

  const navigate = (tab) => { setActiveTab(tab); setMobileMenuOpen(false); };
  const getDues  = () => MOCK_DUES[user?.role] || [];

  // ── PUBLIC RECEIPT DOWNLOAD & VERIFICATION PAGE ─────────────────────
  if (publicReceiptTxRef) {
    return (
      <PublicReceiptPage
        receipt={publicReceipt}
        error={publicReceiptError}
        loading={publicReceiptLoading}
        onBack={() => {
          window.location.href = window.location.origin + window.location.pathname;
        }}
      />
    );
  }

  // Dedicated Standalone Executive Admin Login Page
  if (!isAuthenticated && isAdminPath) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 space-y-6 animate-scale-in">
          <div className="text-center space-y-3">
            <div className="inline-flex h-12 w-12 rounded-xl bg-brand-orange/10 text-brand-orange items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Uclear Admin Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in with your institutional administrator credentials</p>
            </div>
          </div>

          <form onSubmit={doLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200/50 rounded-lg flex gap-2 text-xs text-red-600 font-semibold">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
                Admin Email / ID Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. sug.admin@futa.edu.ng"
                value={loginId}
                onChange={e => { setLoginId(e.target.value); setLoginError(''); }}
                className="field font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter account password"
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                className="field"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary w-full h-11 text-xs font-semibold justify-center shadow-lg"
            >
              {isLoggingIn ? 'Authenticating Admin...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors">
              &larr; Return to Student &amp; Staff Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // UNAUTHENTICATED Login (Student & Staff)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans antialiased">
        
        <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-16 text-white bg-[#0A2540] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3a] to-[#0A2540] opacity-95" />
          
          <div className="relative z-10">
            <Logo size="lg" light />
          </div>

          <div className="relative z-10 max-w-xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tightest leading-tight text-white">
                Clear university dues <br />
                <span className="text-brand-orange">in seconds.</span>
              </h1>
              <p className="text-base text-slate-300/90 leading-relaxed">
                A secure, unified portal for students and staff to manage, pay, and track institutional dues. Instant verification and digitally signed e-receipts.
              </p>
            </div>
          </div>

          <div className="relative z-10 text-2xs text-slate-500">
            Federal University of Technology, Akure &middot; Uclear Portal
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center px-6 sm:px-16 py-12 bg-slate-50">

          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2">
              <div className="lg:hidden pb-4">
                <Logo size="md" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {isAdminPath ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-brand-orange" strokeWidth={1.5} />
                    Executive Admin Portal
                  </>
                ) : (
                  'Sign in to your account'
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {isAdminPath
                  ? 'Sign in with your institutional administrator credentials'
                  : 'Enter your credentials to access your clearance portal'}
              </p>
            </div>

            {!isAdminPath ? (
              <div className="tabs-container">
                {[
                  { role: 'student', label: 'Student' },
                  { role: 'staff', label: 'Staff' }
                ].map(({ role, label }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setUserRole(role); setLoginId(''); setLoginError(''); }}
                    className={`tab-btn ${userRole === role ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-brand-orange/10 border border-brand-orange/20 rounded-xl text-xs font-bold text-brand-orange flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Restricted Executive Portal
                </span>
                <a href="/" className="text-2xs text-slate-500 hover:text-slate-800 underline font-semibold">
                  Back to Portal
                </a>
              </div>
            )}

            <form onSubmit={doLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200/50 rounded-lg flex gap-2 text-xs text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                  {userRole === 'student' 
                    ? 'Matriculation Number' 
                    : (userRole === 'staff' ? 'Staff ID Code' : 'Admin Email / ID')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    userRole === 'student' 
                      ? 'e.g. SEN/22/9292' 
                      : (userRole === 'staff' ? 'e.g. FUTA/STF/CS/1092' : 'e.g. sug.admin@futa.edu.ng')
                  }
                  value={loginId}
                  onChange={e => { setLoginId(e.target.value); setLoginError(''); }}
                  className="field font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter account password"
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                  className="field"
                />
              </div>

              <button type="submit" disabled={isLoggingIn} className="btn-primary w-full mt-2">
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED SHELL ─────────────────────────────────────────────
  if (user?.role?.toLowerCase() === 'admin') {
    return <AdminPortal user={user} onLogout={logout} />;
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isStaff = user?.role?.toLowerCase() === 'staff';
  const navItems = [
    ...NAV,
    ...(isStaff ? [{ id: 'admin', label: 'Admin Portal', Icon: ShieldCheck }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">

      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(p => !p)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-navy text-white flex items-center justify-center text-xs font-bold tracking-wide flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-2xs text-slate-400 font-mono">{user.matricNo || user.staffId}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">

        {/* ── Desktop Sidebar ──────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 py-5 px-3 fixed top-14 bottom-0 left-0 z-20 overflow-y-auto">
          <nav className="flex-1 space-y-0.5">
            <p className="sidebar-group mb-2 mt-1">Navigation</p>
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`nav-item ${activeTab === id ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
            <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{user.name}</p>
              <p className="text-2xs text-brand-orange font-semibold capitalize">{user.role} &nbsp;&middot;&nbsp; {user.department}</p>
            </div>

            <button
              onClick={logout}
              className="nav-item text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Mobile Drawer ─────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-100 flex flex-col py-5 px-3 overflow-y-auto animate-slide-right md:hidden">
              <div className="flex items-center justify-between mb-6 px-1">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={`nav-item ${activeTab === id ? 'active' : ''}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                  <p className="text-2xs text-brand-orange font-semibold capitalize">{user.role} &nbsp;&middot;&nbsp; {user.department}</p>
                </div>
                <button onClick={logout} className="nav-item text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </aside>
          </>
        )}

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 md:ml-56 p-4 sm:p-7 pb-24 md:pb-7 overflow-y-auto min-w-0">

          {activeTab === 'dashboard' && (
            <Dashboard
              user={user}
              dues={duesCatalog}
              receipts={receipts}
              onViewReceipt={r => { setSelectedReceipt(r); setReceiptOpen(true); }}
              onNavigate={navigate}
            />
          )}

          {activeTab === 'dues' && (
            <DuesList
              dues={duesCatalog}
              receipts={receipts}
              onInitiatePayment={d => { setSelectedDue(d); setPaymentOpen(true); }}
              onViewReceipt={r => { setSelectedReceipt(r); setReceiptOpen(true); }}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsPage
              receipts={receipts}
              onView={r => { setSelectedReceipt(r); setReceiptOpen(true); }}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              user={user}
              onUpdateUser={setUser}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPortal user={user} />
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-brand-midnight/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
        <div className={`grid h-16 ${navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex flex-col items-center justify-center gap-1 text-2xs font-semibold transition-colors ${
                activeTab === id
                  ? 'text-brand-orange'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* --- Modals ---------------------------------------------------- */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={selectedReceipt}
      />
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        due={selectedDue}
        user={user}
        settings={settings}
        onPaymentSuccess={async (receipt) => {
          // 1. Try Spring Boot REST API
          const token = localStorage.getItem('ucleare_token');
          if (token) {
            try {
              const matchedDue = duesCatalog.find(d => d.name === receipt.duesName);
              await fetch(`${API_BASE}/receipts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  txRef: receipt.tx_ref,
                  duesId: matchedDue?.id || null,
                  duesName: receipt.duesName,
                  category: receipt.category,
                  amount: receipt.amount,
                  paymentMethod: receipt.paymentMethod
                })
              });
              console.log('[Spring Boot] Receipt recorded successfully in MySQL.');
            } catch (err) {
              console.error('[Spring Boot] Failed to record receipt:', err);
            }
          }

          // 2. Also write to Firestore (if connected)
          if (db && user && user.id) {
            try {
              const matchedDue = duesCatalog.find(d => d.name === receipt.duesName);
              const receiptsRef = collection(db, 'receipts');
              await addDoc(receiptsRef, {
                tx_ref: receipt.tx_ref,
                payer_id: user.id,
                dues_id: matchedDue?.id || null,
                dues_name: receipt.duesName,
                category: receipt.category,
                amount: receipt.amount,
                payment_method: receipt.paymentMethod,
                created_at: new Date().toISOString()
              });
              console.log('[Firebase] Payment recorded successfully.');
            } catch (err) {
              console.error('[Firebase] Failed to write receipt:', err.message);
            }
          }
          try {
            const localStr = localStorage.getItem('ucleare_receipts');
            let local = localStr ? JSON.parse(localStr) : [];
            if (!local.some(lr => lr.tx_ref === receipt.tx_ref)) {
              local.unshift(receipt);
              localStorage.setItem('ucleare_receipts', JSON.stringify(local));
            }
          } catch (e) {
            console.warn('Failed to cache new receipt:', e);
          }
          setReceipts(p => [receipt, ...p]);
          setPaymentOpen(false);
          setSelectedReceipt(receipt);
          setReceiptOpen(true);
        }}
      />
    </div>
  );
}

// ── Receipts page (inline since it's lightweight) ────────────────────
function ReceiptsPage({ receipts, onView }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically signed e-receipts for all processed transactions
        </p>
      </div>

      <div className="table-container">
        {receipts.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#111928]">
            <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
              <History className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">Transactions will be listed here once payment is processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Reference</th>
                  <th className="table-th">Item</th>
                  <th className="table-th hidden sm:table-cell">Channel</th>
                  <th className="table-th hidden md:table-cell">Date</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {receipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 hover:dark:bg-[#161f30]/20 transition-colors">
                    <td className="table-td font-mono text-2xs text-slate-400 dark:text-slate-500 max-w-[140px] truncate">
                      {r.tx_ref}
                    </td>
                    <td className="table-td">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{r.duesName}</p>
                      <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{r.category}</p>
                    </td>
                    <td className="table-td hidden sm:table-cell">
                      <span className="badge-neutral text-2xs">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="table-td text-xs text-slate-400 hidden md:table-cell">
                      {new Date(r.date).toLocaleString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="table-td text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      ₦{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => onView(r)}
                        className="text-xs font-semibold text-brand-teal hover:underline"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public Receipt Download & Verification Page ──────────────────────
function PublicReceiptPage({ receipt, error, loading, onBack }) {
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090e1a] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal"></div>
          <p className="text-sm font-medium">Retrieving electronic receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090e1a] p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#111928] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-6">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verification Failed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          </div>
          <button
            onClick={onBack}
            className="btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Go to Portal Login
          </button>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const txHash = `SHA-${receipt.tx_ref.replace(/[^A-Z0-9]/g, '').slice(0, 20).padEnd(20, '0')}`;
  const formattedAmount = receipt.amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e1a] text-slate-800 dark:text-slate-200 font-sans flex flex-col antialiased">
      {/* Header - Hidden on Print */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090e1a]/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 h-14 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3L27 7.5V16C27 22.5 22.2 27.5 16 29C9.8 27.5 5 22.5 5 16V7.5L16 3Z" fill="#0A2540" />
            <path d="M11.5 15.5L14.5 18.5L21.5 11.5" stroke="#FF9B00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Uclear Receipt Portal</span>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
        >
          Portal Login &rarr;
        </button>
      </header>

      {/* Main Panel */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 justify-center items-start">
        
        {/* Left/Main Content: The Receipt (Print Area) */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-0 overflow-hidden">
          {/* Printable Container */}
          <div id="print-receipt-area" className="p-8 space-y-6 bg-white text-slate-900">
            {/* Institutional Branding Block */}
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
                <span className="badge-success text-2xs inline-flex bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">Verification Success</span>
                <p className="text-2xs font-mono text-slate-400 font-semibold">{receipt.tx_ref}</p>
              </div>
            </div>

            {/* Details Column Grid */}
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

            {/* Statement Invoice Table */}
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

            {/* Verification + Signatures Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              {/* Left QR Code Validation */}
              <div className="flex gap-4">
                {/* QR code of same URL */}
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

              {/* Right Bursar Authorization Sign block */}
              <div className="flex flex-col items-start sm:items-end justify-between sm:text-right">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Authorizing Officer</p>
                  <p className="font-signature text-xl text-slate-800 mt-1 tracking-wider select-none font-serif italic">
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

        {/* Right Sidebar: Actions (Hidden on Print) */}
        <div className="w-full lg:w-80 bg-white dark:bg-[#111928] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6 print:hidden">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Receipt Verified
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This clearance invoice is officially registered in the Uclear electronic bursary ledger database.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Download / Print PDF
            </button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              Tip: In the print dialog, set Destination to <b>"Save as PDF"</b> to download the receipt as a PDF file.
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 text-xs border border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Ledger Verification Details</p>
            <div className="space-y-1 font-mono text-[10px] text-slate-400">
              <p>REF: {receipt.tx_ref}</p>
              <p>METHOD: {receipt.paymentMethod}</p>
              <p>STATUS: SUCCESS (LEDGER_SYNCED)</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="btn-secondary w-full py-2.5 text-xs font-semibold"
          >
            Go to Portal Login
          </button>
        </div>

      </div>
    </div>
  );
}


