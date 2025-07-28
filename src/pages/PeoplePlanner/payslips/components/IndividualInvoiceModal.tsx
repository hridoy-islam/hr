import React, { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Check,
  Save,
  Edit,
  Trash2
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface IndividualInvoiceFormProps {
  onClose: () => void;
}

interface ServiceUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ServiceLine {
  id: string;
  date: string;
  service: string;
  duration: number;
  rate: number;
  amount: number;
  notes: string;
  isEditing?: boolean;
}

const mockUsers: ServiceUser[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '(555) 123-4567'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '(555) 234-5678'
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@example.com',
    phone: '(555) 345-6789'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    phone: '(555) 456-7890'
  }
];

const mockServiceLines: ServiceLine[] = [
  {
    id: '1',
    date: '2025-01-10',
    service: 'Personal Care Support',
    duration: 3,
    rate: 45.0,
    amount: 135.0,
    notes: 'Morning routine assistance'
  },
  {
    id: '2',
    date: '2025-01-12',
    service: 'Community Participation',
    duration: 4,
    rate: 50.0,
    amount: 200.0,
    notes: 'Shopping and social activities'
  },
  {
    id: '3',
    date: '2025-01-14',
    service: 'Domestic Assistance',
    duration: 2.5,
    rate: 42.0,
    amount: 105.0,
    notes: 'Cleaning and meal preparation'
  }
];

const IndividualInvoiceForm: React.FC<IndividualInvoiceFormProps> = ({
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<
    'create' | 'review' | 'finalized'
  >('create');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [editingLine, setEditingLine] = useState<string | null>(null);

  const selectedUser = mockUsers.find((user) => user.id === selectedUserId);

  const handleGenerate = () => {
    if (!selectedUserId || !selectedDate) {
      return;
    }
    setServiceLines(mockServiceLines);
    setCurrentStep('review');
  };

  const handleSavePayslip = () => {
    setCurrentStep('finalized');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleEditLine = (lineId: string) => {
    setEditingLine(lineId);
  };

  const handleSaveLine = (
    lineId: string,
    updatedLine: Partial<ServiceLine>
  ) => {
    setServiceLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              ...updatedLine,
              amount:
                (updatedLine.duration || line.duration) *
                (updatedLine.rate || line.rate)
            }
          : line
      )
    );
    setEditingLine(null);
  };

  const handleDeleteLine = (lineId: string) => {
    setServiceLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const userOptions = mockUsers.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`
  }));

  const totalAmount = serviceLines.reduce((sum, line) => sum + line.amount, 0);
  const totalHours = serviceLines.reduce((sum, line) => sum + line.duration, 0);

  const isGenerateEnabled = selectedUserId && selectedDate;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky  ">
        <div className=" ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onClose}
                size="sm"
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <FileText className="h-6 w-6" />
                  {currentStep === 'create' && 'Create Payslip'}
                  {currentStep === 'review' && 'Review Payslip'}
                  {currentStep === 'finalized' && 'Payslip Generated'}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentStep === 'create' &&
                    'Enter staff and date information'}
                  {currentStep === 'review' &&
                    'Review and edit payslip details'}
                  {currentStep === 'finalized' &&
                    'Payslip has been successfully generated'}
                </p>
              </div>
            </div>

            {currentStep === 'review' && (
              <Button
                onClick={handleSavePayslip}
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Payslip
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className=" py-6">
        {currentStep === 'create' && (
          <div className="mx-auto max-w-2xl space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Payslip Information</CardTitle>
                <CardDescription>
                  Select the staff member and date period for the payslip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="staff">Staff Member *</Label>
                  <Select
                    options={userOptions}
                    value={
                      userOptions.find(
                        (option) => option.value === selectedUserId
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setSelectedUserId(selectedOption.value);
                      }
                    }}
                    placeholder="Select Staff Member"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Pay Period *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="date"
                      type="month"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
<div className='flex justify-end'>

                {currentStep === 'create' && (
                  <Button
                  onClick={handleGenerate}
                  disabled={!isGenerateEnabled}
                  className="bg-supperagent text-white hover:bg-supperagent/90 disabled:bg-gray-300"
                  >
                    Generate Payslip
                  </Button>
                )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payslip Summary</span>
                  <Badge className="bg-blue-100 text-blue-800">Review</Badge>
                </CardTitle>
                <CardDescription>
                  {selectedUser?.name} •{' '}
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {serviceLines.length}
                    </div>
                    <div className="text-sm text-blue-800">Services</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {totalHours}h
                    </div>
                    <div className="text-sm text-green-800">Total Hours</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-800">Total Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Lines */}
            <Card>
              <CardHeader>
                <CardTitle>Service</CardTitle>
                <CardDescription>
                  Review and edit individual service entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceLines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2"
                    >
                      {editingLine === line.id ? (
                        <EditLineForm
                          line={line}
                          onSave={(updatedLine) =>
                            handleSaveLine(line.id, updatedLine)
                          }
                          onCancel={() => setEditingLine(null)}
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="grid w-full grid-cols-1 md:grid-cols-4 ">
                            <div>
                              <div className="text-xs text-gray-500">Date</div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(line.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Service
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {line.service}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Duration
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {line.duration}h
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500">
                                Amount
                              </div>
                              <div className="text-sm font-bold text-gray-900">
                                ${line.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditLine(line.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLine(line.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'finalized' && (
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">
                  Payslip Generated Successfully!
                </CardTitle>
                <CardDescription>
                  The payslip for {selectedUser?.name} has been created and
                  saved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Staff</div>
                      <div className="font-medium">{selectedUser?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Period</div>
                      <div className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Hours</div>
                      <div className="font-medium">{totalHours}h</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="font-medium text-green-600">
                        ${totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-gray-600">
                  Redirecting to payslips page...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditLineFormProps {
  line: ServiceLine;
  onSave: (updatedLine: Partial<ServiceLine>) => void;
  onCancel: () => void;
}

const EditLineForm: React.FC<EditLineFormProps> = ({
  line,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    date: line.date,
    service: line.service,
    duration: line.duration,
    rate: line.rate,
    amount:line.amount
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Service</Label>
          <Input
            value={formData.service}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, service: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Duration (hours)</Label>
          <Input
            type="number"
            step="0.5"
            value={formData.duration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration: parseFloat(e.target.value) || 0
              }))
            }
          />
        </div>
        <div>
          <Label>Amount</Label>
          <Input
            type="text"
            step="0.5"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0
              }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-supperagent text-white hover:bg-supperagent/90"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default IndividualInvoiceForm;
