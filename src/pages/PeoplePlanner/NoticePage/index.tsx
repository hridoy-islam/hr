import React, { useState, useMemo } from 'react';
import { mockNotices } from '@/data/mockNotices';
import { Notice, NoticeFilter, NoticePriority, NoticeCategory } from '../types/notice';
import { NoticeCard } from './components/NoticeCard';
import { NoticeFilters } from './components/NoticeFilters';
import { NoticeStats } from './components/NoticeStats';
import { Megaphone, FileText } from 'lucide-react';

export function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [activeFilter, setActiveFilter] = useState<NoticeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<NoticePriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NoticeCategory | 'all'>('all');

  const handleToggleRead = (id: string) => {
    setNotices(prev => 
      prev.map(notice => 
        notice.id === id ? { ...notice, isRead: !notice.isRead } : notice
      )
    );
  };

  const handleTogglePin = (id: string) => {
    setNotices(prev => 
      prev.map(notice => 
        notice.id === id ? { ...notice, isPinned: !notice.isPinned } : notice
      )
    );
  };

  const filteredNotices = useMemo(() => {
    let filtered = notices;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notice => 
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(notice => !notice.isRead);
        break;
      case 'read':
        filtered = filtered.filter(notice => notice.isRead);
        break;
      case 'pinned':
        filtered = filtered.filter(notice => notice.isPinned);
        break;
      default:
        break;
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notice => notice.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notice => notice.category === categoryFilter);
    }

    // Sort by pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notices, activeFilter, searchTerm, priorityFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-supperagent rounded-lg">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notice Board</h1>
              <p className="text-gray-600">Stay updated with the latest announcements and memos</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {/* <NoticeStats notices={notices} /> */}

        {/* Filters */}
        {/* <NoticeFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
        /> */}

        {/* Notice List */}
        <div className="space-y-4">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onToggleRead={handleToggleRead}
                onTogglePin={handleTogglePin}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600">
                {searchTerm || activeFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'There are no notices to display at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}