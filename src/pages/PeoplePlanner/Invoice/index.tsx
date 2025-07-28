import React, { useState } from 'react';
import IndividualInvoiceForm from './components/IndividualInvoiceModal';
import Invoice from './components/InvoicePage';

function InvoicePage() {
  const [currentView, setCurrentView] = useState<'invoices' | 'create-invoice'>('invoices');

  return (
    <div className="min-h-screen ">
      {currentView === 'invoices' && (
        <Invoice onCreateInvoice={() => setCurrentView('create-invoice')} />
      )}
      {currentView === 'create-invoice' && (
        <IndividualInvoiceForm onClose={() => setCurrentView('invoices')} />
      )}
    </div>
  );
}

export default InvoicePage;