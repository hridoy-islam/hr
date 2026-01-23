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
import { Textarea } from "@/components/ui/textarea";

export function BranchDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [branchName, setBranchName] = useState("");
  
  useEffect(() => {
    setBranchName(initialData?.branchName || "");
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ branchName });
    onOpenChange(false);
    setBranchName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Company Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="branchName">
              Branch Name <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="branchName"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. London HQ, Manchester Office"
              required
              className="h-[20vh]"
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
              className="bg-theme text-white hover:bg-theme/90 border-none"
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}