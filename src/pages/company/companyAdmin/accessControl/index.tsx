import { useEffect, useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import axiosInstance from "@/lib/axios";
import { ArrowLeft } from "lucide-react";
import { BlinkingDots } from "@/components/shared/blinking-dots";

// Defined the modules based on the JSON structure
const MODULES = [
  "rota",
  "vacancy",
  "employee",
  "leave",
  "serviceUser",
  "notice",
  "payroll",
  "attendance",
  "setting",
] as const;

type ModuleType = typeof MODULES[number];

// Flat form state: e.g., { rota: true, vacancy: false }
type Inputs = Record<ModuleType, boolean>;

export default function UserAccessControl() {
  const { caid } = useParams();
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const { handleSubmit, control, reset } = useForm<Inputs>({
    defaultValues: MODULES.reduce((acc, module) => {
      acc[module] = false;
      return acc;
    }, {} as Inputs),
  });

  // Fetch Existing Access Control Data
  useEffect(() => {
    const fetchUserAccess = async () => {
      try {
        const res = await axiosInstance.get(`/users/${caid}`);
        
        // Handle cases where the object might be nested inside a result array or passed directly in data
        const userData = res.data.data?.result ? res.data.data.result[0] : res.data.data;

        setUserName(userData?.name || "User");

        const companyAccess = userData?.companyAccess || {};

        // Flatten nested { access: boolean } to map to our form values
        const formValues = MODULES.reduce((acc, module) => {
          acc[module] = !!companyAccess[module]?.access;
          return acc;
        }, {} as Inputs);

        reset(formValues);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user access data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (caid) fetchUserAccess();
  }, [caid, reset]);

  // Handle Form Submission
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      // Transform the flat boolean form data back to the expected API schema -> module: { access: boolean }
      const companyAccessPayload = MODULES.reduce((acc, module) => {
        acc[module] = { access: data[module] };
        return acc;
      }, {} as Record<string, { access: boolean }>);

      await axiosInstance.patch(`/users/${caid}`, {
        companyAccess: companyAccessPayload,
      });

      toast({
        title: "Success",
        description: "Access control updated successfully.",
      });

      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access control.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <BlinkingDots />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full  ">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between  pb-4">
          <h1 className="text-2xl font-bold capitalize text-gray-800">
            {userName}'s Access Control
          </h1>
          <Button
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        {/* Checkbox Grid Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MODULES.map((module) => (
              <div 
                key={module} 
                className="flex items-center space-x-4 rounded-md border border-gray-300 p-4 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Controller
                  name={module}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id={`checkbox-${module}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-5 w-5 rounded-sm border-gray-300 data-[state=checked]:bg-theme"
                    />
                  )}
                />
                <Label
                  htmlFor={`checkbox-${module}`}
                  className="cursor-pointer text-lg font-medium capitalize text-gray-700"
                >
                  {module.replace(/([A-Z])/g, " $1").trim()} {/* Converts "serviceUser" to "service User" */}
                </Label>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="mt-10 flex justify-end">
            <Button
              type="submit"
              className="bg-theme px-8 py-2 font-semibold text-white transition-colors hover:bg-theme/90"
            >
              Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}