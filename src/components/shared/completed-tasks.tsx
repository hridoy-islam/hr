import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import axiosInstance from '../../lib/axios';
import { useEffect, useState } from 'react';
import TaskList from './task-list';
import { useToast } from '../ui/use-toast';
import { Link } from 'react-router-dom';

export default function CompletedTasks({ user }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const fetchCompletedTasks = async () => {
    const response = await axiosInstance(
      `/task?author=${user._id}&status=completed`
    );
    setTasks(response.data.data.result);
  };

  useEffect(() => {
    fetchCompletedTasks();
    const intervalId = setInterval(() => {
      fetchCompletedTasks();
    }, 30000); // 30 seconds

    // const timeoutId = setTimeout(() => {
    //   clearInterval(intervalId);
    // }, 3600000); // 1 hour

    // Cleanup on component unmount
    return () => {
      // clearInterval(intervalId);
      clearTimeout(intervalId);
    };
  }, [user]);

  const handleMarkAsImportant = async (taskId) => {
    const task: any = tasks.find((t: any) => t._id === taskId);

    const response = await axiosInstance.patch(
      `/task/${taskId}`,
      { important: !task.important } // Toggle important status
    );

    if (response.data.success) {
      fetchCompletedTasks();
      toast({
        title: 'Task Updated',
        description: 'Thank You'
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Something Went Wrong!'
      });
    }
  };

  const handleToggleTaskCompletion = async (taskId) => {
    const task: any = tasks.find((t: any) => t._id === taskId);

    const response = await axiosInstance.patch(`/task/${taskId}`, {
      status: task?.status === 'completed' ? 'pending' : 'completed'
    });

    if (response.data.success) {
      fetchCompletedTasks();
      toast({
        title: 'Task Updated',
        description: 'Thank You'
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Something Went Wrong!'
      });
    }
  };

  return (
    <Card className="h-[calc(85vh-8rem)] overflow-hidden">
      <CardHeader>
        <CardTitle className="flex justify-between gap-2">
          <span>Completed</span>
          <Link to={'completedtask'}>See All</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <TaskList
          tasks={tasks}
          onMarkAsImportant={handleMarkAsImportant}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          fetchTasks={fetchCompletedTasks}
        />
      </CardContent>
    </Card>
  );
}
