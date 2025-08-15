import React from 'react';
import { Edit2, Save, X } from 'lucide-react';

const TabSection = ({
  title,
  description,
  userData,
  children,
  isEditing,
  onSave,
  onCancel,
  onEdit
}) => {

  return (
    <section className="animate-fadeIn">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="inline-flex items-center rounded-md border border-transparent bg-watney px-3 py-2 text-sm font-medium leading-4 text-white transition-colors hover:bg-watney0 focus:outline-none focus:ring-2 focus:ring-watney focus:ring-offset-2"
              >
                <Save size={16} className="mr-1" />
                Save
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-watney focus:ring-offset-2"
              >
                <X size={16} className="mr-1" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-watney focus:ring-offset-2"
            >
              <Edit2 size={16} className="mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-lg bg-white transition-all duration-300 ${isEditing ? 'ring-2 ring-watney' : 'border border-gray-200'}`}
      >
        <div className="px-6 py-5">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { 
                isEditing,
                userData 
              });
            }
            return child;
          })}
        </div>
      </div>
    </section>
  );
};

export default TabSection;