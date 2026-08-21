import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchDues,
  fetchReceipts,
  createDue,
  updateDue,
  deleteDue,
  toggleDueActive,
  createReceipt,
} from '../api/apiService';

const DuesContext = createContext(null);

export function DuesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [duesCatalog, setDuesCatalog] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loadingDues, setLoadingDues] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const envFlwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
  const [settings, setSettings] = useState({
    mode: envFlwKey ? 'live' : 'simulated',
    publicKey: envFlwKey,
  });

  // Modal triggers for global modals
  const [selectedDueForPayment, setSelectedDueForPayment] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const loadDuesData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingDues(true);
    try {
      const data = await fetchDues(user?.role || 'student');
      setDuesCatalog(data);
    } catch (err) {
      console.warn('Failed to load dues:', err);
    } finally {
      setLoadingDues(false);
    }
  }, [isAuthenticated, user?.role]);

  const loadReceiptsData = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoadingReceipts(true);
    try {
      const data = await fetchReceipts(user);
      setReceipts(data);
    } catch (err) {
      console.warn('Failed to load receipts:', err);
    } finally {
      setLoadingReceipts(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDuesData();
      loadReceiptsData();
    } else {
      setDuesCatalog([]);
      setReceipts([]);
    }
  }, [isAuthenticated, user, loadDuesData, loadReceiptsData]);

  // Payment Initiation
  const initiatePayment = (due) => {
    setSelectedDueForPayment(due);
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedDueForPayment(null);
  };

  // Payment Recording
  const handlePaymentSuccess = async (newReceipt) => {
    if (!user) return;
    try {
      const saved = await createReceipt(newReceipt, user);
      setReceipts((prev) => {
        const withoutDuplicate = prev.filter((r) => r.tx_ref !== saved.tx_ref);
        return [saved, ...withoutDuplicate];
      });
      // Automatically open receipt modal after successful payment
      setSelectedReceiptForView(saved);
      setReceiptModalOpen(true);
    } catch (err) {
      console.error('Payment saving error:', err);
    }
  };

  // Receipt Modal trigger
  const viewReceipt = (receipt) => {
    setSelectedReceiptForView(receipt);
    setReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setReceiptModalOpen(false);
    setSelectedReceiptForView(null);
  };

  // Admin Dues Management helpers
  const handleCreateDue = async (dueData) => {
    const created = await createDue(dueData);
    setDuesCatalog((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateDue = async (id, dueData) => {
    const updated = await updateDue(id, dueData);
    setDuesCatalog((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const handleDeleteDue = async (id) => {
    await deleteDue(id);
    setDuesCatalog((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleDueActive = async (id, currentActive) => {
    const newStatus = await toggleDueActive(id, currentActive);
    setDuesCatalog((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: newStatus } : d))
    );
  };

  return (
    <DuesContext.Provider
      value={{
        duesCatalog,
        receipts,
        settings,
        setSettings,
        loadingDues,
        loadingReceipts,
        loadDuesData,
        loadReceiptsData,
        selectedDueForPayment,
        paymentModalOpen,
        initiatePayment,
        closePaymentModal,
        handlePaymentSuccess,
        selectedReceiptForView,
        receiptModalOpen,
        viewReceipt,
        closeReceiptModal,
        handleCreateDue,
        handleUpdateDue,
        handleDeleteDue,
        handleToggleDueActive,
      }}
    >
      {children}
    </DuesContext.Provider>
  );
}

export function useDues() {
  const context = useContext(DuesContext);
  if (!context) {
    throw new Error('useDues must be used within a DuesProvider');
  }
  return context;
}
