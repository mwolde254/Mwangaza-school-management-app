
import React, { useState } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { UserRole } from '../types';
import { X, ChevronRight, ChevronLeft, User, Calendar, BookOpen, Users, Check, Search, Plus, UserPlus } from 'lucide-react';

interface StudentRegistrationWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'IDENTITY' | 'ACADEMIC' | 'GUARDIAN';

const StudentRegistrationWizard: React.FC<StudentRegistrationWizardProps> = ({ onClose, onSuccess }) => {
  const { registerStudent, users } = useStudentData();
  const [currentStep, setCurrentStep] = useState<Step>('IDENTITY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female',
    
    // Step 2
    admNo: '',
    grade: 'Grade 1',
    stream: 'East',
    enrollmentDate: new Date().toISOString().split('T')[0],

    // Step 3
    guardianMode: 'EXISTING' as 'EXISTING' | 'NEW' | 'SKIP',
    selectedParentId: '',
    newParentName: '',
    newParentEmail: '',
    newParentPhone: ''
  });

  // Search State for Existing Parents
  const [parentSearch, setParentSearch] = useState('');

  const filteredParents = users.filter(u => 
    u.role === UserRole.PARENT && 
    (u.name.toLowerCase().includes(parentSearch.toLowerCase()) || u.email.toLowerCase().includes(parentSearch.toLowerCase()))
  );

  const handleNext = () => {
    if (currentStep === 'IDENTITY') {
        if (!formData.fullName || !formData.dob) return; // Validation
        setCurrentStep('ACADEMIC');
    } else if (currentStep === 'ACADEMIC') {
        if (!formData.admNo || !formData.grade) return;
        setCurrentStep('GUARDIAN');
    }
  };

  const handleBack = () => {
    if (currentStep === 'ACADEMIC') setCurrentStep('IDENTITY');
    if (currentStep === 'GUARDIAN') setCurrentStep('ACADEMIC');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        await registerStudent(
            {
                name: formData.fullName,
                dob: formData.dob,
                gender: formData.gender,
                admissionNumber: formData.admNo,
                grade: formData.grade,
                stream: formData.stream,
                enrollmentDate: formData.enrollmentDate
            },
            formData.guardianMode === 'SKIP' ? null : {
                mode: formData.guardianMode,
                existingParentId: formData.selectedParentId,
                newParentDetails: {
                    name: formData.newParentName,
                    email: formData.newParentEmail,
                    phone: formData.newParentPhone
                }
            }
        );
        onSuccess();
        onClose();
    } catch (error) {
        console.error("Registration failed", error);
        // In a real app, handle error state
    } finally {
        setIsSubmitting(false);
    }
  };

  const generateAdmNo = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({ ...prev, admNo: `MW-${year}-${random}` }));
  };

  const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium text-gray-700 bg-white";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2";

  return (
    <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Progress */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
                <X size={20}/>
            </button>
            <h2 className="font-display font-bold text-2xl text-gray-800 mb-1">Register New Student</h2>
            <p className="text-gray-500 text-sm mb-6">Create a student record and link a guardian.</p>
            
            {/* Stepper */}
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                
                {[
                    { id: 'IDENTITY', label: 'Identity', icon: User },
                    { id: 'ACADEMIC', label: 'Academic', icon: BookOpen },
                    { id: 'GUARDIAN', label: 'Guardian', icon: Users }
                ].map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = 
                        (currentStep === 'ACADEMIC' && idx === 0) || 
                        (currentStep === 'GUARDIAN' && idx <= 1);
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center bg-gray-50 px-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                                isActive ? 'bg-brand-blue border-brand-blue text-white shadow-lg scale-110' :
                                isCompleted ? 'bg-brand-green border-brand-green text-white' :
                                'bg-white border-gray-200 text-gray-300'
                            }`}>
                                {isCompleted ? <Check size={16}/> : <step.icon size={16}/>}
                            </div>
                            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${isActive ? 'text-brand-blue' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
            
            {/* STEP 1: IDENTITY */}
            {currentStep === 'IDENTITY' && (
                <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Full Name</label>
                            <input 
                                type="text" 
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                className={inputClass} 
                                placeholder="e.g. Amani Kamau"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Date of Birth</label>
                            <input 
                                type="date" 
                                value={formData.dob}
                                onChange={e => setFormData({...formData, dob: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Gender</label>
                            <div className="flex gap-2 h-12">
                                {['Male', 'Female'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setFormData({...formData, gender: g as any})}
                                        className={`flex-1 rounded-lg font-bold text-sm border transition-all ${formData.gender === g ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Placeholder for Photo Upload */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mb-3"></div>
                        <span className="text-xs font-bold">Upload Student Photo (Optional)</span>
                    </div>
                </div>
            )}

            {/* STEP 2: ACADEMIC */}
            {currentStep === 'ACADEMIC' && (
                <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Admission Number</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.admNo}
                                    onChange={e => setFormData({...formData, admNo: e.target.value})}
                                    className={inputClass} 
                                    placeholder="MW-202X-XXX"
                                />
                                <button 
                                    onClick={generateAdmNo}
                                    className="absolute right-2 top-2 px-3 py-1 bg-gray-100 text-xs font-bold text-gray-600 rounded hover:bg-gray-200"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Enrollment Date</label>
                            <input 
                                type="date" 
                                value={formData.enrollmentDate}
                                onChange={e => setFormData({...formData, enrollmentDate: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Grade Level</label>
                            <select 
                                value={formData.grade}
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                                className={inputClass}
                            >
                                {['Play Group', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Stream / Class</label>
                            <select 
                                value={formData.stream}
                                onChange={e => setFormData({...formData, stream: e.target.value})}
                                className={inputClass}
                            >
                                {['East', 'West', 'North', 'South', 'Blue', 'Red'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: GUARDIAN */}
            {currentStep === 'GUARDIAN' && (
                <div className="space-y-6 animate-slide-up">
                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setFormData({...formData, guardianMode: 'EXISTING'})}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.guardianMode === 'EXISTING' ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}
                        >
                            Existing Parent
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, guardianMode: 'NEW'})}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.guardianMode === 'NEW' ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}
                        >
                            Create New
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, guardianMode: 'SKIP'})}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.guardianMode === 'SKIP' ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}
                        >
                            Link Later
                        </button>
                    </div>

                    {/* Option A: Existing Parent Search */}
                    {formData.guardianMode === 'EXISTING' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="Search Parent by Name or Email..." 
                                    value={parentSearch}
                                    onChange={e => setParentSearch(e.target.value)}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {filteredParents.length > 0 ? filteredParents.map(parent => (
                                    <div 
                                        key={parent.id} 
                                        onClick={() => setFormData({...formData, selectedParentId: parent.id})}
                                        className={`p-3 flex items-center justify-between cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${formData.selectedParentId === parent.id ? 'bg-brand-blue/5 border-l-4 border-l-brand-blue' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-grey flex items-center justify-center font-bold text-xs text-brand-blue">
                                                {parent.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{parent.name}</p>
                                                <p className="text-xs text-gray-500">{parent.email}</p>
                                            </div>
                                        </div>
                                        {formData.selectedParentId === parent.id && <Check size={16} className="text-brand-blue"/>}
                                    </div>
                                )) : (
                                    <p className="p-4 text-center text-xs text-gray-400 italic">No parents found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Option B: New Parent Form */}
                    {formData.guardianMode === 'NEW' && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Parent Name</label>
                                <input 
                                    type="text" 
                                    value={formData.newParentName}
                                    onChange={e => setFormData({...formData, newParentName: e.target.value})}
                                    className={inputClass}
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.newParentEmail}
                                        onChange={e => setFormData({...formData, newParentEmail: e.target.value})}
                                        className={inputClass}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={formData.newParentPhone}
                                        onChange={e => setFormData({...formData, newParentPhone: e.target.value})}
                                        className={inputClass}
                                        placeholder="07XX XXX XXX"
                                    />
                                </div>
                            </div>
                            <div className="p-3 bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg text-xs text-gray-600">
                                <span className="font-bold text-brand-yellow-600 block mb-1">Note:</span>
                                A welcome email with login instructions will be automatically sent to the new parent upon registration.
                            </div>
                        </div>
                    )}

                    {/* Option C: Skip */}
                    {formData.guardianMode === 'SKIP' && (
                        <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <UserPlus size={32} className="mx-auto text-gray-300 mb-3"/>
                            <p className="text-sm font-bold text-gray-600">Guardian Linking Skipped</p>
                            <p className="text-xs text-gray-400 mt-1">You can link a parent later from the Student Profile.</p>
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-gray-100 flex justify-between items-center">
            {currentStep !== 'IDENTITY' ? (
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 h-12 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                    <ChevronLeft size={18}/> Back
                </button>
            ) : (
                <div></div> // Spacer
            )}

            {currentStep !== 'GUARDIAN' ? (
                <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue/90 transition-all"
                >
                    Next: {currentStep === 'IDENTITY' ? 'Academic' : 'Guardian'} <ChevronRight size={18}/>
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 h-12 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating...' : 'Complete Registration'} <Check size={18}/>
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default StudentRegistrationWizard;
