import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  component: React.ReactNode;
  count?: number; // Optional badge count
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full items-start">
      
      {/* 1. Tab List (Sidebar) - Left Side */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-3 bg-white p-4 shadow-md rounded-xl border border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                group flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out outline-none
                ${
                  isActive
                    ? 'border-theme bg-blue-50 text-theme ring-1 ring-theme shadow-sm' 
                    : 'border-transparent hover:border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Label */}
              <span className="truncate">{tab.label}</span>
              
              {/* Right Side: Badge + Icon */}
              <div className="flex items-center gap-3">
                {/* Badge (Red Counter) */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                    {tab.count}
                  </span>
                )}
                
                {/* Chevron Icon */}
                <ChevronRight 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isActive ? 'text-theme' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Tab Content - Right Side */}
      <div className="flex-1 min-w-0 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};