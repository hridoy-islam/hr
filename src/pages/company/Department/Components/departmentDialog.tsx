import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";

export function DepartmentDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [departmentName, setDepartmentName] = useState("");
  
  useEffect(() => {
    setDepartmentName(initialData?.departmentName || "");
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ departmentName});
    onOpenChange(false);
    setDepartmentName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Department Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-supperagent text-white hover:bg-supperagent/90 border-none"
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
