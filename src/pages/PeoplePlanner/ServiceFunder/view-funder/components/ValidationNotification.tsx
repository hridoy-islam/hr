import React from 'react';
import { AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';

interface ValidationNotificationProps {
  validation: { [key: string]: { isValid: boolean; missingFields: string[] } };
  onTabClick: (tabId: string) => void;
}

const tabLabels: { [key: string]: string } = {
  general: 'General',
  contact: 'Communication',
  travel: 'Travel Information',
  invoice: 'Invoice',
  invoiceContact: 'Invoice Contact',
  po: 'PO',
  travelDetails: 'Travel Details',
  adhocInvoice: 'Adhoc Invoice',
};


export const ValidationNotification: React.FC<ValidationNotificationProps> = ({
  validation,
  onTabClick,
}) => {
  const allTabs = Object.entries(validation);

  if (allTabs.length === 0) return null;

  return (
    <div className="w-72 bg-white border border-gray-200 rounded-lg shadow-lg self-center">
      <div className="p-2 space-y-2">
        {allTabs.map(([tabId, tabValidation]) => {
          const isInvalid = !tabValidation.isValid;
          const missingCount = tabValidation.missingFields.length;

          return (
            <div
              key={tabId}
              className={`group cursor-pointer p-3 rounded-md border transition-all duration-200 hover:border-supperagent ${
                isInvalid ? 'border-red-300' : 'border-gray-300'
              }`}
              onClick={() => onTabClick(tabId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-black">
                    {tabLabels[tabId] || tabId}
                  </span>

                  {isInvalid ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {missingCount}
                    </span>
                  ) : (
                    <CheckCircle className="text-green-500 w-4 h-4" />
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-supperagent group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
