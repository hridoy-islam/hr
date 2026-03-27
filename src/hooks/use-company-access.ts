import { useSelector } from 'react-redux';

export const useCompanyAccess = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user) || null;

  const hasAccess = (moduleName?: string) => {
    // If no module is specified for the nav item, it's accessible
    if (!moduleName) return true;

    // If the user is NOT a companyAdmin, they bypass this check
    if (user?.role !== 'companyAdmin') return true;

    // If they are a companyAdmin, check the specific module in companyAccess
    if (user?.companyAccess && user.companyAccess[moduleName]) {
      return !!user.companyAccess[moduleName].access;
    }

    return false; // Deny if access explicitly missing
  };

  return { hasAccess };
};