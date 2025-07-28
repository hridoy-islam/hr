// import { formatDistanceToNow } from 'date-fns';
// import {
//   type LucideIcon,
//   MessageSquare,
//   Heart,
//   UserPlus,
//   Bell
// } from 'lucide-react';

// export type NotificationType =
//   | 'message'
//   | 'like'
//   | 'friend_request'
//   | 'reminder';

// export interface Notification {
//   id: string;
//   message: string;
//   read: boolean;
//   icon: LucideIcon;
// }

// export const notificationIcons: Record<NotificationType, LucideIcon> = {
//   message: MessageSquare,
//   like: Heart,
//   friend_request: UserPlus,
//   reminder: Bell
// };

export function NotificationItem({ notification }) {
  return (
    <div
      className={`flex w-full cursor-pointer items-start space-x-4 p-4 ${notification.isRead ? 'bg-primary' : 'bg-blue-200'}`}
    >
      {/* <Icon className="mt-1 h-5 w-5 text-background" /> */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none text-black">
          {notification.message}
        </p>
        {/* <p className="text-xs text-black">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </p> */}
      </div>
    </div>
  );
}
