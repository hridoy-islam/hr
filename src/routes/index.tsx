import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ForgotPassword from '@/pages/auth/forget-password';
import SignUpPage from '@/pages/auth/sign-up';

import { Children, Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import Otp from '@/pages/auth/otp';
import AdminLayout from '@/components/layout/admin-layout';
import ErrorPage from '@/pages/ErrorPage/';
import NewPassword from '@/pages/auth/NewPassword';
import HrPage from '@/pages/Hr';
import Vacancy from '@/pages/company/Vacancy';
import Profile from '@/pages/Hr/Profile';
import Holiday from '@/pages/Hr/Holidays';
import MyStaff from '@/pages/Hr/MyStaff';
import Employee from '@/pages/company/Employee';
import Attendance from '@/pages/Hr/Attendance';
import PayRoll from '@/pages/company/Payroll';
import Recruitment from '@/pages/company/Recruitment';
import Settings from '@/pages/Hr/Settings';
import HrLayout from '@/components/layout/hr-layout';
import Department from '@/pages/company/Department';
import Shift from '@/pages/company/Shift';
import Designation from '@/pages/company/Designation';
import CompanyDetails from '@/pages/company/Company-Details';
import EmailSetup from '@/pages/company/Email-Setup';
import CreateVacancy from '@/pages/company/Vacancy/CreateVacancy';
import EditVacancy from '@/pages/company/Vacancy/EditVacancy';
import AddApplicant from '@/pages/company/Vacancy/AddApplicant';
import ViewApplicant from '@/pages/company/Vacancy/ViewApplicants';
import RecruitApplicantForm from '@/pages/company/Recruitment/RecruitApplicantForm';
import AddDesignation from '@/pages/company/Designation/CreateDesignation';
import EditDesignation from '@/pages/company/Designation/EditDesignation';
import EmployeeForm from '@/pages/company/Recruitment/employeeForm';
import EditEmployee from '@/pages/company/Employee/editEmployee';
import CreateShift from '@/pages/company/Shift/CreateShift';
import EditShift from '@/pages/company/Shift/EditShift';
import EmployeeRate from '@/pages/company/Employee/employeeRate';
import AttendanceList from '@/pages/Hr/Attendance/attendaceList';
import AttendanceApprovalPage from '@/pages/Hr/Attendance/Attendance-Approve';
import AttendanceApproveList from '@/pages/Hr/Attendance/Attendance-Approve/attendance-list';
import ApplicantDetailPage from '@/pages/company/Vacancy/viewApplicant';
import LeaveApprovalPage from '@/pages/Hr/LeaveApproval';

import RightToWorkExpiryPage from '@/pages/Hr/Dashboard/components/rightToWork';
import PassportExpiryPage from '@/pages/company/ExpiryPage/passportExpiray';
import RtwPage from '@/pages/company/Employee/rightToWorkEmployee';
import RightToWorkStatusPage from '@/pages/Hr/Dashboard/components/rightToWorkStatus';
import BankHolidayPage from '@/pages/company/Bank-Holiday';
import RequestDocumentPage from '@/pages/Hr/Request-Documents';
import StaffAttendancePage from '@/pages/Hr/StaffAttendance';
import AdminDashboardPage from '@/pages/Dashboard/AdminDashboard';
import { CompanyPage } from '@/pages/admin/companyPage';
import CompanyDashboardPage from '@/pages/Dashboard/CompanyDashboard';
import SubscriptionPlanPage from '@/pages/admin/subscriptionPage';
import { CompanyDetailsPage } from '@/pages/admin/companyPage/companyDetails';
import AdminNoticeBoard from '@/pages/admin/noticePage';
import ReportPage from '@/pages/admin/reportPage';
import CompanyTrainingPage from '@/pages/company/TrainingPage';
import CreateTraining from '@/pages/company/TrainingPage/CreateTraining';
import EditTraining from '@/pages/company/TrainingPage/EditTraining';
import CompanyScheduleCheckPage from '@/pages/company/ScheduleCheckPage';
import CompanyNoticeBoard from '@/pages/company/NoticePage';
import DbsExpiryPage from '@/pages/company/ExpiryPage/dbsExpiryPage';
import VisaExpiryPage from '@/pages/company/ExpiryPage/visaExpiryPage';
import RtwExpiryPage from '@/pages/company/ExpiryPage/rtwExpiryPage';
import ImmigrationExpiryPage from '@/pages/company/ExpiryPage/immigrationExpiryPage';
import AppraisalExpiryPage from '@/pages/company/ExpiryPage/appraisalExpiryPage';
import TrainingDetailsPage from '@/pages/company/Employee/employeeTraining/employeeTrainingDetails';
import SpotCheckExpiryPage from '@/pages/company/ExpiryPage/spotCheckExpiryPage';
import SupervisionExpiryPage from '@/pages/company/ExpiryPage/supervisionExpiryPage';
import TrainingExpiryPage from '@/pages/company/ExpiryPage/trainingExpiryPage';
import CompanyBranch from '@/pages/company/companyBranch';
import InductionExpiryPage from '@/pages/company/ExpiryPage/InductionExpiryPage';
import DisciplinaryExpiryPage from '@/pages/company/ExpiryPage/disciplinaryExpiryPage';
import AttendancePage from '@/pages/company/Attendance/AttendanceList';
import AttendanceReport from '@/pages/company/Attendance/Attendance-Report';
import QAExpiryPage from '@/pages/company/ExpiryPage/QAExpiryPage';
import BulkAttendancePage from '@/pages/company/Attendance/csvAttendance';
import AdminPayRoll from '@/pages/company/Payroll';
import ViewPayroll from '@/pages/company/Payroll/view-payroll';
import { ScheduleStatusProvider } from '@/context/scheduleStatusContext';
import EntryAttendance from '@/pages/company/Attendance/entry-attendance';
import EmployeeRequiredDocumentPage from '@/pages/company/ExpiryPage/EmployeeRequiredDocumentPage';
import CompanyRota from '@/pages/company/Rota';
import RotaLayout from '@/components/layout/rota-layout';
import CompanyRotaReport from '@/pages/company/RotaReport';
import StaffDashboardPage from '@/pages/Dashboard/StaffDashboard';
import UpcomingShiftPage from '@/pages/staff/upcoming-shifts';
import StaffNoticeBoard from '@/pages/staff/notice';
import HolidayPage from '@/pages/staff/holiday';
import CompanyLeaveApprovalPage from '@/pages/company/LeaveApproval';

const SignInPage = lazy(() => import('@/pages/auth/signin'));

// ----------------------------------------------------------------------

export default function AppRouter() {
  const adminRoutes = [
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
            <ScheduleStatusProvider>

          <HrLayout />
            </ScheduleStatusProvider>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <AdminDashboardPage />
            </Suspense>
          )
        },
        { path: 'company', element: <CompanyPage /> },
        { path: 'company/:id', element: <CompanyDetailsPage /> },
        { path: 'subscription-plan', element: <SubscriptionPlanPage /> },
        { path: 'notice', element: <AdminNoticeBoard /> },
        { path: 'report', element: <ReportPage /> }
      ]
    }
  ];

  const companyRoutes = [
    {
      path: '/company/:id',
      element: (
        <ProtectedRoute>
          <ScheduleStatusProvider>
            <HrLayout />
          </ScheduleStatusProvider>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <CompanyDashboardPage />
            </Suspense>
          )
        },

        { path: 'expiry/passport', element: <PassportExpiryPage /> },
        { path: 'expiry/dbs', element: <DbsExpiryPage /> },
        { path: 'expiry/visa', element: <VisaExpiryPage /> },
        { path: 'expiry/appraisal', element: <AppraisalExpiryPage /> },
        { path: 'expiry/immigration', element: <ImmigrationExpiryPage /> },
        { path: 'expiry/spot-check', element: <SpotCheckExpiryPage /> },
        { path: 'expiry/supervision', element: <SupervisionExpiryPage /> },
        { path: 'expiry/training', element: <TrainingExpiryPage /> },
        { path: 'expiry/induction', element: <InductionExpiryPage /> },
        { path: 'expiry/disciplinary', element: <DisciplinaryExpiryPage /> },
        { path: 'expiry/qa', element: <QAExpiryPage /> },
        {
          path: 'expiry/rtw',
          element: <RtwExpiryPage />
        },
        {
          path: 'required-employee-documents',
          element: <EmployeeRequiredDocumentPage />
        },

        { path: 'company-branch', element: <CompanyBranch /> },
        { path: 'profile', element: <Profile /> },
        { path: 'holiday', element: <Holiday /> },
        { path: 'my-staff', element: <MyStaff /> },

        { path: 'employee', element: <Employee /> },
        { path: 'employee/:eid', element: <EditEmployee /> },
        {
          path: 'employee/:eid/training-details/:tid',
          element: <TrainingDetailsPage />
        },
        { path: 'employee/:eid/employee-rate', element: <EmployeeRate /> },
        { path: 'employee/:eid/rtw', element: <RtwPage /> },

        { path: 'department', element: <Department /> },

        { path: 'rota', element: <CompanyRota /> },
        { path: 'shift', element: <Shift /> },
        { path: 'shift/create-shift', element: <CreateShift /> },
        { path: 'shift/edit-shift/:sid', element: <EditShift /> },

        { path: 'designation', element: <Designation /> },
        { path: 'designation/create', element: <AddDesignation /> },
        { path: 'designation/edit/:did', element: <EditDesignation /> },

        { path: 'training', element: <CompanyTrainingPage /> },
        { path: 'create-training', element: <CreateTraining /> },
        { path: 'edit-training/:tid', element: <EditTraining /> },

        { path: 'attendance', element: <AttendancePage /> },
        { path: 'attendance-list', element: <AttendanceList /> },
        { path: 'csv-attendance', element: <BulkAttendancePage /> },
        { path: 'attendance-entry', element: <EntryAttendance /> },

        { path: 'attendance-approve', element: <AttendanceApprovalPage /> },
        {
          path: 'attendance-approve/attendance-list',
          element: <AttendanceApproveList />
        },

        { path: 'staff-attendance', element: <StaffAttendancePage /> },
        { path: 'attendance-report', element: <AttendanceReport /> },

        { path: 'payroll', element: <AdminPayRoll /> },
        { path: 'payroll/:pid', element: <ViewPayroll /> },

        { path: 'leave-approve', element: <LeaveApprovalPage /> },

        { path: 'notice', element: <CompanyNoticeBoard /> },

        { path: 'vacancy', element: <Vacancy /> },
        { path: 'vacancy/create-vacancy', element: <CreateVacancy /> },
        { path: 'vacancy/edit-vacancy/:vid', element: <EditVacancy /> },

        { path: 'vacancy/add-applicant/:vid', element: <AddApplicant /> },
        { path: 'vacancy/view-applicants/:vid', element: <ViewApplicant /> },
        {
          path: 'vacancy/view-applicant/:aid',
          element: <ApplicantDetailPage />
        },

        {
          path: 'vacancy/recruit-applicant/:aid',
          element: <RecruitApplicantForm />
        },
        {
          path: 'vacancy/recruit-applicant/employee',
          element: <EmployeeForm />
        },

        { path: 'recruitment', element: <Recruitment /> },
        { path: 'candidate-list', element: <Recruitment /> },

        { path: 'settings', element: <Settings /> },
        { path: 'company-details', element: <CompanyDetails /> },

        { path: 'documents', element: <ReportPage /> },
        { path: 'document-request', element: <RequestDocumentPage /> },

        { path: 'email-setup', element: <EmailSetup /> },
        { path: 'bank-holiday', element: <BankHolidayPage /> },
        { path: 'schedule-check', element: <CompanyScheduleCheckPage /> },
        { path: 'leave-approval', element: <CompanyLeaveApprovalPage /> }
      ]
    }
  ];
  const StaffRoutes = [
    {
      path: '/company/:id/staff/:eid',
      element: (
        <ProtectedRoute>
          <ScheduleStatusProvider>
            <HrLayout />
          </ScheduleStatusProvider>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <StaffDashboardPage />
            </Suspense>
          )
        },

        { path: 'upcoming-shifts', element: <UpcomingShiftPage /> },
        { path: 'notice', element: <StaffNoticeBoard /> },
        { path: 'holiday', element: <HolidayPage /> }
        
      ]
    }
  ];
    const rotaRoutes = [
    {
      path: '/company/:id/rota',
      element: (
        <ProtectedRoute>
          <ScheduleStatusProvider>
            <RotaLayout />
          </ScheduleStatusProvider>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <CompanyRota />
            </Suspense>
          )
        },
        { path: 'report', element: <CompanyRotaReport /> }

   
      ]
    }
  ];

  const publicRoutes = [
    {
      path: '/',
      element: <SignInPage />,
      index: true
    },
    {
      path: '/signup',
      element: <SignUpPage />,
      index: true
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword />,
      index: true
    },
    {
      path: '/otp',
      element: <Otp />,
      index: true
    },

    {
      path: '/new-password',
      element: <NewPassword />,
      index: true
    },
    {
      path: '/404',
      element: <ErrorPage />
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />
    }
  ];

  const routes = useRoutes([...publicRoutes, ...adminRoutes, ...companyRoutes,...rotaRoutes,...StaffRoutes]);

  return routes;
}
