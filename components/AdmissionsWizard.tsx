
import React, { useState } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { Check, ChevronRight, ChevronLeft, UploadCloud, User, FileText, Activity, Lock, ArrowLeft } from 'lucide-react';
import { AdmissionApplication } from '../types';

interface AdmissionsWizardProps {
  onExit: () => void;
}

const STEPS = [
  { id: 1, title: 'Inquiry', icon: User },
  { id: 2, title: 'Student Info', icon: User },
  { id: 3, title: 'Medical', icon: Activity },
  { id: 4, title: 'Documents', icon: UploadCloud },
  { id: 5, title: 'Review', icon: FileText }
];

const AdmissionsWizard: React.FC<AdmissionsWizardProps> = ({ onExit }) => {
  const { submitApplication } = useStudentData();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    stage: 'NEW_INQUIRY',
    hasAllergies: false,
    hasSpecialNeeds: false
  });

  const handleChange = (field: keyof AdmissionApplication, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500)); // Sim delay
    
    if (formData.childName && formData.parentEmail) {
        await submitApplication({
            submissionDate: new Date().toISOString(),
            stage: currentStep === 1 ? 'NEW_INQUIRY' : 'UNDER_REVIEW', // If submitted at step 1, it's a lead. If full wizard, it's review.
            childName: formData.childName || '',
            dob: formData.dob || '',
            gender: formData.gender || 'Male',
            targetGrade: formData.targetGrade || '',
            parentName: formData.parentName || '',
            parentEmail: formData.parentEmail || '',
            parentPhone: formData.parentPhone || '',
            hasAllergies: formData.hasAllergies || false,
            allergyDetails: formData.allergyDetails,
            hasSpecialNeeds: formData.hasSpecialNeeds || false,
            specialNeedsDetails: formData.specialNeedsDetails,
            docBirthCert: formData.docBirthCert,
            docReportCard: formData.docReportCard,
            docImmunization: formData.docImmunization
        });
        setSuccess(true);
    }
    setIsSubmitting(false);
  };

  // Mock Upload Handler
  const handleUpload = (field: keyof AdmissionApplication) => {
    // Simulate upload delay and setting URL
    setTimeout(() => {
        handleChange(field, 'https://fake-url.com/document.pdf');
    }, 1000);
  };

  const inputClass = "w-full h-12 px-4 rounded-[12px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-gray-50 focus:bg-white";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2";

  if (success) {
    return (
        <div className="min-h-screen bg-brand-grey flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="bg-white p-12 rounded-[24px] shadow-xl text-center max-w-lg w-full">
                <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mx-auto mb-6">
                    <Check size={40} strokeWidth={3}/>
                </div>
                <h2 className="font-display font-bold text-3xl text-gray-800 mb-4">Application Received!</h2>
                <p className="text-gray-600 mb-8">
                    Thank you for applying to Mwangaza. We have sent a confirmation email to <span className="font-bold">{formData.parentEmail}</span>. Our registrar will review your documents and contact you within 3 business days.
                </p>
                <button onClick={onExit} className="w-full h-14 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90">
                    Back to Home
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-grey flex flex-col p-4 md:p-8 relative">
        <button onClick={onExit} className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-brand-blue font-bold text-sm z-10">
            <ArrowLeft size={18}/> Cancel Application
        </button>

        <div className="max-w-4xl mx-auto w-full mt-12 flex-1 flex flex-col">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="font-display font-bold text-3xl text-brand-blue mb-2">Join Our Community</h1>
                <p className="text-gray-500">Complete the admission process online.</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center mb-8 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                {STEPS.map((step, idx) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    return (
                        <div key={step.id} className="flex flex-col items-center bg-brand-grey px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                                isCompleted ? 'bg-brand-green border-brand-green text-white' : 
                                isActive ? 'bg-white border-brand-blue text-brand-blue' : 
                                'bg-white border-gray-200 text-gray-300'
                            }`}>
                                {isCompleted ? <Check size={16}/> : <step.icon size={16}/>}
                            </div>
                            <span className={`text-xs font-bold mt-2 ${isActive ? 'text-brand-blue' : 'text-gray-400'}`}>{step.title}</span>
                        </div>
                    );
                })}
            </div>

            {/* Card */}
            <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 p-8 md:p-12 flex-1 flex flex-col animate-slide-up">
                
                {/* STEP 1: INQUIRY / PARENT INFO */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-display font-bold text-xl text-gray-800">Parent / Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Full Name</label>
                                <input type="text" value={formData.parentName} onChange={e => handleChange('parentName', e.target.value)} className={inputClass} placeholder="e.g. John Doe"/>
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <input type="email" value={formData.parentEmail} onChange={e => handleChange('parentEmail', e.target.value)} className={inputClass} placeholder="e.g. john@email.com"/>
                            </div>
                            <div>
                                <label className={labelClass}>Phone Number</label>
                                <input type="tel" value={formData.parentPhone} onChange={e => handleChange('parentPhone', e.target.value)} className={inputClass} placeholder="e.g. 0722000000"/>
                            </div>
                            <div>
                                <label className={labelClass}>Target Grade</label>
                                <select value={formData.targetGrade} onChange={e => handleChange('targetGrade', e.target.value)} className={inputClass}>
                                    <option value="">Select Grade</option>
                                    <option>Play Group</option>
                                    <option>PP1</option>
                                    <option>PP2</option>
                                    <option>Grade 1</option>
                                    <option>Grade 2</option>
                                    <option>Grade 3</option>
                                    <option>Grade 4</option>
                                    <option>Grade 5</option>
                                    <option>Grade 6</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: STUDENT INFO */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-display font-bold text-xl text-gray-800">Student Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Child's Full Name</label>
                                <input type="text" value={formData.childName} onChange={e => handleChange('childName', e.target.value)} className={inputClass}/>
                            </div>
                            <div>
                                <label className={labelClass}>Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} className={inputClass}/>
                            </div>
                            <div>
                                <label className={labelClass}>Gender</label>
                                <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className={inputClass}>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: MEDICAL */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-display font-bold text-xl text-gray-800">Medical & Special Needs</h3>
                        
                        <div className="p-4 border border-gray-200 rounded-[12px]">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-bold text-gray-700">Does the child have any allergies?</span>
                                <input type="checkbox" checked={formData.hasAllergies} onChange={e => handleChange('hasAllergies', e.target.checked)} className="w-5 h-5 accent-brand-blue"/>
                            </label>
                            {formData.hasAllergies && (
                                <textarea 
                                    className="w-full mt-4 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-sky bg-gray-50 focus:bg-white" 
                                    placeholder="Please list allergies..."
                                    value={formData.allergyDetails}
                                    onChange={e => handleChange('allergyDetails', e.target.value)}
                                ></textarea>
                            )}
                        </div>

                        <div className="p-4 border border-gray-200 rounded-[12px]">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-bold text-gray-700">Any special needs or conditions?</span>
                                <input type="checkbox" checked={formData.hasSpecialNeeds} onChange={e => handleChange('hasSpecialNeeds', e.target.checked)} className="w-5 h-5 accent-brand-blue"/>
                            </label>
                            {formData.hasSpecialNeeds && (
                                <textarea 
                                    className="w-full mt-4 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-sky bg-gray-50 focus:bg-white" 
                                    placeholder="Please describe any learning support needs..."
                                    value={formData.specialNeedsDetails}
                                    onChange={e => handleChange('specialNeedsDetails', e.target.value)}
                                ></textarea>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 4: DOCUMENTS */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-display font-bold text-xl text-gray-800">Document Upload</h3>
                        <p className="text-gray-500 text-sm">Please upload clear scans or photos of the following.</p>

                        {[
                            { id: 'docBirthCert', label: 'Birth Certificate' },
                            { id: 'docReportCard', label: 'Previous Report Card' },
                            { id: 'docImmunization', label: 'Immunization Records' }
                        ].map((doc) => (
                            <div key={doc.id} className="border-2 border-dashed border-gray-200 rounded-[12px] p-6 flex flex-col items-center justify-center text-center hover:border-brand-sky transition-colors cursor-pointer" onClick={() => handleUpload(doc.id as keyof AdmissionApplication)}>
                                {formData[doc.id as keyof AdmissionApplication] ? (
                                    <div className="text-brand-green flex flex-col items-center gap-2">
                                        <Check size={32}/>
                                        <span className="font-bold text-sm">{doc.label} Uploaded</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center gap-2">
                                        <UploadCloud size={32}/>
                                        <span className="font-bold text-gray-600">{doc.label}</span>
                                        <span className="text-xs">Click to upload (PDF/JPG)</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 5: REVIEW */}
                {currentStep === 5 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-display font-bold text-xl text-gray-800">Review Application</h3>
                        <div className="bg-gray-50 p-6 rounded-[12px] border border-gray-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500 block">Parent</span> <span className="font-bold">{formData.parentName}</span></div>
                                <div><span className="text-gray-500 block">Contact</span> <span className="font-bold">{formData.parentEmail}</span></div>
                                <div><span className="text-gray-500 block">Child</span> <span className="font-bold">{formData.childName}</span></div>
                                <div><span className="text-gray-500 block">Target Grade</span> <span className="font-bold">{formData.targetGrade}</span></div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-brand-blue/5 rounded-[12px]">
                            <Lock size={16} className="text-brand-blue shrink-0 mt-1"/>
                            <p className="text-xs text-gray-600">
                                By submitting this application, I confirm that the information provided is accurate and I agree to the school's data processing policy.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-8 flex justify-between">
                    {currentStep > 1 && (
                        <button onClick={handleBack} className="px-6 h-12 border border-gray-200 rounded-[12px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                            <ChevronLeft size={18}/> Back
                        </button>
                    )}
                    {currentStep < 5 ? (
                        <button onClick={handleNext} className="ml-auto px-8 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-blue/90 flex items-center gap-2">
                            Next Step <ChevronRight size={18}/>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting} className="ml-auto px-8 h-12 bg-brand-green text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-green/90 flex items-center gap-2">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'} <Check size={18}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdmissionsWizard;
