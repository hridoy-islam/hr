import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import axiosInstance from '@/lib/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TrainingTab = ({ formData, onUpdate, isFieldSaving }) => {
  const [trainings, setTrainings] = useState([]);
  const [localTrainings, setLocalTrainings] = useState<
    Array<{
      _id?: string;
      trainingId: string;
      startDate?: string;
      endDate?: string;
      status: 'pending' | 'completed';
      dirty?: boolean;
    }>
  >([]);

  // Fetch trainings
  const fetchData = async () => {
    try {
      const res = await axiosInstance('/hr/training');
      setTrainings(res.data.data.result);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map backend data
  useEffect(() => {
    if (formData.training && Array.isArray(formData.training)) {
      const mapped = formData.training.map((t) => ({
        _id: t._id,
        trainingId: t.trainingId?._id || t.trainingId,
        startDate: t.startDate ? moment(t.startDate).format('DD-MM-YYYY') : '',
        endDate: t.endDate ? moment(t.endDate).format('DD-MM-YYYY') : '',
        status: t.status || 'pending',
        dirty: false
      }));
      setLocalTrainings(mapped);
    }
  }, [formData.training]);

  const trainingOptions = trainings.map((dep) => ({
    value: dep._id,
    label: dep.name
  }));

  const getValidityDays = (trainingId: string) => {
    const training = trainings.find((t) => t._id === trainingId);
    return training?.validityDays || 0;
  };

  const handleAddTraining = () => {
    setLocalTrainings((prev) => [
      ...prev,
      {
        trainingId: '',
        startDate: '',
        endDate: '',
        status: 'pending',
        dirty: true
      }
    ]);
  };

  const handleRemoveTraining = (index: number) => {
    const updated = localTrainings.filter((_, i) => i !== index);
    setLocalTrainings(updated);
    onUpdate('training', updated);
  };

  const handleDetailChange = (
    index: number,
    field: 'trainingId' | 'startDate' | 'endDate' | 'status',
    value: string
  ) => {
    const updated = [...localTrainings];
    updated[index][field] = value;

    // Recalculate endDate if needed
    if (
      (field === 'startDate' || field === 'trainingId') &&
      updated[index].startDate &&
      updated[index].trainingId
    ) {
      const validityDays = getValidityDays(updated[index].trainingId);
      updated[index].endDate = moment(updated[index].startDate, 'DD-MM-YYYY')
        .add(validityDays, 'days')
        .format('DD-MM-YYYY');
    }

    updated[index].dirty = true;
    setLocalTrainings(updated);
  };

  const getAvailableTrainings = (currentIdx: number) => {
    const used = localTrainings
      .filter((_, i) => i !== currentIdx)
      .map((t) => t.trainingId);
    return trainingOptions.filter((opt) => !used.includes(opt.value));
  };

  const handleSaveRow = (index: number) => {
    onUpdate('training', localTrainings);
    const updated = [...localTrainings];
    updated[index].dirty = false;
    setLocalTrainings(updated);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1">
          {/* Add Training Button */}
          <div className="flex justify-end pb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTraining}
              disabled={isFieldSaving['training']}
            >
              + Add Training
            </Button>
          </div>

          {/* Dynamic Training Entries */}
          {localTrainings.length > 0 ? (
            <div className="col-span-full space-y-2">
              {localTrainings.map((training, index) => {
                const selectedTraining = trainings.find(
                  (t) => t._id === training.trainingId
                );
                const validityDays = selectedTraining?.validityDays;

                return (
                  <div
                    key={index}
                    className="space-y-1 rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                      {/* Training Selection */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Training
                        </label>
                        <select
                          value={training.trainingId}
                          onChange={(e) =>
                            handleDetailChange(
                              index,
                              'trainingId',
                              e.target.value
                            )
                          }
                          className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Choose Training</option>
                          {getAvailableTrainings(index).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {validityDays !== undefined && training.trainingId && (
                          <p className="mt-1 text-xs text-gray-500">
                            Valid for {validityDays} days
                          </p>
                        )}
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Training Date
                        </label>
                        <DatePicker
                          selected={
                            training.startDate
                              ? moment(
                                  training.startDate,
                                  'DD-MM-YYYY'
                                ).toDate()
                              : null
                          }
                          onChange={(date) => {
                            const formatted = date
                              ? moment(date).format('DD-MM-YYYY')
                              : '';
                            handleDetailChange(index, 'startDate', formatted);
                          }}
                          dateFormat="dd-MM-yyyy"
                          className="w-full rounded border border-gray-300 p-2 text-sm"
                          placeholderText="DD-MM-YYYY"
                          wrapperClassName="w-full"
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Validity Date
                        </label>
                        <DatePicker
                          selected={
                            training.endDate
                              ? moment(training.endDate, 'DD-MM-YYYY').toDate()
                              : null
                          }
                          dateFormat="dd-MM-yyyy"
                          className="w-full cursor-not-allowed rounded border border-gray-300 bg-gray-50 p-2 text-sm text-gray-700"
                          placeholderText="DD-MM-YYYY"
                          readOnly
                          wrapperClassName="w-full"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Status
                        </label>
                        <select
                          value={training.status}
                          onChange={(e) =>
                            handleDetailChange(
                              index,
                              'status',
                              e.target.value as any
                            )
                          }
                          className="w-full rounded border border-gray-300 p-2 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* Remove */}
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Button
                          type="button"
                          variant="default"
                          className="w-full text-xs text-red-500"
                          onClick={() => handleRemoveTraining(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {training.dirty && (
                      <div className="flex w-full justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveRow(index)}
                          disabled={isFieldSaving['training']}
                          className="w-[150px] bg-supperagent text-white hover:bg-supperagent/90"
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="col-span-full text-sm italic text-gray-500">
              No trainings assigned yet. Click "Add Training" to begin.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingTab;
