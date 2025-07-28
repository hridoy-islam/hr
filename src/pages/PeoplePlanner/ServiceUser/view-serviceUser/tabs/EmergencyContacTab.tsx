import React from 'react';
import { EditableField } from '../components/EditableField';
import { countries } from '@/types';

interface EmergencyContact {
  emergencyContactName: string;
  relationship: string;
  address: string;
  cityOrTown: string;
  country: string;
  postCode: string;
  note: string;
  phone: string;
  mobile: string;
  email: string;
  emailRota: boolean;
  sendInvoice: boolean;
}

interface EmergencyContactTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onSelectChange?: (field: string, value: any) => void;
  onDateChange?: (field: string, value: string) => void;
  isFieldSaving: Record<string, boolean>;
  getMissingFields: (tab: any, formData: Record<string, any>) => string[];
}

const EmergencyContactTab: React.FC<EmergencyContactTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving,
  getMissingFields
}) => {
  const contacts: EmergencyContact[] = formData.emergencyContacts || [];

  // Define options
  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const relationshipOptions = [
    { value: 'Parent', label: 'Parent' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Child', label: 'Child' },
    { value: 'Friend', label: 'Friend' },
    { value: 'Other', label: 'Other' }
  ];

  const countryOptions = countries.map((country) => ({
    value: country,
    label: country
  }));

  const updateContactField = <K extends keyof EmergencyContact>(
    index: number,
    field: K,
    value: EmergencyContact[K]
  ) => {
    const updated = [...contacts];
    updated[index][field] = value;
    onUpdate('emergencyContacts', updated);
  };

  const addNewContact = () => {
    const updated = [
      ...contacts,
      {
        emergencyContactName: '',
        relationship: '',
        address: '',
        cityOrTown: '',
        country: '',
        postCode: '',
        note: '',
        phone: '',
        mobile: '',
        email: '',
        emailRota: false,
        sendInvoice: false
      }
    ];
    onUpdate('emergencyContacts', updated);
  };

  const getMissingEmergencyFields = (contact: EmergencyContact) => {
    const requiredFields = ['emergencyContactName', 'relationship']; // Add more if needed
    return requiredFields.filter(
      (field) =>
        contact[field as keyof EmergencyContact] === '' ||
        contact[field as keyof EmergencyContact] === undefined
    );
  };

  const isFieldMissing = (index: number, field: keyof EmergencyContact) => {
    const contact = contacts[index];
    const missing = getMissingEmergencyFields(contact);
    return missing.includes(field);
  };

  return (
    <div className="space-y-8">
      {contacts.map((contact, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Emergency Contact #{index + 1}
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EditableField
              id={`relationship-${index}`}
              label="Relationship"
              value={contact.relationship}
              type="select"
              options={relationshipOptions}
              onUpdate={(val) => updateContactField(index, 'relationship', val)}
              isSaving={isFieldSaving['relationship']}
              isMissing={isFieldMissing(index, 'relationship')}
            />
            <EditableField
              id={`emergencyContactName-${index}`}
              label="Name"
              value={contact.emergencyContactName}
              type="text"
              onUpdate={(val) =>
                updateContactField(index, 'emergencyContactName', val)
              }
              required
              isSaving={isFieldSaving['emergencyContactName']}
              isMissing={isFieldMissing(index,'emergencyContactName')}
            />

            <EditableField
              id={`address-${index}`}
              label="Address"
              value={contact.address}
              type="text"
              onUpdate={(val) => updateContactField(index, 'address', val)}
              isSaving={isFieldSaving['address']}
            />

            <EditableField
              id={`cityOrTown-${index}`}
              label="City / Town"
              value={contact.cityOrTown}
              type="text"
              onUpdate={(val) => updateContactField(index, 'cityOrTown', val)}
              isSaving={isFieldSaving['cityOrTown']}
            />

            <EditableField
              id={`country-${index}`}
              label="Country"
              value={contact.country}
              type="select"
              options={countryOptions}
              onUpdate={(val) => updateContactField(index, 'country', val)}
              isSaving={isFieldSaving['country']}
            />

            <EditableField
              id={`postCode-${index}`}
              label="Post Code"
              value={contact.postCode}
              type="text"
              onUpdate={(val) => updateContactField(index, 'postCode', val)}
              isSaving={isFieldSaving['postCode']}
            />

            <EditableField
              id={`note-${index}`}
              label="Note"
              value={contact.note}
              type="text"
              onUpdate={(val) => updateContactField(index, 'note', val)}
              isSaving={isFieldSaving['note']}
            />

            <EditableField
              id={`phone-${index}`}
              label="Phone"
              value={contact.phone}
              type="text"
              onUpdate={(val) => updateContactField(index, 'phone', val)}
              isSaving={isFieldSaving['phone']}
            />

            <EditableField
              id={`mobile-${index}`}
              label="Mobile"
              value={contact.mobile}
              type="text"
              onUpdate={(val) => updateContactField(index, 'mobile', val)}
              isSaving={isFieldSaving['mobile']}
            />

            <EditableField
              id={`email-${index}`}
              label="Email"
              value={contact.email}
              type="email"
              onUpdate={(val) => updateContactField(index, 'email', val)}
              isSaving={isFieldSaving['email']}
            />

            <EditableField
              id={`emailRota-${index}`}
              label="Email Rota"
              value={contact.emailRota}
              type="select"
              options={booleanOptions}
              onUpdate={(val) => updateContactField(index, 'emailRota', val)}
              isSaving={isFieldSaving['emailRota']}
            />

            <EditableField
              id={`sendInvoice-${index}`}
              label="Send Invoice"
              value={contact.sendInvoice}
              type="select"
              options={booleanOptions}
              onUpdate={(val) => updateContactField(index, 'sendInvoice', val)}
              isSaving={isFieldSaving['sendInvoice']}
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={addNewContact}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add More
        </button>
      </div>
    </div>
  );
};

export default EmergencyContactTab;
