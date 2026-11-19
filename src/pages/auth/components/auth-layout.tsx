import { Layers } from 'lucide-react';
import React from 'react';

interface AuthLayoutProps {
  title: string;
  description?: React.ReactNode;
  image: string;
  imageAlt?: string;
  heading: string;
  tagline?: string;
  children: React.ReactNode;
}

// Shared split-screen layout used by all auth pages (matches the Sign In page)
export default function AuthLayout({
  title,
  description,
  image,
  imageAlt = 'Illustration',
  heading,
  tagline = 'Manage all your recruitment and employee accounts in one place.',
  children
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-10 space-y-2">
            <h2 className="text-4xl font-bold text-supperagent">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>

          {children}
        </div>
      </div>

      {/* Right Section */}
      <div className="relative hidden w-1/2 bg-supperagent lg:block">
        <div className="flex h-full flex-col justify-around gap-4 p-8">
          <div className="flex items-start justify-start gap-2 text-white">
            <Layers className="h-8 w-8" />
            <span className="text-2xl font-semibold">HR</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="mb-4">
              <img src={image} alt={imageAlt} width={350} height={200} />
            </div>
            <div className="w-full">
              <h1 className="mb-3 text-center text-3xl font-bold text-white">
                {heading}
              </h1>
            </div>
            <p className="text-center text-lg font-medium text-white">
              {tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
