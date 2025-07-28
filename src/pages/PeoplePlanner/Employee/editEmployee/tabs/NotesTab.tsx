import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EditableField } from '../EditableField';

interface NotesTabProps {
  formData: any;
  onUpdate: (fieldName: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const NotesTab: React.FC<NotesTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <EditableField
          id="notes"
          label="Additional Notes"
          value={formData.notes}
          type="textarea"
          onUpdate={(value) => onUpdate('notes', value)}
          isSaving={isFieldSaving['notes']}
          rows={6}
        />
      </CardContent>
    </Card>
  );
};

export default NotesTab;