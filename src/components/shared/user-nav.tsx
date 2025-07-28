import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, UserPlus, User, KeyRound } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useEffect, useState } from 'react';
import { useToast } from '../ui/use-toast';
import axiosInstance from "@/lib/axios"
export function UserNav() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user } = useSelector((state: any) => state.auth);
   const [profileData, setProfileData] = useState(
      null
    );


  const fetchProfileData = async () => {
      try {
        const response = await axiosInstance.get(`/users/${user?._id}`);
        const data = response.data.data;
        setProfileData(data);
      
      } catch (error) {
        console.error('Error fetching profile data:', error);
       
      }
    };
    useEffect(() => {
  
      fetchProfileData();
    }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };
  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileData?.imgUrl} alt="@shadcn"  />
              <AvatarFallback>
                {user?.name
                  ?.split(' ') // Split name into an array of words
                  .slice(0, 2) // Get the first two words (first & last name)
                  .map((word) => word.charAt(0).toUpperCase()) // Take first letter & capitalize
                  .join('')}{' '}
                {/* Join the letters together */}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <Link to="profile">Profile</Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Add Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Reset Password</span>
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
