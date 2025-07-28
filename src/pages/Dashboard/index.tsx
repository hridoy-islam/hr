import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Briefcase,
  CalendarDays,
} from 'lucide-react';

export const DashboardPage = () => {
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (index: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
      },
    }),
  };

  const cards = [
    {
      title: 'HR Management',
      icon: <Users size={48} />,
      path: '/admin/hr',
    },
    {
      title: 'Student Management',
      icon: <GraduationCap size={48} />,
      path: '/admin/students',
    },
    {
      title: 'Applicant Tracking',
      icon: <Briefcase size={48} />,
      path: '/admin/applicants',
    },
    {
      title: 'People Planner',
      icon: <CalendarDays size={48} />,
      path: '/admin/people-planner',
    },
  ];

  return (
    <div className="mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-supperagent">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={card.path}>
              <Card className="flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:shadow-lg">
                <div className="mb-3 text-supperagent">{card.icon}</div>
                <h2 className="text-center text-lg font-semibold text-gray-800 ">
                  {card.title}
                </h2>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};