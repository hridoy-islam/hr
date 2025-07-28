import React from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { CustomDatePicker } from '@/components/shared/CustomDatePicker';
import { MoveLeft } from 'lucide-react';
// Mock data for dropdowns
const users = [
  { value: 'user1', label: 'User 1' },
  { value: 'user2', label: 'User 2' }
];

const statuses = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' }
];

const results = [
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'N/A', label: 'Not Applicable' }
];

// Form values type
type FormValues = {
  task: string;
  deadlineDate: Date;
  instructions: string;
  user: { value: string; label: string };
  status: { value: string; label: string };
  result: { value: string; label: string };
  notes: string;
  completedDate: Date;
};

// Mock default values
const defaultValues: FormValues = {
  task: 'Quarterly Financial Review',
  deadlineDate: new Date('2023-08-09'),
  instructions:
    'Review all Q2 financial statements and prepare summary report for board meeting',
  user: users[0],
  status: statuses[0],
  result: results[0],
  notes: 'Need to verify numbers from marketing department before finalizing',
  completedDate: new Date('2023-11-30')
};

export default function ViewTaskPage() {
  const form = useForm<FormValues>({
    defaultValues
  });

  return (
    <div className="">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Task Details
            </CardTitle>
            <div className="space-x-2">
              <Button
                variant="outline"
                className="border-none text-white hover:bg-supperagent/90 bg-supperagent"
              >
                <MoveLeft/>
                Back 
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Task */}
              <FormField
                name="task"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Task
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className={cn(
                          'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
                          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* User */}
              <FormField
                name="user"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Assigned To
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        options={users}
                        onChange={field.onChange}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.375rem',
                            minHeight: '40px',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#cbd5e1'
                            },
                            
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: '#334155'
                          })
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Status
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        options={statuses}
                        onChange={field.onChange}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.375rem',
                            minHeight: '40px',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#cbd5e1'
                            },
                            
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: '#334155'
                          })
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Deadline Date */}
              <FormField
                name="deadlineDate"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Deadline Date
                    </FormLabel>
                    <FormControl>
                      <div className="w-full">
                        <CustomDatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          futureDate={true}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Completed Date */}
              <FormField
                name="completedDate"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Completed Date
                    </FormLabel>
                    <FormControl>
                      <div className=" w-full">
                        <CustomDatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          futureDate={true}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Result */}
              <FormField
                name="result"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Result
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        options={results}
                        onChange={field.onChange}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.375rem',
                            minHeight: '40px',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#cbd5e1'
                            },
                            
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: '#334155'
                          })
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Instructions */}
              <FormField
                name="instructions"
                render={({ field }) => (
                  <FormItem className="space-y-1 md:col-span-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Instructions
                    </FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={4}
                        className={cn(
                          'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
                          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-1 md:col-span-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={4}
                        className={cn(
                          'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
                          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3  pt-6">
              <Button
                variant="outline"
                className="border-gray-300 text-white hover:bg-black/90"
              >
                Cancel
              </Button>
              <Button className="bg-supperagent text-white hover:bg-supperagent/90">
                Save Changes
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
