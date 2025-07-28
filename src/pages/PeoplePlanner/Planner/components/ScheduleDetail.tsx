import {
  ArrowLeft,
  X,
  Clock,
  User,
  Calendar,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ValidationNotification } from './scheduleTabs/components/ValidationNotification';

import { useEditApplicant } from './scheduleTabs/hooks/useEditApplicant';
import type { schedule } from '@/types/planner';
import GeneralInfoTab from './scheduleTabs/tabs/GeneralInfoTab';
import EquipmentTab from './scheduleTabs/tabs/EquipmentTab';
import { Tabs } from './scheduleTabs/components/Tabs';
import ExpenseTab from './scheduleTabs/tabs/BreakTab';
import TagTab from './scheduleTabs/tabs/TagTab';
import DayOnOffTab from './scheduleTabs/tabs/DayOnOffTab';
import NoteTab from './scheduleTabs/tabs/NoteTab';
import PurchaseOrderTab from './scheduleTabs/tabs/PurchaseOrderTab';
import BreakTab from './scheduleTabs/tabs/BreakTab';

interface ScheduleDetailDialogProps {
  schedule: schedule | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDetailComponent({
  schedule,
  isOpen,
  onClose
}: ScheduleDetailDialogProps) {
  if (!isOpen || !schedule) return null;

  const {
    loading,
    activeTab,
    setActiveTab,
    formData,
    handleFieldUpdate,
    handleDateChange,
    handleSelectChange,
    handleCheckboxChange,
    isFieldSaving,
    getMissingFields,
    getTabValidation
  } = useEditApplicant();

  const tabValidation = getTabValidation();

  const tabs = [
    {
      id: 'general',
      label: 'General',
      component: (
        <GeneralInfoTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onDateChange={handleDateChange}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'equipment',
      label: 'Equipment',
      component: (
        <EquipmentTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'expense',
      label: 'Expenses',
      component: (
        <ExpenseTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'tag',
      label: 'Tag',
      component: (
        <TagTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'dayOnOff',
      label: 'Day ON/OFF',
      component: (
        <DayOnOffTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'note',
      label: 'Note',
      component: (
        <NoteTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
          getMissingFields={getMissingFields}
        />
      )
    },
    {
      id: 'po',
      label: 'PO',
      component: (
        <PurchaseOrderTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
    {
      id: 'break',
      label:'Break',
      component: (
        <BreakTab
          formData={formData}
          onUpdate={handleFieldUpdate}
          onSelectChange={handleSelectChange}
          isFieldSaving={isFieldSaving}
        />
      )
    },
  ];

  const handleTabNavigation = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {schedule.title}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Content */}
          <div className="flex-1 overflow-auto p-2">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              validation={tabValidation}
            />
          </div>

          {/* Validation Sidebar */}
          <div className="w-auto overflow-auto border-l border-gray-200 bg-gray-50 p-2">
            <ValidationNotification
              validation={tabValidation}
              onTabClick={handleTabNavigation}
              userId={schedule.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
