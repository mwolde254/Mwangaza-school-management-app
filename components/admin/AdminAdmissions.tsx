
import React, { useState } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { AdmissionStage, AdmissionApplication } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Check } from 'lucide-react';

const PIPELINE_STAGES: { id: AdmissionStage, label: string, color: string }[] = [
    { id: 'NEW_INQUIRY', label: 'Inquiry', color: 'border-brand-sky bg-brand-sky/5 text-brand-sky' },
    { id: 'UNDER_REVIEW', label: 'Reviewing', color: 'border-brand-yellow bg-brand-yellow/5 text-brand-yellow' },
    { id: 'INTERVIEW', label: 'Interview', color: 'border-purple-500 bg-purple-50 text-purple-600' },
    { id: 'OFFER_SENT', label: 'Offer Sent', color: 'border-brand-blue bg-brand-blue/5 text-brand-blue' },
    { id: 'ENROLLED', label: 'Enrolled', color: 'border-brand-green bg-brand-green/5 text-brand-green' },
];

const AdminAdmissions = () => {
  const { applications, updateApplicationStage, enrollApplicant } = useStudentData();
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [viewingApp, setViewingApp] = useState<AdmissionApplication | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollApp, setEnrollApp] = useState<AdmissionApplication | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleDragStart = (id: string) => setDraggedAppId(id);
  
  const handleDrop = async (stage: AdmissionStage) => { 
      if (draggedAppId) { 
          await updateApplicationStage(draggedAppId, stage); 
          setDraggedAppId(null); 
      } 
  };
  
  const handleOpenEnrollWizard = (app: AdmissionApplication) => {
      setEnrollApp(app);
      setViewingApp(null);
      setShowEnrollmentModal(true);
  };

  const handleFinalizeEnrollment = async () => {
      if (!enrollApp) return;
      setIsEnrolling(true);
      await enrollApplicant(enrollApp.id);
      setIsEnrolling(false);
      setShowEnrollmentModal(false);
      setNotification({ message: `Success! ${enrollApp.childName} is now enrolled.`, type: 'success' });
      setEnrollApp(null);
      setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col animate-slide-up relative">
        {notification && (
            <div className="absolute top-0 right-0 z-50 px-6 py-4 bg-brand-green text-white rounded-[12px] shadow-xl flex items-center gap-3 animate-slide-up">
                <Check size={20}/> <span className="font-bold">{notification.message}</span>
            </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4 h-full custom-scrollbar">
            {PIPELINE_STAGES.map(stage => {
                const stageApps = applications.filter(a => a.stage === stage.id);
                return (
                    <div key={stage.id} className="min-w-[280px] w-[280px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 max-h-full">
                        <div className={`p-3 border-b border-gray-200 rounded-t-xl font-bold text-sm flex justify-between items-center ${stage.color}`}>
                            <span>{stage.label}</span>
                            <span className="bg-white/50 px-2 py-0.5 rounded text-xs">{stageApps.length}</span>
                        </div>
                        <div 
                            className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            {stageApps.map(app => (
                                <div 
                                    key={app.id} 
                                    draggable
                                    onDragStart={() => handleDragStart(app.id)}
                                    onClick={() => setViewingApp(app)}
                                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-brand-blue/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-gray-800 group-hover:text-brand-blue">{app.childName}</span>
                                        <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(app.submissionDate), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">{app.targetGrade}</p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                        <div className="flex gap-1">
                                            {app.hasSpecialNeeds && <span className="w-2 h-2 rounded-full bg-brand-yellow" title="Special Needs"></span>}
                                            {app.hasAllergies && <span className="w-2 h-2 rounded-full bg-brand-red" title="Allergies"></span>}
                                        </div>
                                        {stage.id === 'OFFER_SENT' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenEnrollWizard(app); }}
                                                className="text-[10px] font-bold bg-brand-green text-white px-2 py-1 rounded hover:bg-brand-green/90"
                                            >
                                                Enroll
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Enrollment Confirmation Modal */}
        {showEnrollmentModal && enrollApp && (
            <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-[12px] p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100">
                    <h3 className="font-display font-bold text-xl text-gray-800 mb-4">Confirm Enrollment</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        This will create a new student record for <strong>{enrollApp.childName}</strong> and create/link the parent account for <strong>{enrollApp.parentName}</strong>.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowEnrollmentModal(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-[6px] font-bold hover:bg-gray-50">Cancel</button>
                        <button onClick={handleFinalizeEnrollment} disabled={isEnrolling} className="flex-1 h-10 bg-brand-green text-white rounded-[6px] font-bold shadow-lg hover:bg-brand-green/90 flex items-center justify-center gap-2">
                            {isEnrolling ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminAdmissions;
