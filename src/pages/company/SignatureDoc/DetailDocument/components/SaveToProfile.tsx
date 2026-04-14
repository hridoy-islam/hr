import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FolderOpen } from 'lucide-react';

// Import your separated module components
import { DocumentModule } from './DocumentModule';
import { RightToWorkModule } from './RightToWorkModule';
import { VisaModule } from './VisaModule';
import { PassportModule } from './PassportModule';
import { ImmigrationModule } from './ImmigrationModule';
import { DbsModule } from './DbsModule';
import { AppraisalModule } from './AppraisalModule';
import { SpotCheckModule } from './SpotCheckModule';
import { QACheckModule } from './QAModule';
import { InductionModule } from './InductionModule';
import { SuperVisionModule } from './SuperVisionModule';
import { DisciplinaryModule } from './DisciplinaryModule';
// import { VisaModule } from './profile-modules/VisaModule';
// import { DisciplinaryModule } from './profile-modules/DisciplinaryModule';

const MODULES = [
  { id: 'documents', label: 'Documents' },
  { id: 'right-to-work', label: 'Right To Work' },
  { id: 'visa', label: 'Visa' },
  { id: 'dbs', label: 'DBS' },
  { id: 'passport', label: 'Passport' },
  { id: 'immigration', label: 'Immigration' },
  { id: 'appraisal', label: 'Appraisal' },
  { id: 'spot-check', label: 'Spot Check' },
  { id: 'induction', label: 'Induction' },
  { id: 'quality-assurance', label: 'Quality Assurance' },
  { id: 'disciplinary', label: 'Disciplinary' },
  { id: 'super-vision-check', label: 'Super Vision Check' }
];

interface SaveToProfileFlowProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  employeeId?: string;
}

export function SaveToProfile({ isOpen, onClose, document, employeeId }: SaveToProfileFlowProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const handleCloseAll = () => {
    setSelectedModuleId(null);
    onClose();
  };

  const renderActiveModule = () => {
    if (!selectedModuleId) return null;

    const moduleObj = MODULES.find((m) => m.id === selectedModuleId)!;
    
    const commonProps = {
      isOpen: !!selectedModuleId,
      onClose: handleCloseAll,
      onBack: () => setSelectedModuleId(null),
      document: document,
      module: moduleObj,
      employeeId: employeeId, 
    };

    switch (selectedModuleId) {
      case 'documents':
        return <DocumentModule {...commonProps} />;
      case 'right-to-work':
        return <RightToWorkModule {...commonProps} />;
      case 'visa': return <VisaModule {...commonProps} />;
      case 'passport': return <PassportModule {...commonProps} />;
      case 'immigration': return <ImmigrationModule {...commonProps} />;
      case 'dbs': return <DbsModule {...commonProps} />;
      case 'appraisal': return <AppraisalModule {...commonProps} />;
      case 'spot-check': return <SpotCheckModule {...commonProps} />;
      case 'quality-assurance': return <QACheckModule {...commonProps} />;
      case 'induction': return <InductionModule {...commonProps} />;
      case 'super-vision-check': return <SuperVisionModule {...commonProps} />;
      case 'disciplinary': return <DisciplinaryModule {...commonProps} />;
      
      default:
        // 🚀 As requested, default returns null. Every module will have its own component.
        return null;
    }
  };

  return (
    <>
      <Dialog 
        open={isOpen && !selectedModuleId} 
        onOpenChange={(open) => !open && handleCloseAll()}
      >
        <DialogContent className="max-w-6xl border-none">
          <DialogHeader>
            <DialogTitle>Save Document To Profile</DialogTitle>
            <DialogDescription>
              Select the module where you want to save "{document?.content || 'this document'}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {MODULES.map((mod) => (
              <Button
                key={mod.id}
                variant="outline"
                className="flex h-24 flex-col border-gray-200 hover:border-theme items-center justify-center gap-2 whitespace-normal text-center  hover:bg-gray-50/50 bg-white text-black hover:text-theme transition-colors"
                onClick={() => setSelectedModuleId(mod.id)}
              >
                <FolderOpen className="h-6 w-6" />
                <span className="text-sm font-medium">{mod.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Renders the specific module dialog on top */}
      {renderActiveModule()}
    </>
  );
}