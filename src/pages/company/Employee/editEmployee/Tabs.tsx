import React from 'react';
import { ChevronRight } from 'lucide-react'; 

interface Tab {
  id: string;
  label: string;
  component: React.ReactNode;
  count?: number; // Added to support the red badges shown in your screenshot
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 w-full items-start">
      
      {/* 1. Tab List (Sidebar) - Left Side */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-2 bg-white p-4 shadow-md  rounded-lg border border-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                group flex w-full items-center justify-between rounded-lg border-2 border-gray-300  px-4 py-1 text-sm font-medium transition-all duration-200 ease-in-out
                ${
                  isActive
                    ? 'border-supperagent bg-white text-supperagent ring-2 ring-supperagent shadow-sm'
                    : 'border-gray-200 bg-white  hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{tab.label}</span>
              
              <div className="flex items-center gap-2">
                {/* Badge (Red Counter) */}
                {tab.count && tab.count > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {tab.count}
                  </span>
                )}
                
                {/* Chevron Icon */}
                <ChevronRight 
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-supperagent' : 'text-gray-400 group-hover:text-gray-500'
                  }`} 
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Tab Content - Right Side */}
      <div className="flex-1 min-w-0 w-full">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};