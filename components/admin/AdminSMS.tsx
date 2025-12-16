
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { MessageSquare, FileText, Search, Check, Send, History, Loader2 } from 'lucide-react';

const inputClass = "w-full h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white";

const AdminSMS = () => {
  const { students, smsTemplates } = useStudentData();
  const [smsMessage, setSmsMessage] = useState('');
  const [smsAudienceType, setSmsAudienceType] = useState<'ALL' | 'GRADE' | 'INDIVIDUAL'>('ALL');
  const [smsTargetGrade, setSmsTargetGrade] = useState('');
  const [smsSearchTerm, setSmsSearchTerm] = useState('');
  const [showSmsConfirm, setShowSmsConfirm] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
  const approvedTemplates = useMemo(() => smsTemplates.filter(t => t.status === 'APPROVED'), [smsTemplates]);

  const targetedRecipients = useMemo(() => {
    if (smsAudienceType === 'ALL') return students;
    if (smsAudienceType === 'GRADE') return students.filter(s => s.grade === smsTargetGrade);
    if (smsAudienceType === 'INDIVIDUAL') {
        if (smsSearchTerm.length < 2) return [];
        return students.filter(s => 
            s.name.toLowerCase().includes(smsSearchTerm.toLowerCase()) || 
            s.admissionNumber.toLowerCase().includes(smsSearchTerm.toLowerCase())
        );
    }
    return [];
  }, [students, smsAudienceType, smsTargetGrade, smsSearchTerm]);

  const recipientCount = targetedRecipients.length;
  const smsCharCount = smsMessage.length;
  const smsSegments = Math.max(1, Math.ceil(smsCharCount / 160));
  const smsTotalCost = recipientCount * smsSegments * 0.8;
  const smsIsOverLimit = smsCharCount > 160;

  const handleTemplateSelect = (content: string) => { 
      setSmsMessage(content); 
      setShowTemplatePicker(false); 
  };

  const handleClearDraft = () => { 
      setSmsMessage(''); 
      setSmsAudienceType('ALL'); 
      setSmsTargetGrade(''); 
      setSmsSearchTerm(''); 
  };

  const handleSendSms = async () => {
    setIsSendingSms(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSendingSms(false);
    setShowSmsConfirm(false);
    setNotification({ message: 'Message scheduled for delivery.', type: 'success' });
    setTimeout(() => { setNotification(null); handleClearDraft(); }, 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] animate-slide-up relative">
        {notification && (
            <div className="absolute top-0 right-0 z-50 px-6 py-4 bg-brand-green text-white rounded-[12px] shadow-xl flex items-center gap-3 animate-slide-up">
                <Check size={20}/> <span className="font-bold">{notification.message}</span>
            </div>
        )}

        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[12px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-brand-blue"/> Compose Broadcast
                    </h3>
                    {approvedTemplates.length > 0 && (
                        <button onClick={() => setShowTemplatePicker(!showTemplatePicker)} className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                            <FileText size={14}/> Use Template
                        </button>
                    )}
                </div>
                
                {showTemplatePicker && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {approvedTemplates.map(t => (
                            <button key={t.id} onClick={() => handleTemplateSelect(t.content)} className="text-left p-2 bg-white border border-gray-200 rounded hover:border-brand-sky hover:shadow-sm text-xs">
                                <span className="font-bold text-gray-700 block">{t.name}</span>
                                <span className="text-gray-400 truncate block">{t.content.substring(0, 30)}...</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Audience</label>
                        <div className="flex gap-2">
                            {['ALL', 'GRADE', 'INDIVIDUAL'].map((type) => (
                                <button key={type} onClick={() => setSmsAudienceType(type as any)} className={`px-4 py-2 rounded-[6px] text-sm font-bold transition-all border ${smsAudienceType === type ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                    {type === 'ALL' ? 'Whole School' : type === 'GRADE' ? 'Specific Grade' : 'Individual'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {smsAudienceType === 'GRADE' && (
                        <div className="animate-fade-in"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Grade</label><select value={smsTargetGrade} onChange={(e) => setSmsTargetGrade(e.target.value)} className={inputClass}><option value="">-- Select Grade --</option>{uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    )}
                    {smsAudienceType === 'INDIVIDUAL' && (
                        <div className="animate-fade-in"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Student</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="text" value={smsSearchTerm} onChange={(e) => setSmsSearchTerm(e.target.value)} className={`${inputClass} pl-10`} placeholder="Name or Admission Number..."/></div>{targetedRecipients.length > 0 && smsSearchTerm && <div className="mt-2 text-xs text-brand-green font-bold flex items-center gap-1"><Check size={12}/> {targetedRecipients[0].name} selected</div>}</div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Content</label>
                        <textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} className="w-full h-32 p-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white resize-none" placeholder="Type your message here..."></textarea>
                        <div className="flex justify-between items-center mt-2"><span className={`text-xs font-bold ${smsIsOverLimit ? 'text-brand-red' : 'text-gray-400'}`}>{smsCharCount} chars ({smsSegments} SMS)</span><span className="text-xs font-bold text-gray-500">Est. Cost: <span className="text-brand-blue">KES {smsTotalCost.toFixed(2)}</span></span></div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3"><button onClick={handleClearDraft} className="px-6 h-12 border border-gray-200 text-gray-600 rounded-[12px] font-bold hover:bg-gray-50">Clear</button><button onClick={() => setShowSmsConfirm(true)} disabled={!smsMessage || (smsAudienceType === 'GRADE' && !smsTargetGrade) || (smsAudienceType === 'INDIVIDUAL' && targetedRecipients.length === 0)} className="px-8 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Send size={18}/> Review & Send</button></div>
                </div>
            </div>
        </div>
        
        <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-display font-bold text-gray-800 flex items-center gap-2"><History size={18} className="text-gray-500"/> Recent Blasts</h3></div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">{[{ id: 1, date: 'Today, 10:30 AM', target: 'Grade 4 Parents', status: 'Delivered', msg: 'Reminder: Science Trip tomorrow...' }, { id: 2, date: 'Yesterday, 4:00 PM', target: 'Whole School', status: 'Delivered', msg: 'School closes at 3PM on Friday...' }, { id: 3, date: 'Oct 24, 9:00 AM', target: 'Staff', status: 'Failed', msg: 'Meeting rescheduled to 10AM.' }].map(log => (<div key={log.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"><div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase">{log.date}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.status === 'Delivered' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>{log.status}</span></div><p className="text-xs font-bold text-brand-blue mb-1">{log.target}</p><p className="text-xs text-gray-600 line-clamp-2">"{log.msg}"</p></div>))}</div>
        </div>

        {showSmsConfirm && <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100"><h3 className="font-display font-bold text-xl text-brand-blue mb-4">Confirm Broadcast</h3><div className="space-y-3 mb-6 text-sm text-gray-600"><p>You are about to send a message to <span className="font-bold text-gray-800">{recipientCount} recipients</span>.</p><p>Estimated Cost: <span className="font-bold text-gray-800">KES {smsTotalCost.toFixed(2)}</span></p><div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs italic text-gray-500">"{smsMessage}"</div></div><div className="flex gap-3"><button onClick={() => setShowSmsConfirm(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-[6px] font-bold hover:bg-gray-50">Cancel</button><button onClick={handleSendSms} disabled={isSendingSms} className="flex-1 h-10 bg-brand-blue text-white rounded-[6px] font-bold shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2">{isSendingSms ? <Loader2 className="animate-spin" size={16}/> : 'Confirm Send'}</button></div></div></div>}
    </div>
  );
};

export default AdminSMS;
