import React, { useState, useEffect } from 'react';
import {
  Users,
  UploadCloud,
  FileSpreadsheet,
  Database,
  Search,
  GraduationCap,
  Briefcase,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  FileText,
  PlusCircle,
  CreditCard,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  Check,
  X,
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  Landmark,
  FileCheck,
  Download,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ─── Small helpers ────────────────────────────────────────────────────────────
function StatusBadge({ active }) {
  return active ? (
    <span className="badge-success">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="badge-neutral">
      Hidden
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPortal({ user, onLogout }) {
  const [adminTab, setAdminTab] = useState('overview');

  // Data state
  const [stats, setStats] = useState({ totalStudents: 0, totalStaff: 0, totalReceipts: 0, totalRevenue: 0 });
  const [profiles, setProfiles] = useState([]);
  const [duesList, setDuesList] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registry
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Bulk Upload
  const [uploadRole, setUploadRole] = useState('student');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Create/Edit Due modal
  const [showDueModal, setShowDueModal] = useState(false);
  const [editingDue, setEditingDue] = useState(null);
  const [dueForm, setDueForm] = useState({
    name: '', amount: '', category: 'Departmental', description: '', deadline: '', roleTarget: 'student',
  });
  const [savingDue, setSavingDue] = useState(false);
  const [dueSuccessMsg, setDueSuccessMsg] = useState('');
  const [dueErrorMsg, setDueErrorMsg] = useState('');

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Org settings
  const [orgSettings, setOrgSettings] = useState({
    name: 'Student Union Government',
    code: 'FUTA-SUG-2026',
    bursarName: 'Prof. K. A. Adeleke',
    contactEmail: 'sug.admin@futa.edu.ng',
    bankName: 'FUTA Microfinance Bank',
    accountNo: '1100293847',
  });
  const [orgSaved, setOrgSaved] = useState(false);

  const token = localStorage.getItem('ucleare_token');

  // ── Fetch All Data ────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Stats
      try {
        const sRes = await fetch(`${API_BASE}/admin/stats`, { headers });
        if (sRes.ok) setStats(await sRes.json());
      } catch (e) { console.warn('[Admin] Stats fetch error:', e); }

      // 2. Profiles
      try {
        const pRes = await fetch(`${API_BASE}/admin/profiles`, { headers });
        if (pRes.ok) setProfiles(await pRes.json());
      } catch (e) { console.warn('[Admin] Profiles fetch error:', e); }

      // 3. Dues
      try {
        const dRes = await fetch(`${API_BASE}/dues?role=all`, { headers });
        if (dRes.ok) {
          const raw = await dRes.json();
          setDuesList(raw.map(d => ({
            ...d,
            amount: Number(d.amount),
            isActive: d.isActive !== false,
          })));
        }
      } catch (e) { console.warn('[Admin] Dues fetch error:', e); }

      // 4. Receipts (Ledger)
      try {
        const rRes = await fetch(`${API_BASE}/admin/receipts`, { headers });
        if (rRes.ok) {
          const rawR = await rRes.json();
          setAllReceipts(rawR.map(r => ({
            id: r.id,
            txRef: r.txRef,
            amount: Number(r.amount),
            duesName: r.duesName,
            category: r.category,
            createdAt: r.createdAt,
            paymentMethod: r.paymentMethod,
            payerName: r.payer?.name || '—',
            payerId: r.payer?.matricNo || r.payer?.staffId || '—',
          })));
        }
      } catch (e) { console.warn('[Admin] Receipts fetch error:', e); }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Create or Edit Due ──────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingDue(null);
    setDueForm({ name: '', amount: '', category: 'Departmental', description: '', deadline: '', roleTarget: 'student' });
    setDueErrorMsg('');
    setDueSuccessMsg('');
    setShowDueModal(true);
  };

  const openEditModal = (due) => {
    setEditingDue(due);
    setDueForm({
      name: due.name || '',
      amount: due.amount || '',
      category: due.category || 'Departmental',
      description: due.description || '',
      deadline: due.deadline || '',
      roleTarget: due.roleTarget || 'student',
    });
    setDueErrorMsg('');
    setDueSuccessMsg('');
    setShowDueModal(true);
  };

  const handleSaveDue = async (e) => {
    e.preventDefault();
    setSavingDue(true);
    setDueErrorMsg('');
    setDueSuccessMsg('');

    try {
      const url = editingDue ? `${API_BASE}/dues/${editingDue.id}` : `${API_BASE}/dues`;
      const method = editingDue ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: dueForm.name,
          amount: parseFloat(dueForm.amount),
          category: dueForm.category,
          description: dueForm.description,
          deadline: dueForm.deadline || null,
          roleTarget: dueForm.roleTarget,
        }),
      });

      if (res.ok) {
        setDueSuccessMsg(editingDue ? 'Levy updated successfully!' : 'New levy created and published!');
        fetchData();
        setTimeout(() => {
          setShowDueModal(false);
          setDueSuccessMsg('');
        }, 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        setDueErrorMsg(err.error || 'Failed to save due. Please check input values.');
      }
    } catch (err) {
      setDueErrorMsg('Network error: ' + err.message);
    } finally {
      setSavingDue(false);
    }
  };

  // ── Delete Due ─────────────────────────────────────────────────────────────
  const handleDeleteDue = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/dues/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setDuesList(prev => prev.filter(d => d.id !== id));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error('[Admin] Delete due error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (id) => {
    try {
      await fetch(`${API_BASE}/dues/${id}/toggle-active`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchData();
    } catch (err) {
      console.warn('[Admin] Toggle active error:', err);
    }
  };

  // ── CSV upload ─────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setUploadResult(null); setUploadError(''); }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setUploadError('Please select a CSV file to upload.'); return; }
    setUploading(true); setUploadResult(null); setUploadError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('role', uploadRole);
    try {
      const res = await fetch(`${API_BASE}/admin/profiles/bulk-csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        setUploadResult(await res.json());
        setSelectedFile(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.error || 'Failed to upload CSV. Check file format.');
      }
    } catch (err) {
      setUploadError('Network error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredProfiles = profiles.filter(p => {
    const matchesRole = roleFilter === 'all' || p.role?.toLowerCase() === roleFilter;
    const q = searchTerm.toLowerCase();
    return matchesRole && (!q ||
      p.name?.toLowerCase().includes(q) ||
      p.matricNo?.toLowerCase().includes(q) ||
      p.staffId?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q));
  });

  const filteredReceipts = allReceipts.filter(r => {
    const q = ledgerSearch.toLowerCase();
    return !q ||
      r.txRef?.toLowerCase().includes(q) ||
      r.payerName?.toLowerCase().includes(q) ||
      r.duesName?.toLowerCase().includes(q);
  });

  const ADMIN_NAV = [
    { id: 'overview',     label: 'Executive Dashboard',    Icon: LayoutDashboard },
    { id: 'dues_manager', label: 'Dues & Levies Manager',  Icon: CreditCard      },
    { id: 'registry',     label: 'Institutional Registry', Icon: Users           },
    { id: 'ledger',       label: 'Clearance Audit Ledger', Icon: FileText        },
    { id: 'settings',     label: 'Organization Settings',  Icon: SettingsIcon    },
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">

      {/* ── Admin Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-900">Uclear Executive Console</span>
              <span className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-2xs text-slate-500 font-medium">{user?.name || 'Organization Executive'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary h-8 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Sync
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <button
            onClick={onLogout}
            className="btn-danger h-8 px-3 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* ── Admin Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-56 bg-white border-r border-slate-100 p-4 space-y-6 flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Organization Controls</p>
            {ADMIN_NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setAdminTab(id)}
                className={`sidebar-item ${adminTab === id ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-2xs">
            <p className="font-bold text-brand-orange uppercase tracking-wider">Active Administrator</p>
            <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-slate-500 font-mono">{user?.staffId || user?.email}</p>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* ══════════════ VIEW 1: OVERVIEW DASHBOARD ══════════════ */}
          {adminTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Executive Overview
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Real-time revenue, clearance compliance, and database metrics</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
                  Create New Due / Levy
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Enrolled Students', value: stats.totalStudents, Icon: GraduationCap, color: '#2563eb' },
                  { label: 'Enrolled Staff', value: stats.totalStaff, Icon: Briefcase, color: '#9333ea' },
                  { label: 'Active Levies', value: duesList.filter(d => d.isActive).length, Icon: CreditCard, color: '#059669' },
                  { label: 'Total Funds Collected', value: `₦${Number(stats.totalRevenue).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, Icon: TrendingUp, color: '#FF9B00', isRevenue: true },
                ].map(({ label, value, Icon, color, isRevenue }) => (
                  <div key={label} className="card-premium p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <p className={`${isRevenue ? 'text-2xl text-brand-orange' : 'text-3xl text-slate-900'} font-bold`}>{value}</p>
                    <p className="text-2xs text-slate-400">{isRevenue ? 'Total revenue settled' : `Registered ${label.toLowerCase()}`}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand-orange" strokeWidth={1.5} /> Levies &amp; Dues Summary
                    </h3>
                    <button onClick={() => setAdminTab('dues_manager')} className="text-xs text-brand-orange font-bold hover:underline">
                      Manage All &rarr;
                    </button>
                  </div>
                  <div className="space-y-3">
                    {duesList.slice(0, 4).map(due => (
                      <div key={due.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{due.name}</p>
                          <p className="text-2xs text-slate-500 uppercase tracking-wider mt-0.5">{due.category} &middot; Target: {due.roleTarget || 'student'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₦{due.amount.toLocaleString()}</p>
                          <StatusBadge active={due.isActive} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-premium p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-brand-teal" strokeWidth={1.5} /> Recent Clearance Activity
                    </h3>
                    <button onClick={() => setAdminTab('ledger')} className="text-xs text-brand-teal font-bold hover:underline">
                      Audit Ledger &rarr;
                    </button>
                  </div>
                  {allReceipts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No clearance transactions recorded yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {allReceipts.slice(0, 4).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{r.payerName}</p>
                            <p className="text-2xs text-slate-500 font-mono mt-0.5">{r.txRef}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-600">₦{r.amount.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Paid'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 2: DUES MANAGER ══════════════ */}
          {adminTab === 'dues_manager' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Dues &amp; Levies Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Create, edit, toggle visibility, or delete institutional dues</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
                  Add New Due / Levy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {duesList.map(due => (
                  <div key={due.id} className={`card-premium p-5 flex flex-col justify-between space-y-4 ${!due.isActive ? 'opacity-60' : ''}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="badge-neutral text-2xs font-semibold uppercase tracking-wider">
                          {due.category}
                        </span>
                        <StatusBadge active={due.isActive} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{due.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{due.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-2xs font-bold uppercase tracking-wider">Target Audience</span>
                        <span className="font-semibold text-slate-700 capitalize">{due.roleTarget || 'student'}s Only</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-2xs font-bold uppercase tracking-wider">Deadline</span>
                        <span className="font-semibold text-slate-700">{due.deadline ? new Date(due.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Deadline'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-2xs font-bold uppercase tracking-wider">Amount</span>
                        <span className="text-base font-bold text-slate-900">₦{due.amount.toLocaleString()}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => openEditModal(due)}
                          className="btn-secondary flex-1 text-2xs h-8 gap-1"
                        >
                          <Edit2 className="h-3 w-3" strokeWidth={1.5} /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleActive(due.id)}
                          className="btn-secondary text-2xs h-8 px-2.5 gap-1"
                          title={due.isActive ? 'Hide from catalog' : 'Show in catalog'}
                        >
                          {due.isActive ? <EyeOff className="h-3.5 w-3.5 text-amber-600" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                          {due.isActive ? 'Hide' : 'Show'}
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(due.id)}
                          className="btn-secondary text-2xs h-8 px-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                          title="Delete due"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 3: REGISTRY ══════════════ */}
          {adminTab === 'registry' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Institutional Registry
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Manage enrolled students, staff accounts, and bulk import records</p>
                </div>
              </div>

              {/* Bulk Upload Section */}
              <div className="card-premium p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-4.5 w-4.5 text-brand-orange" strokeWidth={1.5} /> Bulk CSV Import
                </h3>

                <form onSubmit={handleBulkUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Import Role</label>
                    <select value={uploadRole} onChange={e => setUploadRole(e.target.value)} className="field">
                      <option value="student">Students</option>
                      <option value="staff">Staff Members</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select CSV File</label>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="field text-2xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 cursor-pointer" />
                  </div>
                  <button type="submit" disabled={uploading || !selectedFile} className="btn-primary text-xs h-10">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import CSV'}
                  </button>
                </form>

                {uploadResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-semibold">
                    Successfully imported {uploadResult.imported} records!
                  </div>
                )}
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Registry Table */}
              <div className="table-container">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="Search registry by name, ID, or email..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="field pl-10"
                    />
                  </div>
                  <div className="tabs-container">
                    {['all', 'student', 'staff'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`tab-btn text-2xs px-4 ${roleFilter === r ? 'active' : ''}`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="table-header">
                      <tr>
                        <th className="table-th">Name</th>
                        <th className="table-th">Role</th>
                        <th className="table-th">Matric / Staff ID</th>
                        <th className="table-th">Email</th>
                        <th className="table-th">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="table-td font-bold text-slate-900">{p.name}</td>
                          <td className="table-td">
                            <span className={`badge-${p.role === 'student' ? 'neutral' : 'warning'}`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="table-td font-mono">{p.matricNo || p.staffId || '—'}</td>
                          <td className="table-td text-slate-500">{p.email}</td>
                          <td className="table-td text-slate-600">{p.department || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 4: LEDGER ══════════════ */}
          {adminTab === 'ledger' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-brand-teal" strokeWidth={1.5} />
                    Clearance Audit Ledger
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Live transaction ledger for institutional clearance audits</p>
                </div>
              </div>

              <div className="table-container">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="Search ledger by transaction ref, payer, or due..."
                      value={ledgerSearch}
                      onChange={e => setLedgerSearch(e.target.value)}
                      className="field pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="table-header">
                      <tr>
                        <th className="table-th">Reference Ref</th>
                        <th className="table-th">Payer Name</th>
                        <th className="table-th">Matric / ID</th>
                        <th className="table-th">Levy Name</th>
                        <th className="table-th text-right">Amount (NGN)</th>
                        <th className="table-th text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReceipts.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="table-td font-mono font-bold text-brand-orange">{r.txRef}</td>
                          <td className="table-td font-semibold text-slate-900">{r.payerName}</td>
                          <td className="table-td font-mono">{r.payerId}</td>
                          <td className="table-td text-slate-700">{r.duesName}</td>
                          <td className="table-td text-right font-bold text-slate-900">₦{r.amount.toLocaleString()}</td>
                          <td className="table-td text-right text-slate-400">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Cleared'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 5: SETTINGS ══════════════ */}
          {adminTab === 'settings' && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                  Organization Settings
                </h1>
                <p className="text-xs text-slate-500 mt-1">Configure organizational details and certificate signature metadata</p>
              </div>

              <div className="card-premium p-6 space-y-6">
                <form onSubmit={e => { e.preventDefault(); setOrgSaved(true); setTimeout(() => setOrgSaved(false), 2000); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Organization Name</label>
                      <input type="text" value={orgSettings.name} onChange={e => setOrgSettings({ ...orgSettings, name: e.target.value })} className="field" />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Organization Code</label>
                      <input type="text" value={orgSettings.code} onChange={e => setOrgSettings({ ...orgSettings, code: e.target.value })} className="field font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Authorizing Bursary Officer</label>
                      <input type="text" value={orgSettings.bursarName} onChange={e => setOrgSettings({ ...orgSettings, bursarName: e.target.value })} className="field" />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contact Email</label>
                      <input type="email" value={orgSettings.contactEmail} onChange={e => setOrgSettings({ ...orgSettings, contactEmail: e.target.value })} className="field" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Settlement Bank</label>
                      <input type="text" value={orgSettings.bankName} onChange={e => setOrgSettings({ ...orgSettings, bankName: e.target.value })} className="field" />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Settlement Account Number</label>
                      <input type="text" value={orgSettings.accountNo} onChange={e => setOrgSettings({ ...orgSettings, accountNo: e.target.value })} className="field font-mono" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className={`btn-primary text-xs h-9 px-4 ${orgSaved ? 'bg-emerald-600' : ''}`}>
                      {orgSaved ? 'Settings Saved!' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── CREATE / EDIT DUE MODAL ─────────────────────────────────────────────── */}
      {showDueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDue ? 'Edit Levy Details' : 'Create New Due / Levy'}
              </h3>
              <button onClick={() => setShowDueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSaveDue} className="p-6 space-y-4 text-xs">
              {dueSuccessMsg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">{dueSuccessMsg}</div>}
              {dueErrorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg font-semibold">{dueErrorMsg}</div>}

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Levy Title</label>
                <input type="text" required placeholder="e.g. Departmental Clearance Levy" value={dueForm.name} onChange={e => setDueForm({ ...dueForm, name: e.target.value })} className="field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Amount (NGN)</label>
                  <input type="number" required placeholder="2500" value={dueForm.amount} onChange={e => setDueForm({ ...dueForm, amount: e.target.value })} className="field font-mono" />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select value={dueForm.category} onChange={e => setDueForm({ ...dueForm, category: e.target.value })} className="field">
                    <option>Departmental</option>
                    <option>Faculty</option>
                    <option>Student Union</option>
                    <option>Staff Union</option>
                    <option>Health</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Audience</label>
                  <select value={dueForm.roleTarget} onChange={e => setDueForm({ ...dueForm, roleTarget: e.target.value })} className="field">
                    <option value="student">Students Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="all">All Users</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Deadline</label>
                  <input type="date" value={dueForm.deadline} onChange={e => setDueForm({ ...dueForm, deadline: e.target.value })} className="field" />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea rows={3} placeholder="Brief description of the levy purpose..." value={dueForm.description} onChange={e => setDueForm({ ...dueForm, description: e.target.value })} className="field py-2" />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDueModal(false)} className="btn-secondary h-9 text-xs">Cancel</button>
                <button type="submit" disabled={savingDue} className="btn-primary h-9 text-xs">
                  {savingDue ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingDue ? 'Save Changes' : 'Create Levy')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ─────────────────────────────────────────── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 w-full max-w-sm p-6 space-y-4 animate-scale-in text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Levy</h3>
              <p className="text-xs text-slate-500 mt-1">Are you sure you want to permanently delete this levy? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1 h-9 text-xs">Cancel</button>
              <button
                onClick={() => handleDeleteDue(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="btn-danger flex-1 h-9 text-xs"
              >
                {deletingId === confirmDeleteId ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
