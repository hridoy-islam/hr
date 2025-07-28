import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TopControlsProps {
  filterBy: string;
  setFilterBy: (value: string) => void;
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export function TopControls({
  
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  
  status,
  setStatus,
  
}) {
  return (
    <div className="w-full border-b border-gray-200 bg-white p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
         

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 min-w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All
                </SelectItem>
                <SelectItem value="allocated" className="text-xs">
                  Allocated
                </SelectItem>
                <SelectItem value="unallocated" className="text-xs">
                  Unallocated
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          
              <div className="flex flex-col items-start gap-2">
                <span className="text-xs text-gray-600">Zoom</span>
                <div className='flex flex-row items-center gap-2'>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-6 w-6 p-0"
                  >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="relative h-1.5 w-16 rounded bg-gray-200">
                  <div
                    className="h-1.5 rounded bg-teal-600 transition-all duration-200"
                    style={{ width: `${((zoomLevel - 2) / 6) * 100}%` }}
                    />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-6 w-6 p-0"
                  >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-500">{zoomLevel}x</span>
                  </div>
              </div>
        </div>
      </div>
    </div>
  );
}
