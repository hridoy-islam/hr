import React from 'react';
import { EditableField } from '../EditableField';
import { User, Phone, Info, Mail, Home, Activity } from 'lucide-react';

// --- Layout Components ---
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
    <div className="rounded-lg bg-theme/10 p-2">
      <Icon className="h-5 w-5 text-theme" />
    </div>
    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
      {title}
    </h3>
  </div>
);

const FormField = ({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="group flex items-start gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50/50">
    <div className="mt-1 flex-shrink-0">
      <Icon className="h-5 w-5 text-gray-400 transition-colors group-hover:text-theme" />
    </div>
    <div className="min-w-0 flex-1 space-y-1">
      <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </label>
      <div className="w-full">{children}</div>
    </div>
  </div>
);

// --- Status Badge Component ---
const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        isActive
          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

// --- Main Component ---
interface PersonalInfoTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  return (
    <div className="min-h-screen space-y-6 pb-10 duration-500 animate-in fade-in">
      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-theme/5 to-theme/10 px-6 py-8">
          <div className="flex items-center gap-6">
           
            
            {/* User Info */}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold text-gray-900">
                {formData.name || 'Service User'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Home className="h-4 w-4" />
                  <span>Room {formData.room || 'Not assigned'}</span>
                </div>
                <StatusBadge status={formData.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Left Column: Core Identity */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Info} title="General Information" />
          <div className="divide-y divide-gray-100">
            <FormField icon={User} label="Full Name">
              <EditableField
                id="name"
                label=""
                value={formData.name}
                onUpdate={(val) => onUpdate('name', val)}
                isSaving={isFieldSaving.name}
                required
              />
            </FormField>

            <FormField icon={Home} label="Room Number">
              <EditableField
                id="room"
                label=""
                value={formData.room}
                onUpdate={(val) => onUpdate('room', val)}
                isSaving={isFieldSaving.room}
                required
              />
            </FormField>

           
          </div>
        </div>

        {/* Right Column: Contact Details */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Phone} title="Contact Details" />
          <div className="divide-y divide-gray-100">
            <FormField icon={Mail} label="Email Address">
              <EditableField
                id="email"
                label=""
                value={formData.email}
                type="email"
                onUpdate={(val) => onUpdate('email', val)}
                isSaving={isFieldSaving.email}
                placeholder="Enter email address"
              />
            </FormField>

            <FormField icon={Phone} label="Phone Number">
              <EditableField
                id="phone"
                label=""
                value={formData.phone}
                onUpdate={(val) => onUpdate('phone', val)}
                isSaving={isFieldSaving.phone}
                placeholder="Enter phone number"
              />
            </FormField>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PersonalInfoTab;