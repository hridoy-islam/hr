import React from 'react';
import { Notice } from '../types/notice';
import { 
  Pin, 
  Calendar, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle2,
  Clock
} from 'lucide-react';

interface NoticeCardProps {
  notice: Notice;
  onToggleRead: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const categoryColors = {
  general: 'bg-gray-100 text-gray-800',
  hr: 'bg-purple-100 text-purple-800',
  it: 'bg-blue-100 text-blue-800',
  finance: 'bg-green-100 text-green-800',
  operations: 'bg-orange-100 text-orange-800',
  safety: 'bg-red-100 text-red-800'
};

export function NoticeCard({ notice, onToggleRead, onTogglePin }: NoticeCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
      notice.isRead ? 'border-gray-200' : 'border-blue-200 shadow-blue-50'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {notice.isPinned && (
                <Pin className="w-4 h-4 text-blue-600" />
              )}
              <h3 className={`font-semibold text-lg ${
                notice.isRead ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {notice.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                priorityColors[notice.priority]
              }`}>
                {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                categoryColors[notice.category]
              }`}>
                {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePin(notice.id)}
              className={`p-2 rounded-full transition-colors ${
                notice.isPinned 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
              title={notice.isPinned ? 'Unpin notice' : 'Pin notice'}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleRead(notice.id)}
              className={`p-2 rounded-full transition-colors ${
                notice.isRead 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
              title={notice.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {notice.isRead ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className={`text-sm leading-relaxed mb-4 ${
          notice.isRead ? 'text-gray-600' : 'text-gray-700'
        }`}>
          {notice.content}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{notice.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              <span>{notice.department}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}