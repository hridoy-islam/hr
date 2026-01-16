import React from 'react';

interface Tab {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="mb-8">
      <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex flex-wrap -mb-px overflow-x-auto px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-block px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ease-in-out whitespace-nowrap hover:text-blue-600
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:border-gray-300'
                }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};