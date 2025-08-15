import { useSelector } from "react-redux";
import AdminPayRoll from "./components/AdminPayroll";
import StaffPayRoll from "./components/StaffPayroll";

const PayRoll = () => {
  const user = useSelector((state: any) => state.auth.user); // Get user from Redux state
  
  if (user.role === "admin") {
    return <AdminPayRoll />;
  }

  if (user.role === "employee") {
    return <StaffPayRoll />;
  }

  return null; 
};

export default PayRoll;
