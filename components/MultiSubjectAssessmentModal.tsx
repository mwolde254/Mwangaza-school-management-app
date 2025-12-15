
import React, { useState } from 'react';
import { Student } from '../types';
import { X, Check, Copy, MessageSquare, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface MultiSubjectAssessmentModalProps {
  student: Student;
  subjects: string[];
  onClose: () => void;
  onSave: (assessments: any[]) => Promise<void>;
}

const MultiSubjectAssessmentModal: React.FC<MultiSubjectAssessmentModalProps> = ({ student, subjects, onClose, onSave }) => {
  const [grades, setGrades] = useState<Record<string, { score: string, comment: string }>>({});
  const [generalComment, setGeneralComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (subject: string, score: string) => {
    // Limit to 0-100
    const num = parseInt(score);
    if (score !== '' && (isNaN(num) || num < 0 || num > 100)) return;

    setGrades(prev => ({
      ...prev,
      [subject]: { ...prev[subject], score }
    }));
  };

  const handleCommentChange = (subject: string, comment: string) => {
    setGrades(prev => ({
      ...prev,
      [subject]: { ...prev[subject], comment }
    }));
  };

  const applyGeneralComment = () => {
    if (!generalComment) return;
    const newGrades = { ...grades };
    subjects.forEach(subj => {
      newGrades[subj] = {
        score: newGrades[subj]?.score || '',
        comment: generalComment
      };
    });
    setGrades(newGrades);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const validAssessments = (Object.entries(grades) as [string, { score: string, comment: string }][])
      .filter(([_, data]) => data.score !== '')
      .map(([subject, data]) => ({
        studentId: student.id,
        subject,
        score: parseInt(data.score),
        total: 100, // Assuming base 100 for now
        comments: data.comment
      }));

    if (validAssessments.length > 0) {
        await onSave(validAssessments);
    }
    setIsSaving(false);
    onClose();
  };

  const gradedCount = (Object.values(grades) as { score: string, comment: string }[]).filter(g => g.score !== '').length;
  const progress = Math.round((gradedCount / subjects.length) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"/>
                    {/* Progress Ring Mini */}
                    <svg className="absolute -top-1 -left-1 w-14 h-14 transform -rotate-90 pointer-events-none">
                        <circle cx="28" cy="28" r="26" stroke="#f3f4f6" strokeWidth="3" fill="none"/>
                        <circle 
                            cx="28" cy="28" r="26" 
                            stroke="#059669" strokeWidth="3" fill="none" 
                            strokeDasharray="163.36" 
                            strokeDashoffset={163.36 * (1 - progress / 100)} 
                            strokeLinecap="round"
                            className="transition-all duration-500"
                        />
                    </svg>
                </div>
                <div>
                    <h3 className="font-display font-bold text-xl text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{student.admissionNumber}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</p>
                    <p className="text-brand-blue font-bold">{gradedCount} / {subjects.length} Subjects</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20}/>
                </button>
            </div>
        </div>

        {/* Quick Tools */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-400"/>
            <input 
                type="text" 
                placeholder="Type general comment here..." 
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-700"
            />
            <button 
                onClick={applyGeneralComment}
                disabled={!generalComment}
                className="text-xs font-bold text-brand-blue hover:bg-brand-blue/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Copy size={12}/> Apply to All
            </button>
        </div>

        {/* Subject List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {subjects.map((subject, idx) => {
                const isGraded = grades[subject]?.score !== '' && grades[subject]?.score !== undefined;
                return (
                    <div 
                        key={subject} 
                        className={`bg-white rounded-xl border p-4 transition-all shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center ${isGraded ? 'border-brand-green ring-1 ring-brand-green/20' : 'border-gray-200'}`}
                    >
                        <div className="flex-1 min-w-[150px]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${isGraded ? 'bg-brand-green' : 'bg-brand-blue'}`}></span>
                                <h4 className="font-bold text-gray-800">{subject}</h4>
                            </div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Max Score: 100</span>
                        </div>

                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="Score" 
                                    value={grades[subject]?.score || ''}
                                    onChange={(e) => handleScoreChange(subject, e.target.value)}
                                    className="w-full h-12 pl-4 pr-12 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none font-bold text-lg text-gray-800 transition-all placeholder:text-gray-300"
                                    tabIndex={idx + 1}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">/100</span>
                            </div>
                        </div>

                        <div className="flex-[2] w-full md:w-auto">
                            <div className="relative">
                                <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400"/>
                                <textarea 
                                    placeholder="Add remark..." 
                                    value={grades[subject]?.comment || ''}
                                    onChange={(e) => handleCommentChange(subject, e.target.value)}
                                    className="w-full h-12 py-3 pl-10 pr-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm text-gray-700 transition-all resize-none overflow-hidden"
                                    rows={1}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center z-10">
            <div className="text-sm text-gray-500">
                <span className="font-bold text-gray-800">{gradedCount}</span> subjects ready to save.
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 h-12 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={isSaving || gradedCount === 0}
                    className="px-8 h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><Check size={20}/> Save Assessments</>}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MultiSubjectAssessmentModal;
