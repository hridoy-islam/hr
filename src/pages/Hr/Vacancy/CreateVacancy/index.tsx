import ErrorMessage from '@/components/shared/error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MoveLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

export default function CreateVacancy() {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Inputs>();
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    data.postedBy = user._id;
    data.status = 'active';
    try {
      const response = await axiosInstance.post(`/hr/vacancy`, data);
      if (response) {
        toast({
          title: 'Success!',
          description: 'Vacancy created successfully.'
        });
        navigate(`/admin/hr/vacancy`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create vacancy.',
        variant: 'destructive'
      });
    }
  };

  const rawNegotiable = watch('salaryRange.negotiable');
  const negotiable = rawNegotiable === true;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Add New Vacancy</h1>
        <Button
          onClick={handleBack}
          className="bg-supperagent text-white hover:bg-supperagent/90"
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Title */}
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Enter job title..."
                {...register('title', { required: 'Title is required' })}
                className="mt-1"
              />
              <ErrorMessage message={errors.title?.message?.toString()} />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter job location..."
                {...register('location', { required: 'Location is required' })}
                className="mt-1"
              />
              <ErrorMessage message={errors.location?.message?.toString()} />
            </div>

            {/* Employment Type */}
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Controller
                name="employmentType"
                control={control}
                rules={{ required: 'Employment Type is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Label htmlFor="skillsRequired">Skills Required</Label>
              <Input
                id="skillsRequired"
                placeholder="Enter required skills..."
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
              <Label htmlFor="applicationDeadline">Application Deadline</Label>
              <Input
                type="date"
                id="applicationDeadline"
                {...register('applicationDeadline', {
                  required: 'Application deadline is required'
                })}
                className="mt-1"
              />
              <ErrorMessage
                message={errors.applicationDeadline?.message?.toString()}
              />
            </div>

            {/* Salary Negotiable */}
            <div>
              <Label>Is the salary negotiable?</Label>
              <Controller
                name="salaryRange.negotiable"
                control={control}
                rules={{
                  validate: (value) =>
                    value === true ||
                    value === false ||
                    'Please select an option'
                }}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value?.toString() ?? ''}
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
              {errors.salaryRange?.negotiable && (
                <p className="text-sm text-red-500">
                  {errors.salaryRange.negotiable.message}
                </p>
              )}
            </div>

            {/* Conditional Min & Max Salary */}
            {negotiable === false && (
              <>
                <div>
                  <Label>Min Salary</Label>
                  <Input
                    type="number"
                    placeholder="Min Salary..."
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
                  <Label>Max Salary</Label>
                  <Input
                    type="number"
                    placeholder="Max Salary..."
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
          <div className="col-span-full">
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  className="mt-1 h-[300px] bg-white"
                />
              )}
            />
            <ErrorMessage message={errors.description?.message?.toString()} />
          </div>

          {/* Submit */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              className="rounded-md bg-supperagent px-6 py-2 font-semibold text-white transition-colors hover:bg-supperagent/90"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
