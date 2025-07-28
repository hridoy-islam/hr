import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePicker24Props {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

export const TimePicker24 = ({ 
  value, 
  onChange, 
  label, 
  className = '',
  placeholder = "Select time"
}: TimePicker24Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState('');
  const [tempMinute, setTempMinute] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const [hours, minutes] = value.split(':');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTempHour('');
        setTempMinute('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close when both hour and minute are selected
  useEffect(() => {
    if (tempHour && tempMinute) {
      const newTime = `${tempHour}:${tempMinute}`;
      onChange(newTime);
      setIsOpen(false);
      setTempHour('');
      setTempMinute('');
    }
  }, [tempHour, tempMinute, onChange]);

  const handleHourSelect = (hour: string) => {
    setTempHour(hour);
  };

  const handleMinuteSelect = (minute: string) => {
    setTempMinute(minute);
  };

  const formatDisplayTime = () => {
    if (!value || value === ':') {
      return placeholder;
    }
    return value;
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTempHour('');
      setTempMinute('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {label}
        </label>
      )}
      
      {/* Time Display Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-white border-2 border-gray-200 rounded-lg
          hover:border-blue-400 focus:border-blue-500 focus:outline-none
          transition-all duration-200 ease-in-out
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
          ${!value || value === ':' ? 'text-gray-500' : 'text-gray-900'}
        `}
      >
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-lg font-mono">
            {formatDisplayTime()}
          </span>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-center space-x-4">
              
              {/* Hours Column */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Hours
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    const isSelected = tempHour === hour || (!tempHour && hours === hour);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourSelect(hour)}
                        className={`
                          block w-full px-4 py-2 text-center font-mono text-sm
                          hover:bg-blue-50 transition-colors duration-150
                          ${isSelected 
                            ? 'bg-blue-100 text-blue-900 font-semibold' 
                            : 'text-gray-700 hover:text-blue-800'
                          }
                        `}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="text-2xl font-bold text-gray-400 pt-6">:</div>

              {/* Minutes Column */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Minutes
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {Array.from({ length: 60 }, (_, i) => {
                    const minute = i.toString().padStart(2, '0');
                    const isSelected = tempMinute === minute || (!tempMinute && minutes === minute);
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteSelect(minute)}
                        className={`
                          block w-full px-4 py-2 text-center font-mono text-sm
                          hover:bg-blue-50 transition-colors duration-150
                          ${isSelected 
                            ? 'bg-blue-100 text-blue-900 font-semibold' 
                            : 'text-gray-700 hover:text-blue-800'
                          }
                        `}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

           
          </div>
        </div>
      )}
    </div>
  );
};