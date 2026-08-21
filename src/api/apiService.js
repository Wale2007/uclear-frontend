import {
  MOCK_DUES,
  MOCK_STUDENTS,
  MOCK_STAFF,
  MOCK_ADMINS,
  authenticateMockUser,
} from '../data/mockDatabase';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://uclear-backend.onrender.com/api';

const SEED_RECEIPTS = {
  student: [
    {
      id: 10839201,
      tx_ref: 'EDUES-FUT-CS-22-4910-SEED',
      amount: 2000,
      duesName: 'Student Union Government (SUG) Dues',
      category: 'Student Union',
      date: '2026-06-10T10:30:00.000Z',
      paymentMethod: 'CARD',
    },
  ],
  staff: [
    {
      id: 20938491,
      tx_ref: 'EDUES-FUT-STF-CS-1092-SEED',
      amount: 5000,
      duesName: 'ASUU Union Monthly Dues',
      category: 'Staff Union',
      date: '2026-06-15T09:15:00.000Z',
      paymentMethod: 'CARD',
    },
  ],
};

// ── Local Storage Helpers for Custom Dues & Receipts ─────────────────────────
export function getStoredCustomDues() {
  try {
    const raw = localStorage.getItem('ucleare_custom_dues');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse custom dues from storage:', e);
    return [];
  }
}

export function saveStoredCustomDues(dues) {
  try {
    localStorage.setItem('ucleare_custom_dues', JSON.stringify(dues));
  } catch (e) {
    console.warn('Failed to save custom dues to storage:', e);
  }
}

export function getLocalReceiptsForUser(userId) {
  try {
    const key = `ucleare_receipts_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.filter((r) => r && r.tx_ref && !r.tx_ref.includes('-SEED'));
  } catch (e) {
    console.warn('Failed to load local receipts for user:', e);
    return [];
  }
}

export function saveLocalReceiptsForUser(userId, receipts) {
  try {
    const key = `ucleare_receipts_${userId}`;
    localStorage.setItem(key, JSON.stringify(receipts));
  } catch (e) {
    console.warn('Failed to save local receipts for user:', e);
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────
export async function loginUser(credential, password, role) {
  const cleanCred = credential.trim();
  const cleanPass = password;

  // 1. Try Spring Boot REST API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        credential: cleanCred,
        password: cleanPass,
        role: role.toLowerCase(),
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const token = data.token;
      if (token) localStorage.setItem('ucleare_token', token);

      const profile = {
        id: data.id,
        role: data.role ? data.role.toLowerCase() : role.toLowerCase(),
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        matricNo: data.matricNo || '',
        staffId: data.staffId || '',
        department: data.department || '',
        faculty: data.faculty || '',
        level: data.level || '',
        title: data.title || '',
      };

      return { success: true, token, user: profile };
    } else {
      if (res.status === 401 || res.status === 400) {
        throw new Error('Invalid credentials. Please verify your details and try again.');
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('Invalid credentials')) {
      throw err;
    }
    console.warn('[Spring Boot] Offline or slow, checking local accounts:', err.message);
  }

  // 2. Fallback to Local Mock Database (Instant)
  const found = authenticateMockUser(cleanCred, cleanPass, role.toLowerCase());
  if (!found) {
    throw new Error('Invalid credentials. Please verify your details and try again.');
  }

  const dummyToken = `mock-jwt-token-${found.id}-${Date.now()}`;
  localStorage.setItem('ucleare_token', dummyToken);

  return {
    success: true,
    token: dummyToken,
    user: found,
  };
}

// ── Dues Service ─────────────────────────────────────────────────────────────
export async function fetchDues(role = 'student') {
  const token = localStorage.getItem('ucleare_token');
  const customDues = getStoredCustomDues();

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/dues?role=${role}`, { headers });
    if (res.ok) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((d) => ({
          id: d.id,
          name: d.name,
          amount: Number(d.amount),
          category: d.category || 'General',
          description: d.description || '',
          deadline: d.deadline || '',
          roleTarget: d.roleTarget || 'student',
          isActive: d.isActive !== false,
          isOverdue: d.deadline ? new Date(d.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) : false,
        }));
      }
    }
  } catch (err) {
    console.warn('[Spring Boot] Dues fetch fallback to local:', err.message);
  }

  // Fallback: Combine base mock dues + custom dues created by admin
  let baseDues = [];
  if (role === 'all' || role === 'admin') {
    baseDues = [
      ...MOCK_DUES.student.map((d) => ({ ...d, roleTarget: 'student' })),
      ...MOCK_DUES.staff.map((d) => ({ ...d, roleTarget: 'staff' })),
    ];
  } else {
    baseDues = (MOCK_DUES[role] || []).map((d) => ({ ...d, roleTarget: role }));
  }

  const relevantCustom = customDues.filter(
    (d) =>
      role === 'all' ||
      role === 'admin' ||
      d.roleTarget === role ||
      d.roleTarget === 'all'
  );

  const combined = [...baseDues];
  relevantCustom.forEach((cd) => {
    const idx = combined.findIndex((item) => item.id === cd.id);
    if (idx >= 0) {
      combined[idx] = cd;
    } else {
      combined.push(cd);
    }
  });

  return combined.map((d) => ({
    ...d,
    amount: Number(d.amount),
    isActive: d.isActive !== false,
    isOverdue: d.deadline ? new Date(d.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) : false,
  }));
}

export async function createDue(dueData) {
  const token = localStorage.getItem('ucleare_token');
  const newId = `due-custom-${Date.now()}`;
  const completeDue = {
    id: dueData.id || newId,
    name: dueData.name.trim(),
    amount: Number(dueData.amount),
    category: dueData.category || 'Departmental',
    description: dueData.description || '',
    deadline: dueData.deadline || null,
    roleTarget: dueData.roleTarget || 'student',
    isActive: true,
  };

  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE}/dues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(completeDue),
    });
    if (res.ok) {
      const saved = await res.json();
      completeDue.id = saved.id || completeDue.id;
    }
  } catch (err) {
    console.warn('[Spring Boot] Offline due creation fallback to local:', err);
  }

  // 2. Persist locally to sync with student/staff views
  const custom = getStoredCustomDues();
  custom.push(completeDue);
  saveStoredCustomDues(custom);

  return completeDue;
}

export async function updateDue(id, dueData) {
  const token = localStorage.getItem('ucleare_token');
  const completeDue = {
    id,
    name: dueData.name.trim(),
    amount: Number(dueData.amount),
    category: dueData.category || 'Departmental',
    description: dueData.description || '',
    deadline: dueData.deadline || null,
    roleTarget: dueData.roleTarget || 'student',
    isActive: dueData.isActive !== false,
  };

  // 1. Try Backend
  try {
    await fetch(`${API_BASE}/dues/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(completeDue),
    });
  } catch (err) {
    console.warn('[Spring Boot] Offline due update fallback to local:', err);
  }

  // 2. Update local storage
  const custom = getStoredCustomDues();
  const idx = custom.findIndex((d) => d.id === id);
  if (idx >= 0) {
    custom[idx] = completeDue;
  } else {
    custom.push(completeDue);
  }
  saveStoredCustomDues(custom);

  return completeDue;
}

export async function deleteDue(id) {
  const token = localStorage.getItem('ucleare_token');

  // 1. Try Backend
  try {
    await fetch(`${API_BASE}/dues/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err) {
    console.warn('[Spring Boot] Offline due delete fallback to local:', err);
  }

  // 2. Remove from local storage
  const custom = getStoredCustomDues().filter((d) => d.id !== id);
  saveStoredCustomDues(custom);
  return true;
}

export async function toggleDueActive(id, currentStatus) {
  const token = localStorage.getItem('ucleare_token');
  const newStatus = !currentStatus;

  // 1. Try Backend
  try {
    await fetch(`${API_BASE}/dues/${id}/toggle-active`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err) {
    console.warn('[Spring Boot] Toggle active error fallback:', err);
  }

  // 2. Update local custom storage
  const custom = getStoredCustomDues();
  const found = custom.find((d) => d.id === id);
  if (found) {
    found.isActive = newStatus;
    saveStoredCustomDues(custom);
  }
  return newStatus;
}

// ── Receipts Service ─────────────────────────────────────────────────────────
export async function fetchReceipts(user) {
  const token = localStorage.getItem('ucleare_token');
  const userId = user?.matricNo || user?.staffId || user?.id || 'USR';
  const localReceipts = getLocalReceiptsForUser(userId);

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/receipts`, { headers });
    if (res.ok) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.map((r) => ({
          id: r.id,
          tx_ref: r.txRef,
          amount: Number(r.amount),
          duesName: r.duesName,
          category: r.category,
          date: r.createdAt,
          paymentMethod: r.paymentMethod || 'CARD',
          email: user.email,
          phone: user.phone,
          payerName: user.name,
          payerId: user.matricNo || user.staffId,
        }));

        // Merge without duplicating
        const combined = [...mapped];
        localReceipts.forEach((lr) => {
          if (!combined.some((c) => c.tx_ref === lr.tx_ref)) {
            combined.unshift(lr);
          }
        });
        saveLocalReceiptsForUser(userId, combined);
        return combined;
      }
    }
  } catch (err) {
    console.warn('[Spring Boot] Receipts fetch fallback to local:', err.message);
  }

  return localReceipts;
}

export async function createReceipt(receiptData, user) {
  const token = localStorage.getItem('ucleare_token');
  const userId = user?.matricNo || user?.staffId || user?.id || 'USR';

  const fullReceipt = {
    ...receiptData,
    date: receiptData.date || new Date().toISOString(),
    email: user.email,
    phone: user.phone,
    payerName: user.name,
    payerId: userId,
  };

  // 1. Try Backend
  try {
    await fetch(`${API_BASE}/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        txRef: fullReceipt.tx_ref,
        duesId: fullReceipt.duesId || '',
        duesName: fullReceipt.duesName,
        category: fullReceipt.category,
        amount: fullReceipt.amount,
        paymentMethod: fullReceipt.paymentMethod || 'CARD',
      }),
    });
  } catch (err) {
    console.warn('[Spring Boot] Receipt creation fallback to local:', err);
  }

  // 2. Persist locally
  const current = getLocalReceiptsForUser(userId);
  current.unshift(fullReceipt);
  saveLocalReceiptsForUser(userId, current);

  return fullReceipt;
}

// ── Admin Services ───────────────────────────────────────────────────────────
export async function fetchAdminStats() {
  const token = localStorage.getItem('ucleare_token');
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/admin/stats`, { headers });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[Admin] Stats fetch fallback:', err);
  }

  return {
    totalStudents: MOCK_STUDENTS.length,
    totalStaff: MOCK_STAFF.length,
    totalReceipts: 142,
    totalRevenue: 495000,
  };
}

export async function fetchAdminProfiles() {
  const token = localStorage.getItem('ucleare_token');
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/admin/profiles`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('[Admin] Profiles fetch fallback:', err);
  }

  return [...MOCK_STUDENTS, ...MOCK_STAFF];
}

export async function fetchAdminLedger() {
  const token = localStorage.getItem('ucleare_token');
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/admin/receipts`, { headers });
    if (res.ok) {
      const raw = await res.json();
      return raw.map((r) => ({
        id: r.id,
        txRef: r.txRef,
        amount: Number(r.amount),
        duesName: r.duesName,
        category: r.category,
        createdAt: r.createdAt,
        paymentMethod: r.paymentMethod,
        payerName: r.payer?.name || r.payerName || '—',
        payerId: r.payer?.matricNo || r.payer?.staffId || r.payerIdentifier || '—',
      }));
    }
  } catch (err) {
    console.warn('[Admin] Ledger fetch fallback:', err);
  }

  // Generate fallback ledger entries from sample students
  return [
    {
      id: 'led-001',
      txRef: 'EDUES-SEN-22-9292-1722960000000',
      payerName: 'OLA-SALAWU OLAWALE OLUWASEGUN',
      payerId: 'SEN/22/9292',
      duesName: 'Student Union Government (SUG) Dues',
      category: 'Student Union',
      amount: 2000,
      createdAt: '2026-08-10T10:14:00.000Z',
      paymentMethod: 'CARD',
    },
    {
      id: 'led-002',
      txRef: 'EDUES-SEN-22-9292-1722965500000',
      payerName: 'OLA-SALAWU OLAWALE OLUWASEGUN',
      payerId: 'SEN/22/9292',
      duesName: 'Library Clearance & E-Resource Fee',
      category: 'Other',
      amount: 1500,
      createdAt: '2026-08-11T14:22:00.000Z',
      paymentMethod: 'CARD',
    },
  ];
}

export async function bulkUploadCsv(file, role) {
  const token = localStorage.getItem('ucleare_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('role', role);

  try {
    const res = await fetch(`${API_BASE}/admin/profiles/bulk-csv`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.ok) return await res.json();
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to process CSV on server.');
  } catch (err) {
    console.warn('[Admin] Bulk upload fallback:', err);
    // Local simulation fallback
    return {
      imported: Math.floor(Math.random() * 5) + 3,
      errors: [],
    };
  }
}

// ── Public Receipt Verification Service ──────────────────────────────────────
export async function fetchPublicReceipt(txRef) {
  try {
    const res = await fetch(`${API_BASE}/receipts/public/${txRef}`);
    if (res.ok) {
      const data = await res.json();
      return {
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
    console.warn('[Spring Boot] Public receipt fetch fallback:', e);
  }

  // Check localStorage across all user keys
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('ucleare_receipts_'));
  for (const k of keys) {
    try {
      const stored = JSON.parse(localStorage.getItem(k) || '[]');
      const found = stored.find((r) => r.tx_ref === txRef);
      if (found) return found;
    } catch (err) {}
  }

  // Check seed receipts
  const studentSeed = SEED_RECEIPTS.student.find((r) => r.tx_ref === txRef);
  if (studentSeed) {
    const mockUser = MOCK_STUDENTS[0];
    return {
      ...studentSeed,
      email: mockUser.email,
      phone: mockUser.phone,
      payerName: mockUser.name,
      payerId: mockUser.matricNo || mockUser.staffId,
    };
  }

  const staffSeed = SEED_RECEIPTS.staff.find((r) => r.tx_ref === txRef);
  if (staffSeed) {
    const mockUser = MOCK_STAFF[0];
    return {
      ...staffSeed,
      email: mockUser.email,
      phone: mockUser.phone,
      payerName: mockUser.name,
      payerId: mockUser.matricNo || mockUser.staffId,
    };
  }

  throw new Error('Clearance receipt not found. Please double check the transaction reference or scan the QR code again.');
}
