import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import axiosInstance from '@/lib/axios';

const TrainingTab = ({ formData, onUpdate, isFieldSaving }) => {
  const [trainings, setTrainings] = useState([]);
  const [localTrainings, setLocalTrainings] = useState<Array<{
    _id?: string; // optional: if editing existing
    trainingId: string;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'completed';
  }>>([]);

  // Fetch available trainings
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

  // Map backend data to local state on load
  useEffect(() => {
    if (formData.training && Array.isArray(formData.training)) {
      const mapped = formData.training.map(t => ({
        _id: t._id, // preserve ID if exists (for updates)
        trainingId: t.trainingId?._id || t.trainingId,
        startDate: t.startDate ? moment(t.startDate).format('YYYY-MM-DD') : '',
        endDate: t.endDate ? moment(t.endDate).format('YYYY-MM-DD') : '',
        status: t.status || 'pending'
      }));
      setLocalTrainings(mapped);
    }
  }, [formData.training]);

  const trainingOptions = trainings.map(dep => ({
    value: dep._id,
    label: dep.name
  }));

  // Add a new empty training entry
  const handleAddTraining = () => {
    setLocalTrainings(prev => [
      ...prev,
      {
        trainingId: '', // user will select
        startDate: '',
        endDate: '',
        status: 'pending'
      }
    ]);
  };

  // Remove a training by index or by ID
  const handleRemoveTraining = (index: number) => {
    const updated = localTrainings.filter((_, i) => i !== index);
    setLocalTrainings(updated);
    onUpdate('training', updated);
  };

  // Handle changes in any field
  const handleDetailChange = (
    index: number,
    field: 'trainingId' | 'startDate' | 'endDate' | 'status',
    value: string
  ) => {
    const updated = localTrainings.map((t, i) =>
      i === index
        ? { ...t, [field]: value }
        : t
    );
    setLocalTrainings(updated);
    onUpdate('training', updated);
  };

  // Prevent selecting same training twice
  const getAvailableTrainings = (currentIdx: number) => {
    const used = localTrainings
      .filter((_, index) => index !== currentIdx)
      .map(t => t.trainingId);

    return trainingOptions.filter(opt => !used.includes(opt.value));
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 ">

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
              {/* <h4 className="text-sm font-semibold text-gray-700">Assigned Trainings</h4> */}

              {localTrainings.map((training, index) => {
                const selectedTraining = trainings.find(t => t._id === training.trainingId);
                const displayName = selectedTraining ? selectedTraining.name : 'Select a training';

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-300 p-3 bg-white shadow-sm space-y-1"
                  >
                    

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 ">

                      {/* Training Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Training
                        </label>
                        <select
                          value={training.trainingId}
                          onChange={e =>
                            handleDetailChange(index, 'trainingId', e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Choose Training</option>
                          {getAvailableTrainings(index).map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={training.startDate}
                          onChange={e =>
                            handleDetailChange(index, 'startDate', e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={training.endDate}
                          onChange={e =>
                            handleDetailChange(index, 'endDate', e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Status
                        </label>
                        <select
                          value={training.status}
                          onChange={e =>
                            handleDetailChange(index, 'status', e.target.value as any)
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="col-span-full text-sm text-gray-500 italic">
              No trainings assigned yet. Click "Add Training" to begin.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingTab;