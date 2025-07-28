import React from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ValidationNotificationProps {
  validation: { [key: string]: { isValid: boolean; missingFields: string[] } };
  onTabClick: (tabId: string) => void;
  userId
}

const tabLabels: { [key: string]: string } = {
  general: 'General',
  contact: 'Contact',
  equality: 'Equality',
  other: 'Other',
  emergency: 'Emergency Contact',
  criticalInfo: 'Critical Information',
  equipment: 'Required Equipment',
  primaryBranch: 'Branch & Area',
  note: 'Note'
};

export const ValidationNotification: React.FC<ValidationNotificationProps> = ({
  validation,
  onTabClick,
  userId
}) => {
  const allTabs = Object.entries(validation);
const navigate = useNavigate()
  if (allTabs.length === 0) return null;

  return (
    <div className="w-72 self-center rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="space-y-2 p-2">
        {allTabs.map(([tabId, tabValidation]) => {
          const isInvalid = !tabValidation.isValid;
          const missingCount = tabValidation.missingFields.length;

          return (
            <div
              key={tabId}
              className={`group cursor-pointer rounded-md border px-2 py-1 transition-all duration-200 hover:border-supperagent ${
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
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {missingCount}
                    </span>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-supperagent transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}

        {/* ✅ Static clickable "Funder" block */}
        <div
          className="group cursor-pointer rounded-md border border-gray-300 px-2 py-1 transition-all duration-200 hover:border-supperagent"
          onClick={() => navigate(`/admin/people-planner/service-user/${userId}/schedule`)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black">Schedule</span>
            <ChevronRight className="h-4 w-4 text-supperagent transition-transform group-hover:translate-x-1" />
          </div>
        </div>
        <div
          className="group cursor-pointer rounded-md border border-gray-300 px-2 py-1 transition-all duration-200 hover:border-supperagent"
          onClick={() => navigate(`/admin/people-planner/service-user/${userId}/funder`)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black">Funder</span>
            <ChevronRight className="h-4 w-4 text-supperagent transition-transform group-hover:translate-x-1" />
          </div>
        </div>
        <div
          className="group cursor-pointer rounded-md border border-gray-300 px-2 py-1 transition-all duration-200 hover:border-supperagent"
          onClick={() => navigate(`/admin/people-planner/service-user/${userId}/planner`)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black">Planning</span>
            <ChevronRight className="h-4 w-4 text-supperagent transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
