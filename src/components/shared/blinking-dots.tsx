import React from 'react';

interface BlinkingDotsProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function BlinkingDots({
  size = 'medium',
  color = 'bg-blue-600'
}: BlinkingDotsProps) {
  const sizeClasses = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2.5 h-2.5',
    large: 'w-4 h-4'
  };

  const containerSizeClasses = {
    small: 'space-x-1',
    medium: 'space-x-2',
    large: 'space-x-3'
  };

  return (
    <div
      className={`flex items-center justify-center ${containerSizeClasses[size]}`}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${color} animate-blink rounded-full`}
          style={{ animationDelay: `${index * 0.2}s` }}
        ></div>
      ))}
    </div>
  );
}
