
import { useSelector } from 'react-redux';
import AdminTrainingPage from './Rolewise-TrainingPage/AdminTraining';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import StaffTraining from './Rolewise-TrainingPage/StaffTraining';


export default function TrainingBoard() {
   const user = useSelector((state: any) => state.auth?.user) || null;

  if (!user) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return user.role === 'admin' ? (
    <AdminTrainingPage />
  ) : (
    <StaffTraining />
  );
}
