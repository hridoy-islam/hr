import React from 'react';
import { EditableField } from '../components/EditableField';
import { FileText, Calendar, User } from 'lucide-react';

interface NotesTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const NotesTab: React.FC<NotesTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Application Notes
          </h3>
        </div>
        
        <div className="space-y-6">
          <EditableField
            id="notes"
            label="General Notes"
            value={formData.notes}
            type="textarea"
            onUpdate={(value) => onUpdate('notes', value)}
            isSaving={isFieldSaving.notes}
            placeholder="Add any relevant notes about this applicant, interview feedback, or other important information..."
            rows={8}
            className="w-full"
          />
        </div>
      </div>

      

      
    </div>
  );
};

export default NotesTab;