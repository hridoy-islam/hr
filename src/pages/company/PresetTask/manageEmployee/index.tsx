import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Info,
  Loader2,
  Search,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useNavigate, useParams } from 'react-router-dom';

interface Employee {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function ManageEmployee() {
  const { id: companyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [existingAccessId, setExistingAccessId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return;
      try {
        const response = await axiosInstance.get(`/users`, {
          params: { role: 'employee', company: companyId, limit: 'all' }
        });
        setEmployees(response.data?.data?.result || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    const fetchExistingAccess = async () => {
      if (!companyId) return;
      try {
        const response = await axiosInstance.get(
          `/manage-employee/company/${companyId}`
        );
        const access = response.data?.data;
        if (access) {
          setExistingAccessId(access._id);
          setSelectedIds(
            (access.employees || []).map((e: any) =>
              typeof e === 'object' && e?._id ? e._id : e
            )
          );
        }
      } catch (error) {
        console.error('Error fetching daily work flow access:', error);
      }
    };

    Promise.all([fetchEmployees(), fetchExistingAccess()]).finally(() => {
      setInitialLoading(false);
    });
  }, [companyId]);

  const saveAccess = async (employeeIds: string[], isAdding: boolean) => {
    if (!companyId) return;
    setIsSaving(true);
    try {
      let response;
      if (existingAccessId) {
        response = await axiosInstance.patch(
          `/manage-employee/${existingAccessId}`,
          { employees: employeeIds }
        );
      } else {
        response = await axiosInstance.post(`/manage-employee`, {
          companyId,
          employees: employeeIds,
          isActive: true
        });
      }

      if (!existingAccessId && response.data.data?._id) {
        setExistingAccessId(response.data.data._id);
      }

      toast({
        title: isAdding
          ? 'Employee access granted successfully.'
          : 'Employee access revoked successfully.',
      });
    } catch (error: any) {
      toast({
        title:
          error.response?.data?.message ||
          'Failed to save daily work flow access.',
          variant:"destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (empId: string) => {
    const isAdding = !selectedIds.includes(empId);
    const next = isAdding
      ? [...selectedIds, empId]
      : selectedIds.filter((selected) => selected !== empId);

    setSelectedIds(next);
    saveAccess(next, isAdding);
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName ?? ''} ${emp.lastName ?? ''} ${emp.email ?? ''}`
      .trim()
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <UserCog className="h-6 w-6" />
            Manage Employee
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name or Email"
              className="h-8 min-w-[250px]"
            />
            <Button
              size="sm"
              className="min-w-[100px]"
              onClick={() => setSearchTerm(searchTerm)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        <Button size="sm" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Check employees to allow them to see the Daily Work Flow. Unchecked
          employees will not have access.
        </span>
        {isSaving && (
          <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin" />
        )}
      </div>

      {/* Employee List */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          {initialLoading ? (
            <div className="flex justify-center py-10">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex justify-center py-10 text-gray-500">
              No employees found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <label
                  key={emp._id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedIds.includes(emp._id)}
                    onCheckedChange={() => handleToggle(emp._id)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {`${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() ||
                        'Unnamed Employee'}
                    </span>
                    {emp.email && (
                      <span className="text-xs text-gray-500">
                        {emp.email}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}