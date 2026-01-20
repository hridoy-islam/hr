import ErrorMessage from '@/components/shared/error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { employmentTypes } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type Inputs = {
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryRange: {
    min?: number;
    max?: number;
    negotiable?: boolean;
  };
  skillsRequired: string;
  applicationDeadline: Date;
  postedBy: string;
  status: string;
};

export default function EditVacancy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editVacancy, setEditVacancy] = useState<Inputs | null>(null);
  const { user } = useSelector((state: any) => state.auth);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<Inputs>();

  // Fetch vacancy data
  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const response = await axiosInstance.get(`/hr/vacancy/${id}`);
        const data = response.data.data;

        setEditVacancy(data);

        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined) {
            if (key === 'applicationDeadline') {
              setValue(key, moment(data[key]).toDate()); // Modified to set Date object for DatePicker
            } else {
              setValue(key as keyof Inputs, data[key]);
            }
          }
        });

        if (data.salaryRange) {
          setValue('salaryRange.negotiable', data.salaryRange.negotiable);
          setValue('salaryRange.min', data.salaryRange.min);
          setValue('salaryRange.max', data.salaryRange.max);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error?.response?.data.message ||'Failed to load vacancy.',
          variant: 'destructive'
        });
      }
    };

    fetchVacancy();
  }, [id, setValue]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    data.postedBy = user._id;
    try {
      const response = await axiosInstance.patch(`/hr/vacancy/${id}`, data);
      if (response) {
        toast({
          title: 'Success!',
          description: 'Vacancy updated successfully.'
        });
        navigate(-1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.response?.data.message || 'Failed to update vacancy.',
        variant: 'destructive'
      });
    }
  };

  const rawNegotiable = watch('salaryRange.negotiable');
  // Handle both boolean and string "true"/"false" cases if API returns mixed types
  const negotiable = rawNegotiable === true || rawNegotiable === 'true'; 

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mx-auto">

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Edit Vacancy</h1>
        <Button
          onClick={handleBack}
          className="bg-theme text-white hover:bg-theme/90"
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Grid Fields */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Title */}
            <div>
              <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="Enter job title..."
                defaultValue={editVacancy?.title}
                {...register('title', { required: 'Title is required' })}
                className="mt-1"
              />
              <ErrorMessage message={errors.title?.message?.toString()} />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Input
                id="location"
                placeholder="Enter job location..."
                defaultValue={editVacancy?.location}
                {...register('location', { required: 'Location is required' })}
                className="mt-1"
              />
              <ErrorMessage message={errors.location?.message?.toString()} />
            </div>

            {/* Employment Type */}
            <div>
              <Label htmlFor="employmentType">Employment Type <span className="text-red-500">*</span></Label>
              <Controller
                name="employmentType"
                control={control}
                rules={{ required: 'Employment Type is required' }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || editVacancy?.employmentType}
                  >
                    <SelectTrigger id="employmentType" className="mt-1">
                      <SelectValue placeholder="Select Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ErrorMessage
                message={errors.employmentType?.message?.toString()}
              />
            </div>

            {/* Skills Required */}
            <div>
              <Label htmlFor="skillsRequired">Skills Required <span className="text-red-500">*</span></Label>
              <Input
                id="skillsRequired"
                placeholder="Enter required skills..."
                defaultValue={editVacancy?.skillsRequired}
                {...register('skillsRequired', {
                  required: 'Skills are required'
                })}
                className="mt-1"
              />
              <ErrorMessage
                message={errors.skillsRequired?.message?.toString()}
              />
            </div>

            {/* Application Deadline */}
            <div>
              <Label htmlFor="applicationDeadline">Application Deadline <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="applicationDeadline"
                rules={{ required: 'Application deadline is required' }}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date: Date) => field.onChange(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select application deadline"
                    wrapperClassName='w-full'
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    isClearable
                  />
                )}
              />
              <ErrorMessage
                message={errors.applicationDeadline?.message?.toString()}
              />
            </div>

            {/* Salary Negotiable */}
            <div>
              <Label>Is the salary negotiable? <span className="text-red-500">*</span></Label>
              <Controller
                name="salaryRange.negotiable"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value !== undefined ? String(field.value) : undefined}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Conditional Min/Max Salary */}
            {!negotiable && (
              <>
                <div>
                  <Label>Min Salary <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Min Salary..."
                    defaultValue={editVacancy?.salaryRange?.min}
                    {...register('salaryRange.min', {
                      valueAsNumber: true,
                      required: 'Minimum salary is required'
                    })}
                    className="mt-1"
                  />
                  {errors.salaryRange?.min && (
                    <p className="text-sm text-red-500">
                      {errors.salaryRange.min.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Max Salary <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Max Salary..."
                    defaultValue={editVacancy?.salaryRange?.max}
                    {...register('salaryRange.max', {
                      valueAsNumber: true,
                      required: 'Maximum salary is required'
                    })}
                    className="mt-1"
                  />
                  {errors.salaryRange?.max && (
                    <p className="text-sm text-red-500">
                      {errors.salaryRange.max.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Description full width */}
          <div className="col-span-full pb-8">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="mt-1 h-[300px] bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.description?.message?.toString()} />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              className="rounded-md bg-theme px-6 py-2 font-semibold text-white transition-colors hover:bg-theme/90"
            >
              Update Vacancy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}