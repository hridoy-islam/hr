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
  TableRow,
} from '@/components/ui/table';
import { Eye, Search } from 'lucide-react';
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
    email: 'john@nhs.org',
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
    email: 'jane@charity.org',
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
    email: 'robert@privatehealth.com',
  },
];

// React Select options
const funderTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'NHS', label: 'NHS' },
  { value: 'Charity', label: 'Charity' },
  { value: 'Private', label: 'Private' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function ServiceFunderList() {
  const [fundUsers, setFundUsers] = useState(mockFundUsers);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(funderTypeOptions[0]);
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const navigate = useNavigate();

  // Handle status toggle
  const handleStatusChange = (id: string, checked: boolean) => {
    setFundUsers((prev) =>
      prev.map((user) =>
        user._id === id ? { ...user, status: checked ? 'active' : 'inactive' } : user
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

      if (typeFilter.value !== 'all' && user.funderType !== typeFilter.value) {
        return false;
      }

      if (statusFilter.value !== 'all' && user.status !== statusFilter.value) {
        return false;
      }

      return true;
    });
  }, [fundUsers, searchTerm, typeFilter, statusFilter]);

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
    <div className="p-6 bg-white rounded-md shadow-md space-y-6">
      <h1 className="text-2xl font-semibold">Service Funders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            className="border rounded px-3 py-1 min-w-[300px]"
            placeholder="Search by Name, Org, Email or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button className="bg-supperagent hover:bg-supperagent/90 text-white">
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
        </div>

        <div className="w-48">
          <Select
            options={funderTypeOptions}
            value={typeFilter}
            onChange={(option) => option && setTypeFilter(option)}
            isSearchable={false}
          />
        </div>

        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(option) => option && setStatusFilter(option)}
            isSearchable={false}
          />
        </div>
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
              <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                No matching funders found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedFundUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {[user.title, user.firstName, user.lastName].filter(Boolean).join(' ')}
                </TableCell>
                <TableCell>{user.organization}</TableCell>
                <TableCell>{user.funderType}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                 {user.phone}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.status === 'active'}
                    onCheckedChange={(checked) => handleStatusChange(user._id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(user._id)}
                    className="text-white hover:bg-supperagent/90 bg-supperagent"
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