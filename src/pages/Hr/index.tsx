import { useSelector } from "react-redux";
import AdminDashboardPage from "./Dashboard/adminDashboard";


const HrPage = () => {
   const user = useSelector((state:any) => state.auth?.user) || null;


  return (
  <AdminDashboardPage/>
  )
}

export default HrPage
