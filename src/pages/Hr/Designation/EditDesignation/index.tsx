"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import ErrorMessage from "@/components/shared/error-message";
import axiosInstance from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoveLeft } from "lucide-react";
import { BlinkingDots } from "@/components/shared/blinking-dots";

type Inputs = {
  title: string;
  description: string;
  permissions: Record<
    string,
    {
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }
  >;
};

export default function EditDesignation() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Inputs>();

  const [loading, setLoading] = useState<boolean>(true);
  const { id: designationId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);

  // List of modules for permissions
  const modules = [
    "noticeBoard",
    "leaveManagement",
    "vacancy",
    "myStuff",
    "employee",
    "attendance",
    "payroll",
    "recruitment",
    "settings",
  ];

  // Fetch existing designation data
  useEffect(() => {
    const fetchDesignation = async () => {
      try {
        const res = await axiosInstance.get(`/hr/designation/${designationId}`);
        const { title, description, permissions } = res.data.data;

        setValue("title", title);
        setValue("description", description);

        // Normalize permissions ensuring all modules are present
        const normalizedPermissions = modules.reduce(
          (acc, module) => {
            acc[module] = {
              canView: !!permissions?.[module]?.canView,
              canCreate: !!permissions?.[module]?.canCreate,
              canEdit: !!permissions?.[module]?.canEdit,
              canDelete: !!permissions?.[module]?.canDelete,
            };
            return acc;
          },
          {} as Record<
            string,
            {
              canView: boolean;
              canCreate: boolean;
              canEdit: boolean;
              canDelete: boolean;
            }
          >
        );

        setValue("permissions", normalizedPermissions);
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
  }, [designationId, setValue, modules]);

  // Form submission handler
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      // Transform permissions into a proper nested object per module
      const permissionsPayload = modules.reduce((acc, module) => {
        const modulePermissions = data.permissions?.[module] || {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        };
        
        acc[module] = {
          canView: Boolean(modulePermissions.canView),
          canCreate: Boolean(modulePermissions.canCreate),
          canEdit: Boolean(modulePermissions.canEdit),
          canDelete: Boolean(modulePermissions.canDelete),
        };
        return acc;
      }, {} as Record<string, {
        canView: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
      }>);
  
      const payload = {
        title: data.title,
        description: data.description,
        permissions: permissionsPayload
      };
  
      // Send updated data to server
      await axiosInstance.patch(`/hr/designation/${designationId}`, payload);
  
      toast({
        title: "Success!",
        description: "Designation updated successfully.",
      });
  
      navigate("/admin/hr/designation");
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
      <div className="flex w-full items-center justify-between">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">Edit Designation</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          onClick={() => navigate(-1)}
        >
          <MoveLeft /> Back
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
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

          {/* Permissions Section */}
          <div className="w-full rounded-md border border-gray-200 shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-supperagent text-white">
                  <TableHead className="text-left text-sm font-bold px-6 py-3">
                    Module
                  </TableHead>
                  <TableHead className="text-center text-sm font-bold px-6 py-3">
                    Can View
                  </TableHead>
                  <TableHead className="text-center text-sm font-bold px-6 py-3">
                    Can Create
                  </TableHead>
                  <TableHead className="text-center text-sm font-bold px-6 py-3">
                    Can Edit
                  </TableHead>
                  <TableHead className="text-center text-sm font-bold px-6 py-3">
                    Can Delete
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module}>
                    <TableCell className="px-6 py-4 text-sm text-gray-800 font-semibold capitalize">
                      {module.replace(/([A-Z])/g, " $1").trim()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        {...register(`permissions.${module}.canView`)}
                        className="accent-supperagent"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        {...register(`permissions.${module}.canCreate`)}
                        className="accent-supperagent"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        {...register(`permissions.${module}.canEdit`)}
                        className="accent-supperagent"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        {...register(`permissions.${module}.canDelete`)}
                        className="accent-supperagent"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              className="rounded-md bg-supperagent px-6 py-2 font-semibold text-white transition-colors hover:bg-supperagent/90"
            >
              Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}