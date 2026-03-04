import React, { useEffect, useState } from 'react';
import { EditableField } from '../EditableField';
import axiosInstance from '@/lib/axios';
import { Loader2, Building2 } from 'lucide-react';
import { useSelector } from 'react-redux';

// --- Layout Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
    <Icon className="h-4 w-4 text-theme" />
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
      {title}
    </h3>
  </div>
);

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  isSaving?: boolean;
}

const FormRow = ({
  label,
  children,
  className = '',
  required,
  isSaving
}: FormRowProps) => (
  <div
    className={`group flex flex-col border-b border-gray-100 last:border-0 sm:flex-row ${className}`}
  >
    {/* Label Column */}
    <div className="flex items-center justify-between bg-gray-50/30 px-4 py-3 sm:w-1/3 lg:w-2/5 xl:w-1/3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900">
          {label}
        </span>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme" />}
    </div>

    {/* Input Column */}
    <div className="flex items-center bg-white px-4 py-2 sm:w-2/3 lg:w-3/5 xl:w-2/3">
      <div className="w-full">{children}</div>
    </div>
  </div>
);

// --- Main Component ---

interface SettingsTabProps {
  formData: any;
  onSelectChange: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  formData,
  onSelectChange,
  isFieldSaving
}) => {
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useSelector((state: any) => state.auth?.user) || null;

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [designationRes, departmentRes] = await Promise.all([
        axiosInstance(`/hr/designation?companyId=${user?._id}&limit=all`),
        axiosInstance(`/hr/department?companyId=${user?._id}&limit=all`)
      ]);

      setDesignations(designationRes.data.data.result || []);
      setDepartments(departmentRes.data.data.result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user?._id]);

  // Convert API data to select options
  const designationOptions = designations.map((des: any) => ({
    value: des._id,
    label: des.title
  }));

  const departmentOptions = departments.map((dep: any) => ({
    value: dep._id,
    label: dep.departmentName
  }));

  // ✅ Always return array of IDs (handles populated OR raw array)
  const designationIdValue = Array.isArray(formData?.designationId)
    ? formData.designationId.map((item: any) =>
        typeof item === 'object' ? item._id : item
      )
    : [];

  const departmentIdValue = Array.isArray(formData?.departmentId)
    ? formData.departmentId.map((item: any) =>
        typeof item === 'object' ? item._id : item
      )
    : [];

  return (
    <div className="space-y-6 duration-500 animate-in fade-in">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Organization Structure */}
        <div className="h-fit rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Building2} title="Organization Structure" />

          <div className="flex flex-col">
            {/* Designation */}
            <FormRow
              label="Designation"
              isSaving={isFieldSaving['designationId']}
            >
              {isLoading ? (
                <div className="flex items-center text-sm text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading options...
                </div>
              ) : (
                <EditableField
                  id="designationId"
                  label=""
                  value={designationIdValue}
                  type="select"
                  options={designationOptions}
                  multiple={true}
                  onUpdate={(value: any) =>
                    onSelectChange(
                      'designationId',
                      Array.isArray(value) ? value : []
                    )
                  }
                  isSaving={isFieldSaving['designationId']}
                />
              )}
            </FormRow>

            {/* Department */}
            <FormRow
              label="Department"
              isSaving={isFieldSaving['departmentId']}
            >
              {isLoading ? (
                <div className="flex items-center text-sm text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading options...
                </div>
              ) : (
                <EditableField
                  id="departmentId"
                  label=""
                  value={departmentIdValue}
                  type="select"
                  options={departmentOptions}
                  multiple={true}
                  onUpdate={(value: any) =>
                    onSelectChange(
                      'departmentId',
                      Array.isArray(value) ? value : []
                    )
                  }
                  isSaving={isFieldSaving['departmentId']}
                />
              )}
            </FormRow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
