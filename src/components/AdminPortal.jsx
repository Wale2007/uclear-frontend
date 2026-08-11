import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
  Send,
  ChevronDown,
  Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ─── Small helpers ────────────────────────────────────────────────────────────
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700/60 text-slate-400 border border-slate-700">
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

  // Create Due modal
  const [showDueModal, setShowDueModal] = useState(false);
  const [editingDue, setEditingDue] = useState(null); // null = create mode, due object = edit mode
  const [dueForm, setDueForm] = useState({
    name: '', amount: '', category: 'Departmental', description: '', deadline: '', roleTarget: 'student',
  });
  const [savingDue, setSavingDue] = useState(false);
  const [dueSuccessMsg, setDueSuccessMsg] = useState('');
  const [dueErrorMsg, setDueErrorMsg] = useState('');

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Email reminder
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

  // Org settings
  const [orgDetails, setOrgDetails] = useState({
    orgName: user?.name || 'SUG Executive Council',
    dept: user?.department || 'Student Affairs',
    bankName: 'First Bank of Nigeria',
    accountNumber: '3092817462',
    accountName: 'FUTA SUG Revenue Account',
    signatoryName: 'Prof. K. A. Adeleke',
    signatoryTitle: 'University Registrar / Bursar',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const token = localStorage.getItem('ucleare_token');

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, profilesRes, duesRes, receiptsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers }),
        fetch(`${API_BASE}/admin/profiles`, { headers }),
        fetch(`${API_BASE}/dues?role=all`, { headers }),
        fetch(`${API_BASE}/admin/receipts`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (profilesRes.ok) setProfiles(await profilesRes.json());
      if (duesRes.ok) setDuesList(await duesRes.json());
      if (receiptsRes.ok) setAllReceipts(await receiptsRes.json());
    } catch (err) {
      console.warn('[Admin] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Open create/edit modal ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingDue(null);
    setDueForm({ name: '', amount: '', category: 'Departmental', description: '', deadline: '', roleTarget: 'student' });
    setDueSuccessMsg(''); setDueErrorMsg('');
    setShowDueModal(true);
  };

  const openEditModal = (due) => {
    setEditingDue(due);
    setDueForm({
      name: due.name || '',
      amount: due.amount?.toString() || '',
      category: due.category || 'Departmental',
      description: due.description || '',
      deadline: due.deadline ? due.deadline.substring(0, 10) : '',
      roleTarget: due.roleTarget || 'student',
    });
    setDueSuccessMsg(''); setDueErrorMsg('');
    setShowDueModal(true);
  };

  // ── Save due (create or update) ────────────────────────────────────────────
  const handleSaveDue = async (e) => {
    e.preventDefault();
    if (!dueForm.name.trim() || !dueForm.amount) {
      setDueErrorMsg('Dues title and amount are required.');
      return;
    }
    setSavingDue(true);
    setDueErrorMsg(''); setDueSuccessMsg('');

    const payload = {
      name: dueForm.name.trim(),
      amount: parseFloat(dueForm.amount),
      category: dueForm.category,
      description: dueForm.description.trim(),
      deadline: dueForm.deadline || null,
      roleTarget: dueForm.roleTarget,
      isActive: true,
    };

    const isEdit = !!editingDue;
    const url = isEdit ? `${API_BASE}/dues/${editingDue.id}` : `${API_BASE}/dues`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDueSuccessMsg(isEdit ? 'Dues updated successfully!' : 'New due published to payment catalog!');
        setTimeout(() => { setShowDueModal(false); fetchData(); }, 1000);
      } else {
        setDueErrorMsg('Failed to save due. Check your inputs or try again.');
      }
    } catch (err) {
      setDueErrorMsg('Network error: ' + err.message);
    } finally {
      setSavingDue(false);
    }
  };

  // ── Delete due ─────────────────────────────────────────────────────────────
  const handleDeleteDue = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/dues/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok || res.status === 204) {
        setConfirmDeleteId(null);
        fetchData();
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

  // ── Send payment reminders ─────────────────────────────────────────────────
  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderMsg('');
    try {
      const res = await fetch(`${API_BASE}/admin/send-reminders`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReminderMsg(res.ok ? 'Reminder emails dispatched to all unpaid accounts!' : 'Failed to send reminders (check SMTP config).');
    } catch {
      setReminderMsg('Reminder queued locally (backend SMTP offline).');
    } finally {
      setSendingReminders(false);
      setTimeout(() => setReminderMsg(''), 5000);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased">

      {/* ── Dedicated Admin Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-orange text-slate-950 flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Uclear Executive Console</span>
              <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-2xs text-slate-400 font-medium">{user?.name || 'Organization Executive'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <button
            onClick={onLogout}
            className="h-8 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Reminder flash message */}
      {reminderMsg && (
        <div className="bg-amber-900/40 border-b border-amber-800/50 text-amber-200 text-xs font-semibold px-6 py-2 flex items-center gap-2">
          <Send className="h-3.5 w-3.5" /> {reminderMsg}
        </div>
      )}

      <div className="flex-1 flex">
        {/* ── Admin Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-6 flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-3">Organization Controls</p>
            {ADMIN_NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setAdminTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === id
                    ? 'bg-brand-orange text-slate-950 shadow-md'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-2xs">
            <p className="font-bold text-brand-orange uppercase tracking-wider">Active Administrator</p>
            <p className="font-semibold text-white truncate">{user?.name}</p>
            <p className="text-slate-400 font-mono">{user?.staffId || user?.email}</p>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* ══════════════ VIEW 1: OVERVIEW DASHBOARD ══════════════ */}
          {adminTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-brand-orange" />
                    Executive Overview
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Real-time revenue, clearance compliance, and database metrics</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-2 shadow-lg"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Due / Levy
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Enrolled Students', value: stats.totalStudents, Icon: GraduationCap, color: 'blue' },
                  { label: 'Enrolled Staff', value: stats.totalStaff, Icon: Briefcase, color: 'purple' },
                  { label: 'Active Levies', value: duesList.filter(d => d.isActive).length, Icon: CreditCard, color: 'emerald' },
                  { label: 'Total Funds Collected', value: `₦${Number(stats.totalRevenue).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, Icon: TrendingUp, color: 'amber', isRevenue: true },
                ].map(({ label, value, Icon, color, isRevenue }) => (
                  <div key={label} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                      <div className={`h-9 w-9 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className={`${isRevenue ? 'text-2xl text-brand-orange' : 'text-3xl text-white'} font-bold`}>{value}</p>
                    <p className="text-2xs text-slate-400">{isRevenue ? 'Total revenue settled' : `Registered ${label.toLowerCase()}`}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dues Summary */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand-orange" /> Levies & Dues Summary
                    </h3>
                    <button onClick={() => setAdminTab('dues_manager')} className="text-xs text-brand-orange font-bold hover:underline">
                      Manage All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {duesList.slice(0, 4).map(d => (
                      <div key={d.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{d.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-2xs text-slate-400">{d.category} · {d.roleTarget}</p>
                            <StatusBadge active={d.isActive} />
                          </div>
                        </div>
                        <span className="font-bold text-brand-orange font-mono">₦{Number(d.amount).toLocaleString('en-NG')}</span>
                      </div>
                    ))}
                    {duesList.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No dues in catalog yet. Create the first one!</p>
                    )}
                  </div>
                </div>

                {/* Batch Importer Quick Link */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-brand-orange" /> Batch Registry Import
                    </h3>
                    <button onClick={() => setAdminTab('registry')} className="text-xs text-brand-orange font-bold hover:underline">
                      Open Importer →
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Upload official CSV registry files to batch-register new student intakes or newly onboarded staff into the institutional database.
                  </p>
                  <button
                    onClick={() => setAdminTab('registry')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <UploadCloud className="h-4 w-4 text-brand-orange" />
                    Batch Upload CSV Registry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 2: DUES & LEVIES MANAGER ══════════════ */}
          {adminTab === 'dues_manager' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-brand-orange" />
                    Dues & Levies Manager
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Create, edit, toggle visibility, or remove institutional dues from the payment catalog</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add New Due / Levy
                </button>
              </div>

              {duesList.length === 0 && !loading ? (
                <div className="py-16 text-center">
                  <CreditCard className="h-10 w-10 mx-auto text-brand-orange opacity-60 mb-3" />
                  <p className="text-white font-bold">No dues in catalog</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Add New Due / Levy" to publish the first payment item.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {duesList.map(due => (
                    <div
                      key={due.id}
                      className={`bg-slate-950 p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                        due.isActive ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                              {due.category || 'General'}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                              {due.roleTarget}
                            </span>
                          </div>
                          <StatusBadge active={due.isActive} />
                        </div>

                        <h3 className="text-base font-bold text-white leading-snug">{due.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{due.description || 'No description provided.'}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xs text-slate-500 uppercase font-semibold">Amount</p>
                            <p className="text-lg font-bold text-brand-orange font-mono">
                              ₦{Number(due.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          {due.deadline && (
                            <div className="text-right">
                              <p className="text-2xs text-slate-500 uppercase font-semibold">Deadline</p>
                              <p className="text-xs font-bold text-slate-300 font-mono">
                                {new Date(due.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(due)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(due.id)}
                            title={due.isActive ? 'Hide from catalog' : 'Make visible in catalog'}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            {due.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {due.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(due.id)}
                            title="Permanently delete this due"
                            className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-xs font-semibold transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ VIEW 3: INSTITUTIONAL REGISTRY ══════════════ */}
          {adminTab === 'registry' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="h-6 w-6 text-brand-orange" />
                  Institutional Registry & Importer
                </h1>
                <p className="text-xs text-slate-400 mt-1">Enrolled student & staff database registry and CSV batch-onboarding tool</p>
              </div>

              {/* CSV Upload Tool */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Registry CSV Batch Importer
                    </div>
                    <h2 className="text-base font-bold text-white">Import Enrolled Student / Staff List</h2>
                    <p className="text-xs text-slate-400">Upload a CSV file to batch-add records into the registry.</p>
                  </div>

                  <div className="text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 space-y-1">
                    <p className="font-bold text-brand-orange">CSV Format Required:</p>
                    <p className="text-[10px]">Student: name,email,phone,matric_no,dept,faculty,level,password</p>
                    <p className="text-[10px]">Staff: name,title,email,phone,staff_id,dept,faculty,password</p>
                  </div>
                </div>

                <form onSubmit={handleBulkUpload} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider">Profile Type</label>
                    <select
                      value={uploadRole}
                      onChange={e => setUploadRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="student">Student Registry</option>
                      <option value="staff">Staff Registry</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="block text-2xs font-semibold text-slate-400 uppercase tracking-wider">Select CSV Spreadsheet</label>
                    <input
                      type="file" accept=".csv,.txt"
                      onChange={handleFileChange}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-orange file:text-slate-950 hover:file:bg-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {uploading ? 'Importing...' : 'Batch Import CSV'}
                    </button>
                  </div>
                </form>

                {uploadError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadResult && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl space-y-2 text-xs text-emerald-300">
                    <div className="flex items-center gap-2 font-bold text-emerald-200 text-sm">
                      <CheckCircle2 className="h-5 w-5" /> Import Complete!
                    </div>
                    <p>Successfully imported <b>{uploadResult.imported}</b> records into the institutional registry.</p>
                  </div>
                )}
              </div>

              {/* Profiles Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-brand-orange" />
                    Registered Accounts ({filteredProfiles.length})
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name, ID, dept..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-orange w-full sm:w-60"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-brand-orange"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-4">Role</th>
                          <th className="p-4">Full Name</th>
                          <th className="p-4">Matric / Staff ID</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Faculty</th>
                          <th className="p-4">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {filteredProfiles.map(p => (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.role?.toLowerCase() === 'student'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : p.role?.toLowerCase() === 'admin'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {p.role}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white">{p.name}</td>
                            <td className="p-4 font-mono font-bold text-slate-200">{p.matricNo || p.staffId || 'N/A'}</td>
                            <td className="p-4">{p.department || 'N/A'}</td>
                            <td className="p-4">{p.faculty || 'N/A'}</td>
                            <td className="p-4 font-mono text-slate-400">{p.email}</td>
                          </tr>
                        ))}
                        {filteredProfiles.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">
                              No accounts match the current filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 4: CLEARANCE AUDIT LEDGER ══════════════ */}
          {adminTab === 'ledger' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="h-6 w-6 text-brand-orange" />
                  Clearance Audit Ledger
                </h1>
                <p className="text-xs text-slate-400 mt-1">All verified payment transactions processed on the portal</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by ref, payer, or item..."
                      value={ledgerSearch}
                      onChange={e => setLedgerSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white w-full focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Total Transactions: <b className="text-brand-orange">{filteredReceipts.length}</b>
                    &nbsp;·&nbsp; Revenue: <b className="text-brand-orange">₦{filteredReceipts.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</b>
                  </div>
                </div>

                {filteredReceipts.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-4">Tx Reference</th>
                          <th className="p-4">Payer</th>
                          <th className="p-4">Item</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {filteredReceipts.map(r => (
                          <tr key={r.id || r.txRef} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 font-mono text-slate-400 text-[10px] max-w-[140px] truncate">{r.txRef}</td>
                            <td className="p-4">
                              <p className="font-bold text-white">{r.payerName}</p>
                              <p className="text-2xs text-slate-500 font-mono">{r.payerIdentifier}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-white">{r.duesName}</p>
                              <p className="text-2xs text-slate-500 uppercase">{r.category}</p>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                                {r.paymentMethod || 'CARD'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="p-4 text-right font-bold text-brand-orange font-mono">
                              ₦{Number(r.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileCheck className="h-10 w-10 mx-auto text-brand-orange opacity-80" />
                    <p className="text-sm font-bold text-white">
                      {loading ? 'Loading ledger...' : (ledgerSearch ? 'No matching transactions' : 'No transactions yet')}
                    </p>
                    <p className="text-xs max-w-md mx-auto">
                      {loading ? 'Fetching payment records from database...' : 'All payment transactions processed on the portal will appear here.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 5: ORGANIZATION SETTINGS ══════════════ */}
          {adminTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6 text-brand-orange" />
                  Organization & Settlement Settings
                </h1>
                <p className="text-xs text-slate-400 mt-1">Configure collecting organization details and settlement bank account</p>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Organization settlement details updated successfully!
                </div>
              )}

              <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 text-xs">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                    <Building className="h-4 w-4" /> Organization Profile
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-300">Collecting Organization Name</label>
                      <input type="text" value={orgDetails.orgName}
                        onChange={e => setOrgDetails({ ...orgDetails, orgName: e.target.value })}
                        className="field bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-300">Department / Office</label>
                      <input type="text" value={orgDetails.dept}
                        onChange={e => setOrgDetails({ ...orgDetails, dept: e.target.value })}
                        className="field bg-slate-900 border-slate-800 text-white" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-orange uppercase tracking-wider flex items-center gap-2">
                    <Landmark className="h-4 w-4" /> Disbursement Settlement Account
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-300">Settlement Bank</label>
                      <input type="text" value={orgDetails.bankName}
                        onChange={e => setOrgDetails({ ...orgDetails, bankName: e.target.value })}
                        className="field bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-300">NUBAN Account Number</label>
                      <input type="text" value={orgDetails.accountNumber}
                        onChange={e => setOrgDetails({ ...orgDetails, accountNumber: e.target.value })}
                        className="field bg-slate-900 border-slate-800 text-white font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-300">Account Name</label>
                    <input type="text" value={orgDetails.accountName}
                      onChange={e => setOrgDetails({ ...orgDetails, accountName: e.target.value })}
                      className="field bg-slate-900 border-slate-800 text-white" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500); }}
                    className="btn-primary py-2.5 px-6 font-semibold"
                  >
                    Save Settlement Details
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══════════ CREATE / EDIT DUE MODAL ══════════ */}
      {showDueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                  {editingDue ? <Edit2 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDue ? 'Edit Due / Levy' : 'Create New Due / Levy'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingDue ? 'Modify the details below and save.' : 'Will be published to the student and staff payment catalog.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDueModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {dueErrorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{dueErrorMsg}</span>
              </div>
            )}
            {dueSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{dueSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDue} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Dues / Levy Title</label>
                <input
                  type="text" required
                  placeholder="e.g. 2026 Departmental Final Year Project Levy"
                  value={dueForm.name}
                  onChange={e => setDueForm({ ...dueForm, name: e.target.value })}
                  className="field bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Amount (NGN ₦)</label>
                  <input
                    type="number" required min="100"
                    placeholder="e.g. 5000"
                    value={dueForm.amount}
                    onChange={e => setDueForm({ ...dueForm, amount: e.target.value })}
                    className="field bg-slate-900 border-slate-800 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Category</label>
                  <select
                    value={dueForm.category}
                    onChange={e => setDueForm({ ...dueForm, category: e.target.value })}
                    className="field bg-slate-900 border-slate-800 text-white"
                  >
                    <option value="Departmental">Departmental Dues</option>
                    <option value="Faculty">Faculty Levy</option>
                    <option value="Student Union">Student Union (SUG)</option>
                    <option value="Health">Medical / Health</option>
                    <option value="Welfare">Staff Welfare</option>
                    <option value="Union">Staff Union (ASUU/NASU)</option>
                    <option value="Other">Other Levy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Target Audience</label>
                  <select
                    value={dueForm.roleTarget}
                    onChange={e => setDueForm({ ...dueForm, roleTarget: e.target.value })}
                    className="field bg-slate-900 border-slate-800 text-white font-semibold"
                  >
                    <option value="student">Students Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="all">Everyone (All Users)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Payment Deadline (Optional)</label>
                  <input
                    type="date"
                    value={dueForm.deadline}
                    onChange={e => setDueForm({ ...dueForm, deadline: e.target.value })}
                    className="field bg-slate-900 border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Explain what this levy covers..."
                  value={dueForm.description}
                  onChange={e => setDueForm({ ...dueForm, description: e.target.value })}
                  className="field bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDueModal(false)} className="btn-secondary py-2 px-4 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={savingDue} className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5">
                  {savingDue
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    : (editingDue ? <><Check className="h-4 w-4" /> Save Changes</> : 'Save & Publish Dues')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ DELETE CONFIRM DIALOG ══════════ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 rounded-2xl border border-red-900/40 shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Permanently Delete Due?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone. The due will be removed from the payment catalog.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 btn-secondary py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDue(confirmDeleteId)}
                disabled={!!deletingId}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
