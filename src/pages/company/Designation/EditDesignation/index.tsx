import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import ErrorMessage from "@/components/shared/error-message";
import axiosInstance from "@/lib/axios";
import { MoveLeft } from "lucide-react";
import { BlinkingDots } from "@/components/shared/blinking-dots";

type Inputs = {
  title: string;
  description: string;
};

export default function EditDesignation() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Inputs>();

  const [loading, setLoading] = useState<boolean>(true);
  const { did: designationId } = useParams();
  const navigate = useNavigate();

  // Fetch existing designation data
  useEffect(() => {
    const fetchDesignation = async () => {
      try {
        const res = await axiosInstance.get(`/hr/designation/${designationId}`);
        const { title, description } = res.data.data;

        setValue("title", title);
        setValue("description", description);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch designation data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (designationId) fetchDesignation();
  }, [designationId, setValue]);

  // Form submission handler
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
      };

      // Send updated data to server
      await axiosInstance.patch(`/hr/designation/${designationId}`, payload);

      toast({
        title: "Success!",
        description: "Designation updated successfully.",
      });

      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update designation.",
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <p className="mt-10 text-center">
        <BlinkingDots />
      </p>
    );

  return (
    <div className="mx-auto">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex w-full items-center justify-between">
          <h1 className="mb-6 text-3xl font-bold text-gray-800">
            Edit Designation
          </h1>
          <Button
            className="bg-theme text-white hover:bg-theme/90"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Designation Title</Label>
              <Input
                id="title"
                placeholder="Enter designation title..."
                {...register("title", { required: "Title is required" })}
              />
              <ErrorMessage message={errors.title?.message?.toString()} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter designation description..."
                {...register("description", {
                  required: "Description is required",
                })}
              />
              <ErrorMessage message={errors.description?.message?.toString()} />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              className="rounded-md bg-theme px-6 py-2 font-semibold text-white transition-colors hover:bg-theme/90"
            >
              Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}