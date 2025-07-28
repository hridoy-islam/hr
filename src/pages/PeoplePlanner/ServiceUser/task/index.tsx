import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import Select from 'react-select';
import { TimePicker24 } from '@/components/shared/TimePicker';

interface Visit {
  id: string;
  startTime: string;
  endTime: string;
  carerName: string;
  amount: string; // Add amount to Visit
}

interface DayConfig {
  visits: Visit[];
  // price: number | null; // Remove price from DayConfig
}

interface GeneratedVisit {
  id: string;
  date: string;
  dayName: string;
  visits: Visit[]; // This now includes amount
  price: number; // This will be the total for the day based on visit amounts
}

const WEEKDAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const CARER_OPTIONS = [
  { value: 'hasan', label: 'Hasan' },
  { value: 'sarah', label: 'Sarah' },
  { value: 'ahmed', label: 'Ahmed' },
  { value: 'fatima', label: 'Fatima' },
  { value: 'omar', label: 'Omar' },
  { value: 'aisha', label: 'Aisha' },
  { value: 'ali', label: 'Ali' },
  { value: 'zara', label: 'Zara' }
];

export default function ServiceUserTask() {
  const [dayConfigs, setDayConfigs] = useState<Record<string, DayConfig>>({
    monday: {
      visits: [
        { id: '1', startTime: '10:00', endTime: '12:00', carerName: 'Hasan', amount: '100' }
      ]
    },
    tuesday: { visits: [] },
    wednesday: { visits: [] },
    thursday: { visits: [] },
    friday: {
      visits: [{ id: '2', startTime: '14:00', endTime: '16:00', carerName: 'Sarah', amount: '100' }]
    },
    saturday: { visits: [] },
    sunday: { visits: [] }
  });

  const [generatedPlan, setGeneratedPlan] = useState<GeneratedVisit[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>(([]));
  const [isEditVisitOpen, setIsEditVisitOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDateRangeOpen, setIsBulkDateRangeOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<{
    dayKey: string;
    visit: Visit | null;
  }>({ dayKey: '', visit: null });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [bulkDateRange, setBulkDateRange] = useState({ from: '', to: '' });
  const [bulkSchedules, setBulkSchedules] = useState<GeneratedVisit[]>([]);
  const [bulkEditData, setBulkEditData] = useState({
    startTime: '',
    endTime: '',
    carerName: '',
    amount: '' // Add amount to bulk edit data
  });

  const addVisit = (dayKey: string) => {
    setEditingVisit({ dayKey, visit: null });
    setIsEditVisitOpen(true);
  };

  const editVisit = (dayKey: string, visit: Visit) => {
    setEditingVisit({ dayKey, visit });
    setIsEditVisitOpen(true);
  };

  const saveVisit = (startTime: string, endTime: string, carerName: string, amount: string) => { // Update signature
    const { dayKey, visit } = editingVisit;
    setDayConfigs((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        visits: visit
          ? prev[dayKey].visits.map((v) =>
              v.id === visit.id ? { ...v, startTime, endTime, carerName, amount } : v // Include amount
            )
          : [
              ...prev[dayKey].visits,
              { id: Date.now().toString(), startTime, endTime, carerName, amount } // Include amount
            ]
      }
    }));
    setIsEditVisitOpen(false);
    setEditingVisit({ dayKey: '', visit: null });
  };

  const deleteVisit = (dayKey: string, visitId: string) => {
    setDayConfigs((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        visits: prev[dayKey].visits.filter((v) => v.id !== visitId)
      }
    }));
  };

  // const updatePrice = (dayKey: string, price: number) => { // Remove price update function
  //   setDayConfigs((prev) => ({
  //     ...prev,
  //     [dayKey]: { ...prev[dayKey], price }
  //   }));
  // };

  const validatePlan = () => {
    const errors: string[] = [];
    // Example validation: Check if any configured day has visits without amounts
    WEEKDAYS.forEach((weekday) => {
      const config = dayConfigs[weekday.key];
      if (config.visits.length > 0) {
        // Check if all visits on this day have an amount
        const hasMissingAmount = config.visits.some(visit => !visit.amount || isNaN(Number(visit.amount)) || Number(visit.amount) <= 0);
        if (hasMissingAmount) {
          errors.push(`Some visits on ${weekday.label} are missing a valid amount.`);
        }
      }
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const openDateRangePicker = () => {
    if (!validatePlan()) return;
    setIsDateRangeOpen(true);
  };

  const generatePlan = () => {
    if (!dateRange.from || !dateRange.to) return;
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const plan: GeneratedVisit[] = [];
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay();
      const weekdayKey = WEEKDAYS[(dayOfWeek + 6) % 7].key; // Adjust for Monday = 0
      const config = dayConfigs[weekdayKey];

      // Only generate if there are visits (no need to check DayConfig price anymore)
      if (config.visits.length > 0) {
        // Calculate total price for the day based on visit amounts
        const totalPrice = config.visits.reduce((sum, visit) => {
          const amount = parseFloat(visit.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        plan.push({
          id: `${date.toISOString().split('T')[0]}-${weekdayKey}`,
          date: date.toLocaleDateString(),
          dayName: WEEKDAYS.find((w) => w.key === weekdayKey)?.label || '',
          visits: config.visits, // This now includes amount
          price: totalPrice // Calculate total price from visit amounts
        });
      }
    }
    setGeneratedPlan(plan);
    setIsDateRangeOpen(false);
  };

  const openBulkEdit = () => {
    if (generatedPlan.length === 0) {
      setValidationErrors(['Please generate a plan first before bulk editing.']);
      return;
    }
    setIsBulkDateRangeOpen(true);
  };

  const loadBulkSchedules = () => {
    if (!bulkDateRange.from || !bulkDateRange.to) return;
    const startDate = new Date(bulkDateRange.from);
    const endDate = new Date(bulkDateRange.to);
    const filteredSchedules = generatedPlan.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= startDate && scheduleDate <= endDate;
    });
    setBulkSchedules(filteredSchedules);
    setIsBulkDateRangeOpen(false);
    setIsBulkEditOpen(true);
  };

  const applyBulkEdit = () => {
    if (!bulkEditData.startTime && !bulkEditData.endTime && !bulkEditData.carerName && !bulkEditData.amount) { // Check amount too
      return;
    }
    const updatedPlan = generatedPlan.map((schedule) => {
      const isInBulkRange = bulkSchedules.some((bulk) => bulk.id === schedule.id);
      if (isInBulkRange) {
        const updatedVisits = schedule.visits.map((visit) => ({
          ...visit,
          startTime: bulkEditData.startTime || visit.startTime,
          endTime: bulkEditData.endTime || visit.endTime,
          carerName: bulkEditData.carerName || visit.carerName,
          amount: bulkEditData.amount || visit.amount // Add amount update
        }));
        // Recalculate the daily total price
        const newTotalPrice = updatedVisits.reduce((sum, visit) => {
          const amount = parseFloat(visit.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        return { ...schedule, visits: updatedVisits, price: newTotalPrice };
      }
      return schedule;
    });
    setGeneratedPlan(updatedPlan);
    setBulkEditData({ startTime: '', endTime: '', carerName: '', amount: '' }); // Reset amount
    setIsBulkEditOpen(false);
    setBulkSchedules([]);
  };

  return (
    <div className="">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Mahi's Visit Schedule</h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={openBulkEdit}
            size="sm"
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            Bulk Edit
          </Button>
          <Button
            onClick={openDateRangePicker}
            size="sm"
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Generate Plan
          </Button>
        </div>
      </div>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 space-y-2">
          {validationErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WEEKDAYS.map((weekday) => {
          const config = dayConfigs[weekday.key];
          return (
            <Card key={weekday.key} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  {weekday.label}
                  {/* {config.visits.length > 0 ? (
                    config.price !== null && config.price > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />${config.price}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        No Price
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      No Visits
                    </Badge>
                  )} */}
                </CardTitle>
                <CardDescription>
                  {config.visits.length} visit
                  {config.visits.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Visits */}
                {config.visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between rounded-lg border border-gray-300 p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{visit.startTime} - {visit.endTime}</p>
                      <p className="text-sm">Carer: {visit.carerName}</p>
                      <p className="text-sm">Amount: ${visit.amount}</p> {/* Display Amount */}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editVisit(weekday.key, visit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVisit(weekday.key, visit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Add Visit Button */}
                <Button
                  variant="default"
                  className="w-full border-none bg-supperagent text-white hover:bg-supperagent/90"
                  onClick={() => addVisit(weekday.key)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Visit
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Generated Plan Summary */}
      {generatedPlan.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Generated Schedule Summary
            </CardTitle>
            <CardDescription>
              {generatedPlan.length} scheduled visits generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div>Total Days: {generatedPlan.length}</div>
              <div>
                Total Cost: $
                {generatedPlan.reduce((sum, item) => sum + item.price, 0)}
              </div>
              <div>
                Date Range: {generatedPlan[0]?.date} - {generatedPlan[generatedPlan.length - 1]?.date}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Date Range Picker Dialog */}
      <Dialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Choose the start and end dates for your visit plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateRangeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={generatePlan}
              disabled={!dateRange.from || !dateRange.to}
            >
              Generate Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Edit Date Range Dialog */}
      <Dialog open={isBulkDateRangeOpen} onOpenChange={setIsBulkDateRangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range for Bulk Edit</DialogTitle>
            <DialogDescription>
              Choose the date range to bulk edit schedules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-from-date">From Date</Label>
              <Input
                id="bulk-from-date"
                type="date"
                value={bulkDateRange.from}
                onChange={(e) =>
                  setBulkDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="bulk-to-date">To Date</Label>
              <Input
                id="bulk-to-date"
                type="date"
                value={bulkDateRange.to}
                onChange={(e) =>
                  setBulkDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDateRangeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={loadBulkSchedules}
              disabled={!bulkDateRange.from || !bulkDateRange.to}
            >
              Load Schedules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Edit Schedules</DialogTitle>
            <DialogDescription>
              Editing {bulkSchedules.length} schedules from {bulkDateRange.from} to {bulkDateRange.to}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Bulk Edit Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Apply Changes to All Selected Schedules</CardTitle>
                <CardDescription>
                  Leave fields empty to keep existing values
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bulk-start-time">Start Time</Label>
                    <Input
                      id="bulk-start-time"
                      type="time"
                      value={bulkEditData.startTime}
                      onChange={(e) =>
                        setBulkEditData((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk-end-time">End Time</Label>
                    <Input
                      id="bulk-end-time"
                      type="time"
                      value={bulkEditData.endTime}
                      onChange={(e) =>
                        setBulkEditData((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Carer</Label>
                    <Select
                      value={
                        CARER_OPTIONS.find(
                          (option) => option.label === bulkEditData.carerName
                        ) || null
                      }
                      onChange={(selected) =>
                        setBulkEditData((prev) => ({ ...prev, carerName: selected?.label || '' }))
                      }
                      options={CARER_OPTIONS}
                      placeholder="Select carer..."
                      isClearable
                    />
                  </div>
                </div>
                <div> {/* Add Amount Input for Bulk Edit */}
                  <Label htmlFor="bulk-amount">Amount ($)</Label>
                  <Input
                    id="bulk-amount"
                    type="number"
                    value={bulkEditData.amount}
                    onChange={(e) =>
                      setBulkEditData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="Enter amount"
                  />
                </div>
              </CardContent>
            </Card>
            {/* Preview of affected schedules */}
            <Card>
              <CardHeader>
                <CardTitle>Schedules to be Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {bulkSchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between border rounded p-3">
                      <div>
                        <div className="font-medium">{schedule.date} - {schedule.dayName}</div>
                        <div className="text-sm text-gray-600">
                          {schedule.visits.map((visit, index) => (
                            <div key={index}>
                              {visit.startTime} - {visit.endTime} ({visit.carerName}) - ${visit.amount}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary">${schedule.price}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={applyBulkEdit}
              disabled={!bulkEditData.startTime && !bulkEditData.endTime && !bulkEditData.carerName && !bulkEditData.amount} // Update disabled condition
            >
              Apply Changes to {bulkSchedules.length} Schedules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Visit Dialog */}
      <Dialog open={isEditVisitOpen} onOpenChange={setIsEditVisitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVisit.visit ? 'Edit Visit' : 'Add New Visit'}
            </DialogTitle>
            <DialogDescription>
              Configure the visit details for{' '}
              {WEEKDAYS.find((w) => w.key === editingVisit.dayKey)?.label}
            </DialogDescription>
          </DialogHeader>
          <VisitForm
            initialVisit={editingVisit.visit}
            onSave={saveVisit}
            onCancel={() => setIsEditVisitOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VisitForm({
  initialVisit,
  onSave,
  onCancel
}: {
  initialVisit: Visit | null;
  onSave: (startTime: string, endTime: string, carerName: string, amount: string) => void; // Update signature
  onCancel: () => void;
}) {
  const [startTime, setStartTime] = useState(initialVisit?.startTime || '10:00');
  const [endTime, setEndTime] = useState(initialVisit?.endTime || '12:00');
  const [selectedCarer, setSelectedCarer] = useState(
    CARER_OPTIONS.find((option) => option.label === initialVisit?.carerName) ||
      null
  );
  const [amount, setAmount] = useState(initialVisit?.amount || ''); // Add amount state

  const handleSave = () => {
    if (startTime && endTime && selectedCarer) {
      // Ensure times are properly formatted as HH:MM
      const formattedStart = formatTimeTo24Hour(startTime);
      const formattedEnd = formatTimeTo24Hour(endTime);
      onSave(formattedStart, formattedEnd, selectedCarer.label, amount); // Pass amount
    }
  };

  // Helper function to ensure time is in HH:MM format
  const formatTimeTo24Hour = (time: string) => {
    if (!time.includes(':')) return '00:00';
    let [hours, minutes] = time.split(':');
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0').substring(0, 2); // Ensure only 2 digits
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TimePicker24
          value={startTime}
          onChange={setStartTime}
          label="Start Time"
        />
        <TimePicker24
          value={endTime}
          onChange={setEndTime}
          label="End Time"
        />
      </div>
      <div>
        <Label>Carer Name</Label>
        <Select
          value={selectedCarer}
          onChange={setSelectedCarer}
          options={CARER_OPTIONS}
          placeholder="Select a carer..."
          className="mt-1"
        />
      </div>
      <div> {/* Add Amount Input */}
        <Label htmlFor="visit-amount">Amount ($)</Label>
        <Input
          id="visit-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!startTime || !endTime || !selectedCarer}
          className="bg-supperagent text-white hover:bg-supperagent/90"
        >
          {initialVisit ? 'Update Visit' : 'Add Visit'}
        </Button>
      </DialogFooter>
    </div>
  );
}
