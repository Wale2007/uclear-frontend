import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DuesProvider } from './context/DuesContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import StudentStaffLayout from './layouts/StudentStaffLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import DuesPage from './pages/DuesPage';
import ReceiptsPage from './pages/ReceiptsPage';
import SettingsPage from './pages/SettingsPage';
import PublicReceiptPage from './pages/PublicReceiptPage';
import AdminPortal from './components/AdminPortal';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DuesProvider>
          <Routes>
            {/* ── Public Authentication & Verification Routes ── */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Public Receipt Verification Routes */}
            <Route path="/receipt/:txRef" element={<PublicReceiptPage />} />
            <Route path="/verify" element={<PublicReceiptPage />} />

            {/* ── Student & Staff Protected Portal Routes ── */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['student', 'staff']}>
                  <StudentStaffLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dues" element={<DuesPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* ── Institutional Executive Admin Routes ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPortal initialTab="overview" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:tab"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />

            {/* ── Catch-All Fallback ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </DuesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
