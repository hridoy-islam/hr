import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface TabValidation {
  isValid: boolean;
  missingFields: string[];
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  validation?: { [key: string]: TabValidation };
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, validation = {} }) => {
  const getTabStatus = (tabId: string) => {
    const tabValidation = validation[tabId];
    if (!tabValidation) return 'neutral';
    return tabValidation.isValid ? 'complete' : 'incomplete';
  };

  const getTabIcon = (tabId: string) => {
    const status = getTabStatus(tabId);
    switch (status) {
      case 'complete':
        return null;
      case 'incomplete':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTabStyles = (tabId: string) => {
    const status = getTabStatus(tabId);
    const isActive = activeTab === tabId;
    
    if (isActive) {
      return 'border-blue-500 text-blue-600 bg-blue-50';
    }
    
    switch (status) {
      case 'complete':
        return 'border-transparent text-green-600 hover:text-green-700 hover:border-green-300';
      case 'incomplete':
        return 'border-transparent text-red-600 hover:text-red-700 hover:border-red-300';
      default:
        return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }
  };

  return (
    <div className="mb-8">
      {/* <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex flex-wrap -mb-px overflow-x-auto ">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ease-in-out whitespace-nowrap ${getTabStyles(tab.id)}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {getTabIcon(tab.id)}
              <span>{tab.label}</span>
              {validation[tab.id] && !validation[tab.id].isValid && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {validation[tab.id].missingFields.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div> */}
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};