import React from 'react';
import { EditableField } from '../components/EditableField';
import { countries } from '@/types';

interface Expense {
  expenseType: string;
  distance: string;
  payEmployee: boolean;
  invoiceCustomer: boolean;
  payAmount: number | null;
  invoiceAmount: number | null;
  notes: string;
}

interface ExpenseTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  isFieldSaving: Record<string, boolean>;
}

const ExpenseTab: React.FC<ExpenseTabProps> = ({
  formData,
  onUpdate,
  isFieldSaving
}) => {
  const expenses: Expense[] = formData.expenses || [];

  // Define options
  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const expenseTypeOptions = [
    { value: 'Mileage', label: 'Mileage' },
    { value: 'Lodging', label: 'Lodging' },
    { value: 'Meals', label: 'Meals' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Other', label: 'Other' }
  ];

  const distanceOptions = [
    { value: '50 miles', label: '50 miles' },
    { value: '100 miles', label: '100 miles' },
    { value: '200 miles', label: '200 miles' },
    { value: 'Other', label: 'Other' }
  ];

  const updateExpenseField = <K extends keyof Expense>(
    index: number,
    field: K,
    value: Expense[K]
  ) => {
    const updated = [...expenses];
    updated[index][field] = value;
    onUpdate('expenses', updated);
  };

  const addNewExpense = () => {
    const updated = [
      ...expenses,
      {
        expenseType: '',
        distance: '',
        payEmployee: false,
        invoiceCustomer: false,
        payAmount: null,
        invoiceAmount: null,
        notes: ''
      }
    ];
    onUpdate('expenses', updated);
  };

  const removeExpense = (index: number) => {
    const updated = [...expenses];
    updated.splice(index, 1);
    onUpdate('expenses', updated);
  };

  return (
    <div className="space-y-8">
      {expenses.map((expense, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Expense #{index + 1}
            </h3>
            <button
              onClick={() => removeExpense(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EditableField
              id={`expenseType-${index}`}
              label="Expense"
              value={expense.expenseType}
              type="select"
              options={expenseTypeOptions}
              onUpdate={(val) => updateExpenseField(index, 'expenseType', val)}
              isSaving={isFieldSaving[`expenseType-${index}`]}
              required
            />
            
            <EditableField
              id={`distance-${index}`}
              label="Distance "
              value={expense.distance}
              type="number"
              onUpdate={(val) => updateExpenseField(index, 'distance', val)}
              isSaving={isFieldSaving[`distance-${index}`]}
              required
            />

            <EditableField
              id={`payEmployee-${index}`}
              label="Pay Employee"
              value={expense.payEmployee}
             type="number"
              
              onUpdate={(val) => updateExpenseField(index, 'payEmployee', val)}
              isSaving={isFieldSaving[`payEmployee-${index}`]}
            />

            <EditableField
              id={`invoiceCustomer-${index}`}
              label="Invoice Customer"
              value={expense.invoiceCustomer}
              type="select"
              options={booleanOptions}
              onUpdate={(val) => updateExpenseField(index, 'invoiceCustomer', val)}
              isSaving={isFieldSaving[`invoiceCustomer-${index}`]}
            />

            <EditableField
              id={`payAmount-${index}`}
              label="Pay Amount"
              value={expense.payAmount}
              type="number"
              onUpdate={(val) => updateExpenseField(index, 'payAmount', Number(val) || null)}
              isSaving={isFieldSaving[`payAmount-${index}`]}
            />

            <EditableField
              id={`invoiceAmount-${index}`}
              label="Invoice Amount"
              value={expense.invoiceAmount}
              type="number"
              onUpdate={(val) => updateExpenseField(index, 'invoiceAmount', Number(val) || null)}
              isSaving={isFieldSaving[`invoiceAmount-${index}`]}
            />

            <div className="md:col-span-2">
              <EditableField
                id={`notes-${index}`}
                label="Notes"
                value={expense.notes}
                type="textarea"
                onUpdate={(val) => updateExpenseField(index, 'notes', val)}
                isSaving={isFieldSaving[`notes-${index}`]}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={addNewExpense}
          className="mt-4 rounded bg-supperagent px-4 py-2 text-white hoverbg-supperagent/90"
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default ExpenseTab;