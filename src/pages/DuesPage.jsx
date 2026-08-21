import React from 'react';
import DuesList from '../components/DuesList';
import { useDues } from '../context/DuesContext';

export default function DuesPage() {
  const { duesCatalog, receipts, initiatePayment, viewReceipt } = useDues();

  return (
    <div className="space-y-6 animate-fade-in">
      <DuesList
        dues={duesCatalog}
        receipts={receipts}
        onInitiatePayment={initiatePayment}
        onViewReceipt={viewReceipt}
      />
    </div>
  );
}
