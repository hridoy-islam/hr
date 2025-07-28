import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Printer, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import { useSelector } from 'react-redux';

export default function StudentFilter({ onSubmit }) {
  const { user } = useSelector((state: any) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [institutes, setInstitutes] = useState<any>([]);
  const [terms, setTerms] = useState<any>([]);
  const [academicYear, setAcademicYear] = useState<any>([]);
  const [agents, setAgents] = useState<any>([]);
  const [staffs, setStaffs] = useState<any>([]);
  const [dob, setDob] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [
        instituteResponse,
        termsResponse,
        academicYearResponse,
        agentResponse,
        staffResponse
      ] = await Promise.all([
        axiosInstance.get('/institutions?limit=all&status=1'),
        axiosInstance.get('/terms?limit=all&status=1'),
        axiosInstance.get('/academic-years?limit=all&status=1'),
        axiosInstance.get('/users?role=agent&status=1&limit=all'),
        axiosInstance.get('/users?role=staff&status=1&limit=all')
      ]);
      setInstitutes(instituteResponse.data.data.result);
      setTerms(termsResponse.data.data.result);
      setAcademicYear(academicYearResponse.data.data.result);
      setAgents(agentResponse.data.data.result);
      setStaffs(staffResponse.data.data.result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filterData = {
      searchTerm,
      status,
      dob,
      institute: selectedInstitute || null,
      term: selectedTerm || null,
      academic_year_id: selectedAcademicYear || null
    };
    if (user.role === 'agent') {
      filterData.agent = user.agent_id; // Assuming the agent's ID is stored in `user.id`
    } else {
      filterData.agent = selectedAgent || null; // Allow selection for admins
      filterData.staffId = selectedStaff || null;
    }
    onSubmit(filterData);
  };

  

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-3 grid gap-4 rounded-md p-4 shadow-2xl md:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">Search</label>
          <Input
            placeholder="Ref No, Name, Email, Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">DOB</label>
          <Input
            placeholder="DOB"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            Academic Year
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
          >
            <option value="">Select Academic Year</option>
            {academicYear.map((year) => (
              <option key={year._id} value={year._id}>
                {year.academic_year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Select Terms</label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">Select Term</option>
            {terms.map((item) => (
              <option key={item._id} value={item._id}>
                {item.term}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Institute</label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
            onChange={(e) => setSelectedInstitute(e.target.value)}
          >
            <option value="">Select Institute</option>
            {institutes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Status</label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="Waiting LCC Approval">Waiting LCC Approval</option>
            <option value="New">New</option>
            <option value="Processing">Processing</option>
            <option value="Application Made">Application Made</option>
            <option value="Offer Made">Offer Made</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Rejected">Rejected</option>
            <option value="Hold">Hold</option>
            <option value="App made to LCC">App made to LCC</option>
            <option value="Deregister">Deregister</option>
            <option value="SLC Course Completed">SLC Course Completed</option>
          </select>
        </div>
        {user.role == 'agent' && (
          <>
            <div></div>
            <div></div>
          </>
        )}

        {/* Agent Dropdown - Always visible for Admin, visible for Staff with Agent Access */}
        {(user.role === 'admin' || user.privileges?.student?.search?.agent) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Agent</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agents.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Staff Dropdown - Always visible for Admin, visible for Staff with Staff Access */}
        {(user.role === 'admin' || user.privileges?.student?.search?.staff) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Staffs</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <option value="">Select Staff</option>
              {staffs.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div></div>
        <div></div>
        <div></div>
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            <Search className="mr-3 h-4 w-4" /> Search
          </Button>
          <Button className="bg-secondary text-white hover:bg-secondary/90">
            <Printer className="mr-3 h-4 w-4" /> Export
          </Button>
        </div>
      </form>
    </div>
  );
}
