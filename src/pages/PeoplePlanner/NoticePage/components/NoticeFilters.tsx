import React from 'react';
import { NoticeFilter, NoticePriority, NoticeCategory } from '../types/notice';
import { Search, Filter, X } from 'lucide-react';

interface NoticeFiltersProps {
  activeFilter: NoticeFilter;
  onFilterChange: (filter: NoticeFilter) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  priorityFilter: NoticePriority | 'all';
  onPriorityFilterChange: (priority: NoticePriority | 'all') => void;
  categoryFilter: NoticeCategory | 'all';
  onCategoryFilterChange: (category: NoticeCategory | 'all') => void;
}

export function NoticeFilters({
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange
}: NoticeFiltersProps) {
  const filters: { key: NoticeFilter; label: string }[] = [
    { key: 'all', label: 'All Notices' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'pinned', label: 'Pinned' }
  ];

  const priorities: { key: NoticePriority | 'all'; label: string }[] = [
    { key: 'all', label: 'All Priorities' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' }
  ];

  const categories: { key: NoticeCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    { key: 'general', label: 'General' },
    { key: 'hr', label: 'HR' },
    { key: 'it', label: 'IT' },
    { key: 'finance', label: 'Finance' },
    { key: 'operations', label: 'Operations' },
    { key: 'safety', label: 'Safety' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-supperagent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as NoticePriority | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorities.map((priority) => (
              <option key={priority.key} value={priority.key}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value as NoticeCategory | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}