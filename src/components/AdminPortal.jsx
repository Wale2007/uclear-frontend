import React, { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
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
  Info,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import {
  fetchDues,
  createDue,
  updateDue,
  deleteDue,
  toggleDueActive,
  fetchAdminStats,
  fetchAdminProfiles,
  fetchAdminLedger,
  bulkUploadCsv,
} from '../api/apiService';

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

function getAuthorityForCategory(cat) {
  if (cat === 'Student Union') return 'SUG Executive Admin';
  if (cat === 'Faculty') return 'Faculty of Computing Admin';
  if (cat === 'Departmental') return 'Software Eng. Dept Admin';
  if (cat === 'Staff Union') return 'ASUU Union Executive';
  return 'University Bursar Admin';
}

const ADMIN_NAV = [
  { id: 'overview', to: '/admin/overview', label: 'Dashboard Overview', Icon: LayoutDashboard },
  { id: 'dues',     to: '/admin/dues',     label: 'Dues & Levies',      Icon: CreditCard       },
  { id: 'registry', to: '/admin/registry', label: 'Institutional Registry', Icon: Users        },
  { id: 'ledger',   to: '/admin/ledger',   label: 'Audit Ledger',       Icon: FileText         },
  { id: 'settings', to: '/admin/settings', label: 'Settings',           Icon: SettingsIcon     },
];

export default function AdminPortal({ initialTab = 'overview' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();

  const currentTab = routeTab || initialTab || 'overview';

  // Data state
  const [stats, setStats] = useState({ totalStudents: 20, totalStaff: 20, totalReceipts: 142, totalRevenue: 495000 });
  const [profiles, setProfiles] = useState([]);
  const [duesList, setDuesList] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registry Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Ledger Search
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
    name: '',
    amount: '',
    category: 'Departmental',
    description: '',
    deadline: '',
    roleTarget: 'student',
  });
  const [savingDue, setSavingDue] = useState(false);
  const [dueSuccessMsg, setDueSuccessMsg] = useState('');
  const [dueErrorMsg, setDueErrorMsg] = useState('');

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // User Clearance Inspector Modal
  const [inspectUser, setInspectUser] = useState(null);
  const [userStandingFilter, setUserStandingFilter] = useState('all');

  // Organization settings
  const [orgSettings, setOrgSettings] = useState({
    name: 'Student Union Government',
    code: 'FUTA-SUG-2026',
    bursarName: 'Prof. K. A. Adeleke',
    contactEmail: 'sug.admin@futa.edu.ng',
    bankName: 'FUTA Microfinance Bank',
    accountNo: '1100293847',
  });
  const [orgSaved, setOrgSaved] = useState(false);

  // ── Load All Admin Data ───────────────────────────────────────────────────
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, profilesData, duesData, ledgerData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminProfiles(),
        fetchDues('all'),
        fetchAdminLedger(),
      ]);

      if (statsData) setStats(statsData);
      if (profilesData) setProfiles(profilesData);
      if (duesData) setDuesList(duesData);
      if (ledgerData) setAllReceipts(ledgerData);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // ── Dues Management Handlers ──────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingDue(null);
    setDueForm({
      name: '',
      amount: '',
      category: 'Departmental',
      description: '',
      deadline: '',
      roleTarget: 'student',
    });
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
    if (!dueForm.name || !dueForm.amount) {
      setDueErrorMsg('Levy name and amount are required.');
      return;
    }

    setSavingDue(true);
    setDueErrorMsg('');
    setDueSuccessMsg('');

    try {
      if (editingDue) {
        const updated = await updateDue(editingDue.id, dueForm);
        setDuesList((prev) => prev.map((d) => (d.id === editingDue.id ? updated : d)));
        setDueSuccessMsg('Levy details updated successfully!');
      } else {
        const created = await createDue(dueForm);
        setDuesList((prev) => [created, ...prev]);
        setDueSuccessMsg('New levy created and published to all students/staff!');
      }

      setTimeout(() => {
        setShowDueModal(false);
        setDueSuccessMsg('');
      }, 1000);
    } catch (err) {
      setDueErrorMsg(err.message || 'Failed to save levy.');
    } finally {
      setSavingDue(false);
    }
  };

  const handleDeleteDue = async (id) => {
    setDeletingId(id);
    try {
      await deleteDue(id);
      setDuesList((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete due error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const newStatus = await toggleDueActive(id, currentActive);
      setDuesList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: newStatus } : d))
      );
    } catch (err) {
      console.warn('Toggle active error:', err);
    }
  };

  // ── CSV Bulk Import Handler ───────────────────────────────────────────────
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a CSV file to upload.');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    setUploadError('');

    try {
      const res = await bulkUploadCsv(selectedFile, uploadRole);
      setUploadResult(res);
      setSelectedFile(null);
      loadAdminData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload CSV.');
    } finally {
      setUploading(false);
    }
  };

  // Generate Sample CSV Template Download
  const downloadSampleCsv = (targetRole) => {
    let csvContent = '';
    let filename = '';

    if (targetRole === 'student') {
      csvContent =
        'name,email,phone,matric_no,department,faculty,level,password\n' +
        'Adebayo Samuel,s.adebayo@futa.edu.ng,08012345678,SEN/22/1001,Software Engineering,Computing,300 Level,password123\n' +
        'Ogunleye Chioma,c.ogunleye@futa.edu.ng,08098765432,CSC/22/2002,Computer Science,Computing,300 Level,password123\n';
      filename = 'futa_students_sample_template.csv';
    } else {
      csvContent =
        'name,title,email,phone,staff_id,department,faculty,password\n' +
        'Dr. Kehinde Alabi,Senior Lecturer,k.alabi@futa.edu.ng,08033334444,FUTA/STF/CS/2020,Computer Science,Computing,password123\n' +
        'Engr. Grace Okon,Lecturer I,g.okon@futa.edu.ng,08055556666,FUTA/STF/SE/3030,Software Engineering,Computing,password123\n';
      filename = 'futa_staff_sample_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Registry
  const filteredProfiles = profiles.filter((p) => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  // Filtered Receipts
  const filteredReceipts = allReceipts.filter((r) => {
    const term = ledgerSearch.toLowerCase();
    return (
      r.txRef?.toLowerCase().includes(term) ||
      r.payerName?.toLowerCase().includes(term) ||
      r.payerId?.toLowerCase().includes(term) ||
      r.duesName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 sm:px-6 h-14 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block text-2xs font-bold uppercase tracking-wider bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded border border-brand-orange/30">
            Institutional Admin
          </span>
        </div>

        {/* Identity & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-xs font-bold text-slate-100">{user?.name || 'Administrator'}</p>
            <p className="text-2xs text-slate-400 font-mono">{user?.department || 'Executive Bursary'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Layout Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-60 bg-white border-r border-slate-200/80 p-4 hidden md:flex flex-col justify-between flex-shrink-0">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Administrative Modules
              </p>
              <nav className="space-y-1">
                {ADMIN_NAV.map(({ id, to, label, Icon }) => (
                  <NavLink
                    key={id}
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

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-2xs space-y-1">
            <p className="font-bold text-slate-700">FUTA Electronic Ledger</p>
            <p className="text-slate-400">Security Clearance Level 3 &middot; Active Session</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-x-hidden">
          {/* ══════════════ VIEW 1: OVERVIEW ══════════════ */}
          {currentTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Institutional Admin Dashboard
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time oversight of dues compliance, revenue metrics, and clearance authorizations
                  </p>
                </div>
                <button
                  onClick={loadAdminData}
                  disabled={loading}
                  className="btn-secondary text-xs h-9 px-3 gap-1.5 self-start"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Ledger
                </button>
              </div>

              {/* 4 Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-premium p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled Students</p>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalStudents || profiles.filter(p => p.role === 'student').length}</p>
                  <p className="text-2xs text-slate-400">Registered across 9 faculties</p>
                </div>

                <div className="card-premium p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Academic &amp; Non-Staff</p>
                    <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalStaff || profiles.filter(p => p.role === 'staff').length}</p>
                  <p className="text-2xs text-slate-400">Enrolled institutional personnel</p>
                </div>

                <div className="card-premium p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Verified Clearances</p>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalReceipts || allReceipts.length}</p>
                  <p className="text-2xs text-slate-400">Total cleared invoices</p>
                </div>

                <div className="card-premium p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Gross Revenue Collected</p>
                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-brand-orange">
                    &#8358;{(stats.totalRevenue || 495000).toLocaleString()}
                  </p>
                  <p className="text-2xs text-slate-400">Settled through Flutterwave</p>
                </div>
              </div>

              {/* Dues Overview in Dashboard */}
              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Active Levies Summary</h3>
                  <button onClick={() => navigate('/admin/dues')} className="text-xs text-brand-orange hover:underline font-semibold">
                    Manage All Levies &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {duesList.slice(0, 6).map((d) => (
                    <div key={d.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-white border text-slate-600">
                          {d.category}
                        </span>
                        <StatusBadge active={d.isActive} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">{d.name}</p>
                      <p className="text-xs font-bold text-brand-orange">&#8358;{Number(d.amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 2: DUES & LEVIES ══════════════ */}
          {currentTab === 'dues' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Dues &amp; Levies Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Create, modify, and publish levies directly to student and staff payment catalogs
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="btn-primary text-xs h-9 px-4 gap-1.5 flex items-center shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Levy
                </button>
              </div>

              {/* Dues Table */}
              <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="table-header">
                      <tr>
                        <th className="table-th">Levy Title</th>
                        <th className="table-th">Target Category</th>
                        <th className="table-th">Managing Authority</th>
                        <th className="table-th">Target Audience</th>
                        <th className="table-th">Deadline</th>
                        <th className="table-th text-right">Amount (NGN)</th>
                        <th className="table-th text-center">Status</th>
                        <th className="table-th text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {duesList.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="table-td">
                            <p className="font-semibold text-slate-900">{d.name}</p>
                            <p className="text-2xs text-slate-400 max-w-xs truncate">{d.description}</p>
                          </td>
                          <td className="table-td">
                            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-600">
                              {d.category}
                            </span>
                          </td>
                          <td className="table-td text-2xs font-semibold text-slate-600">
                            {getAuthorityForCategory(d.category)}
                          </td>
                          <td className="table-td capitalize font-medium text-slate-600">
                            {d.roleTarget || 'student'}
                          </td>
                          <td className="table-td text-slate-500 font-medium">
                            {d.deadline
                              ? new Date(d.deadline).toLocaleDateString('en-NG', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'No Deadline'}
                          </td>
                          <td className="table-td text-right font-bold text-slate-900">
                            &#8358;{Number(d.amount).toLocaleString()}
                          </td>
                          <td className="table-td text-center">
                            <StatusBadge active={d.isActive} />
                          </td>
                          <td className="table-td text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleActive(d.id, d.isActive)}
                                title={d.isActive ? 'Hide from portal' : 'Publish to portal'}
                                className="p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              >
                                {d.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                              </button>
                              <button
                                onClick={() => openEditModal(d)}
                                className="p-1.5 rounded-lg border text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(d.id)}
                                className="p-1.5 rounded-lg border text-slate-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 3: REGISTRY & CSV ══════════════ */}
          {currentTab === 'registry' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                    Institutional Registry
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage enrolled students, staff records, and bulk import accounts via CSV
                  </p>
                </div>
              </div>

              {/* Bulk CSV Import with Interactive Guide */}
              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="h-4.5 w-4.5 text-brand-orange" />
                    Bulk CSV Account Import
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSampleCsv('student')}
                      className="text-2xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Student CSV Template
                    </button>
                    <span className="text-slate-300">&middot;</span>
                    <button
                      type="button"
                      onClick={() => downloadSampleCsv('staff')}
                      className="text-2xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Staff CSV Template
                    </button>
                  </div>
                </div>

                {/* CSV Format Schema Guide Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Info className="h-4 w-4 text-brand-orange" />
                    Required CSV Column Structure:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-2xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">For Students:</p>
                      <code className="block font-mono text-slate-600 bg-slate-50 p-1.5 rounded break-all">
                        name, email, phone, matric_no, department, faculty, level, password
                      </code>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">For Staff Members:</p>
                      <code className="block font-mono text-slate-600 bg-slate-50 p-1.5 rounded break-all">
                        name, title, email, phone, staff_id, department, faculty, password
                      </code>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleBulkUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Account Type
                    </label>
                    <select
                      value={uploadRole}
                      onChange={(e) => setUploadRole(e.target.value)}
                      className="field text-xs"
                    >
                      <option value="student">Students</option>
                      <option value="staff">Staff Members</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setUploadResult(null);
                        setUploadError('');
                      }}
                      className="field text-2xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="btn-primary text-xs h-10 flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Accounts'}
                  </button>
                </form>

                {uploadResult && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Successfully imported {uploadResult.imported} account records into the institutional registry!
                  </div>
                )}

                {uploadError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Registry Table with Search */}
              <div className="card-premium overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search registry by name, matric/staff ID, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="field pl-10 text-xs"
                    />
                  </div>
                  <div className="tabs-container">
                    {['all', 'student', 'staff'].map((r) => (
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
                        <th className="table-th text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredProfiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="table-td font-bold text-slate-900">{p.name}</td>
                          <td className="table-td">
                            <span className={`badge-${p.role === 'student' ? 'neutral' : 'warning'} text-2xs uppercase`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="table-td font-mono font-semibold">{p.matricNo || p.staffId || '—'}</td>
                          <td className="table-td text-slate-500">{p.email}</td>
                          <td className="table-td text-slate-600">{p.department || 'General'}</td>
                          <td className="table-td text-right">
                            <button
                              onClick={() => {
                                setInspectUser(p);
                                setUserStandingFilter('all');
                              }}
                              className="btn-secondary h-7 text-2xs px-3 gap-1.5 font-semibold inline-flex items-center"
                            >
                              <Eye className="h-3.5 w-3.5 text-brand-orange" />
                              View Payments
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ VIEW 4: AUDIT LEDGER ══════════════ */}
          {currentTab === 'ledger' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-brand-teal" strokeWidth={1.5} />
                    Clearance Audit Ledger
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Live transaction ledger for institutional clearance audits and bursary settlements
                  </p>
                </div>
              </div>

              <div className="card-premium overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ledger by reference, payer, matric no..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="field pl-10 text-xs"
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
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredReceipts.map((r) => (
                        <tr key={r.id || r.txRef} className="hover:bg-slate-50/50 transition-colors">
                          <td className="table-td font-mono font-bold text-brand-orange">{r.txRef}</td>
                          <td className="table-td font-semibold text-slate-900">{r.payerName}</td>
                          <td className="table-td font-mono font-semibold">{r.payerId}</td>
                          <td className="table-td text-slate-700">{r.duesName}</td>
                          <td className="table-td text-right font-bold text-slate-900">
                            ₦{Number(r.amount).toLocaleString()}
                          </td>
                          <td className="table-td text-right text-slate-400">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString('en-NG', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Cleared'}
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
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6 text-brand-orange" strokeWidth={1.5} />
                  Institutional Clearance Settings
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Configure administrative metadata, signing authority, and settlement accounts
                </p>
              </div>

              <div className="card-premium p-6 space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setOrgSaved(true);
                    setTimeout(() => setOrgSaved(false), 2000);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Administrative Unit Name
                      </label>
                      <input
                        type="text"
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Authority Code
                      </label>
                      <input
                        type="text"
                        value={orgSettings.code}
                        onChange={(e) => setOrgSettings({ ...orgSettings, code: e.target.value })}
                        className="field font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Authorizing Bursary Officer
                      </label>
                      <input
                        type="text"
                        value={orgSettings.bursarName}
                        onChange={(e) => setOrgSettings({ ...orgSettings, bursarName: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Official Contact Email
                      </label>
                      <input
                        type="email"
                        value={orgSettings.contactEmail}
                        onChange={(e) => setOrgSettings({ ...orgSettings, contactEmail: e.target.value })}
                        className="field"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className={`btn-primary text-xs h-9 px-4 ${orgSaved ? 'bg-emerald-600' : ''}`}>
                      {orgSaved ? 'Settings Saved Successfully!' : 'Save Configuration'}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDue ? 'Edit Institutional Levy' : 'Create New Due / Levy'}
              </h3>
              <button onClick={() => setShowDueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDue} className="p-6 space-y-4">
              {dueSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4" /> {dueSuccessMsg}
                </div>
              )}
              {dueErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {dueErrorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Levy Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Departmental Practical Fund"
                  value={dueForm.name}
                  onChange={(e) => setDueForm({ ...dueForm, name: e.target.value })}
                  className="field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Amount (NGN)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="5000"
                    value={dueForm.amount}
                    onChange={(e) => setDueForm({ ...dueForm, amount: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={dueForm.category}
                    onChange={(e) => setDueForm({ ...dueForm, category: e.target.value })}
                    className="field"
                  >
                    <option value="Student Union">Student Union (SUG)</option>
                    <option value="Faculty">Faculty Levy</option>
                    <option value="Departmental">Departmental Dues</option>
                    <option value="Staff Union">Staff Union (ASUU/NASU)</option>
                    <option value="Other">Other / Institutional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Target Audience</label>
                  <select
                    value={dueForm.roleTarget}
                    onChange={(e) => setDueForm({ ...dueForm, roleTarget: e.target.value })}
                    className="field"
                  >
                    <option value="student">Students Only</option>
                    <option value="staff">Staff Members Only</option>
                    <option value="all">Everyone (Students &amp; Staff)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Payment Deadline</label>
                  <input
                    type="date"
                    value={dueForm.deadline}
                    onChange={(e) => setDueForm({ ...dueForm, deadline: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of levy and clearance endorsement details..."
                  value={dueForm.description}
                  onChange={(e) => setDueForm({ ...dueForm, description: e.target.value })}
                  className="field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDueModal(false)}
                  className="btn-secondary text-xs h-9 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDue}
                  className="btn-primary text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  {savingDue && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingDue ? 'Save Changes' : 'Publish Levy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────────── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 text-center">
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Institutional Levy?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this due? Students will no longer be able to pay for it.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-xs h-8 px-4">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDue(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="btn-primary text-xs h-8 px-4 bg-red-600 hover:bg-red-700"
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER CLEARANCE INSPECTOR MODAL ───────────────────────────────────── */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{inspectUser.name}</h3>
                <p className="text-2xs font-mono text-slate-500">
                  {inspectUser.matricNo || inspectUser.staffId} &middot; {inspectUser.department || 'General'}
                </p>
              </div>
              <button onClick={() => setInspectUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <h4 className="font-bold text-slate-800">Clearance &amp; Payment Ledger Records:</h4>
              {allReceipts.filter(
                (r) =>
                  r.payerId === (inspectUser.matricNo || inspectUser.staffId) ||
                  r.payerName === inspectUser.name
              ).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border text-slate-400">
                  No payment records registered for this member in the clearance ledger yet.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden divide-y divide-slate-100">
                  {allReceipts
                    .filter(
                      (r) =>
                        r.payerId === (inspectUser.matricNo || inspectUser.staffId) ||
                        r.payerName === inspectUser.name
                    )
                    .map((r) => (
                      <div key={r.id || r.txRef} className="p-3.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{r.duesName}</p>
                          <p className="text-2xs font-mono text-slate-400">{r.txRef}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₦{Number(r.amount).toLocaleString()}</p>
                          <span className="badge-success text-2xs uppercase">Cleared</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setInspectUser(null)} className="btn-secondary text-xs h-8 px-4">
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
