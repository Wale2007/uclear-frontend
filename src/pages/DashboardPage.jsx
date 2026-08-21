import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../context/AuthContext';
import { useDues } from '../context/DuesContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { duesCatalog, receipts, viewReceipt } = useDues();
  const navigate = useNavigate();

  return (
    <Dashboard
      user={user}
      dues={duesCatalog}
      receipts={receipts}
      onViewReceipt={viewReceipt}
      onNavigate={(tab) => navigate(`/${tab}`)}
    />
  );
}
