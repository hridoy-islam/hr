import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Eye, Plus, Search } from 'lucide-react';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

// Mock Data
const mockFundUsers = [
  {
    _id: '1',
    title: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Healthcare Funding Ltd',
    funderType: 'NHS',
    status: 'active',
    phone: '555-1234',
    email: 'john@nhs.org'
  },
  {
    _id: '2',
    title: 'Ms.',
    firstName: 'Jane',
    lastName: 'Smith',
    organization: 'Charity Care Fund',
    funderType: 'Charity',
    status: 'inactive',
    phone: '555-5678',
    email: 'jane@charity.org'
  },
  {
    _id: '3',
    title: 'Dr.',
    firstName: 'Robert',
    lastName: 'Brown',
    organization: 'Private Health Group',
    funderType: 'Private',
    status: 'active',
    phone: '555-9012',
    email: 'robert@privatehealth.com'
  }
];

// React Select options
const funderTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'NHS', label: 'NHS' },
  { value: 'Charity', label: 'Charity' },
  { value: 'Private', label: 'Private' }
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export default function ServiceUserFunder() {
  const [fundUsers, setFundUsers] = useState(mockFundUsers);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const navigate = useNavigate();

  // Handle status toggle
  const handleStatusChange = (id: string, checked: boolean) => {
    setFundUsers((prev) =>
      prev.map((user) =>
        user._id === id
          ? { ...user, status: checked ? 'active' : 'inactive' }
          : user
      )
    );
  };

  // Handle view action
  const handleView = (id: string) => {
    navigate(`/admin/people-planner/service-funder/${id}`);
  };

  // Filtering logic
  const filteredFundUsers = useMemo(() => {
    return fundUsers.filter((user) => {
      const fullName = [user.title, user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const search = searchTerm.toLowerCase();

      if (
        search &&
        !fullName.includes(search) &&
        !user.organization.toLowerCase().includes(search) &&
        !user.phone.includes(search) &&
        !user.email.toLowerCase().includes(search)
      ) {
        return false;
      }

      return true;
    });
  }, [fundUsers, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFundUsers.length / entriesPerPage);
  const paginatedFundUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredFundUsers.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredFundUsers, currentPage, entriesPerPage]);

  // Reset currentPage if filtered list shrinks below current page
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6 rounded-md bg-white p-6 shadow-md">
      <div className="flex flex-row  justify-between">

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Mr. John Doe Funders</h1>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              className="min-w-[300px] rounded border px-3 py-1"
              placeholder="Search by Name, Org, Email or Phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button className="bg-supperagent text-white hover:bg-supperagent/90">
              <Search className="mr-1 h-4 w-4" /> Search
            </Button>
          </div>
        </div>
          <Button className="flex gap-2 bg-supperagent text-white hover:bg-supperagent/90">
            <Plus className="h-4 w-4 " /> Add Funder
          </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedFundUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center text-gray-500">
                No matching funders found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedFundUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {[user.title, user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(' ')}
                </TableCell>
                <TableCell>{user.organization}</TableCell>
                <TableCell>{user.funderType}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.status === 'active'}
                    onCheckedChange={(checked) =>
                      handleStatusChange(user._id, checked)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(user._id)}
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <DynamicPagination
        pageSize={entriesPerPage}
        setPageSize={setEntriesPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
