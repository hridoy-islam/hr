import React from 'react';
import { EditableField } from '../components/EditableField';
import { Button } from '@/components/ui/button';

interface NoteItem {
  date: string;
  type: string;
  note: string;
}

interface NoteTabProps {
  formData: {
    notes: NoteItem[];
  };
  onUpdate: (field: string, value: any) => void;
  onDateChange: () => void;
  onSelectChange: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
}

const typeOptions = [
  { value: 'general', label: 'General' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
];

const NoteTab: React.FC<NoteTabProps> = ({
  formData,
  onUpdate,
  onSelectChange,
  onDateChange,
  isFieldSaving,
}) => {
  const notes = formData.notes || [];

  const handleNoteChange = (
    index: number,
    field: keyof NoteItem,
    value: string
  ) => {
    const updatedNotes = [...notes];
    updatedNotes[index][field] = value;
    onUpdate('notes', updatedNotes);
  };

  const addNote = () => {
    const updatedNotes = [
      ...notes,
      { date: '', type: '', note: '' }
    ];
    onUpdate('notes', updatedNotes);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900">
          Notes
        </h3>

        {notes.map((note, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EditableField
              id={`note-date-${index}`}
              label="Date"
              value={note.date}
              type="date"
              onUpdate={(val) => handleNoteChange(index, 'date', val)}
              isSaving={isFieldSaving[`notes.${index}.date`]}
            />

            <EditableField
              id={`note-type-${index}`}
              label="Type"
              value={note.type}
              type="select"
              options={typeOptions}
              onUpdate={(val) => handleNoteChange(index, 'type', val)}
              isSaving={isFieldSaving[`notes.${index}.type`]}
            />

            <EditableField
              id={`note-text-${index}`}
              label="Note"
              value={note.note}
              type="textarea"
              onUpdate={(val) => handleNoteChange(index, 'note', val)}
              isSaving={isFieldSaving[`notes.${index}.note`]}
            />
          </div>
        ))}

        <Button type="button" onClick={addNote}>
          + Add Note
        </Button>
      </div>
    </div>
  );
};

export default NoteTab;
