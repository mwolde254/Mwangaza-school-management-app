
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { UserRole, SmsCategory, SmsTemplate, SmsTemplateStatus } from '../types';
import { 
  User, Lock, Bell, Globe, Moon, Shield, CreditCard, 
  BookOpen, MessageSquare, Users, Calendar, Save, Check,
  Smartphone, Mail, AlertTriangle, Loader2, Link as LinkIcon, Unlink, Plus, AlertCircle, LayoutTemplate, Trash2, Eye, EyeOff, X, FileText, Send, Edit2
} from 'lucide-react';
import { db } from '../services/db';
import UserManagement from '../components/UserManagement';

type SettingsTab = 'PROFILE' | 'NOTIFICATIONS' | 'REGION' | 'APPEARANCE' | 'ADMIN_SYSTEM' | 'ADMIN_ACCESS' | 'ADMIN_FINANCE' | 'TEMPLATES' | 'TEACHER_CLASS' | 'TEACHER_MSG' | 'PARENT_CHILD' | 'PARENT_FEES';

interface NotificationEvent {
  id: string;
  label: string;
  app: boolean;
  email: boolean;
  sms: boolean;
}

interface NotificationState {
  global: { app: boolean; email: boolean; sms: boolean };
  categories: {
    financial: NotificationEvent[];
    academic: NotificationEvent[];
    system: NotificationEvent[];
    communication: NotificationEvent[];
  };
}

const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { students, smsTemplates, addSmsTemplate, updateSmsTemplate, deleteSmsTemplate } = useStudentData(); 
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || ''); 
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference States
  const [theme, setTheme] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>(user?.preferences?.theme || 'LIGHT');
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'KES');
  const [language, setLanguage] = useState(user?.preferences?.language || 'English');
  const [timezone, setTimezone] = useState(user?.preferences?.timezone || 'EAT');

  // Teacher Specific
  const [defaultClass, setDefaultClass] = useState(user?.preferences?.teacherDefaultClass || '');

  // Parent Specific
  const [feeThreshold, setFeeThreshold] = useState(user?.preferences?.parentFeeThreshold?.toString() || '1000');

  // Admin Finance Logic
  const [apiKey, setApiKey] = useState(user?.preferences?.adminFinance?.apiKey || '');
  const [apiSecret, setApiSecret] = useState(user?.preferences?.adminFinance?.apiSecret || '');
  const [paymentProvider, setPaymentProvider] = useState(user?.preferences?.adminFinance?.provider || 'MPESA');

  // Parent Child Logic
  const [linkToken, setLinkToken] = useState('');
  const [linkStatus, setLinkStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // --- TEMPLATE EDITOR STATE ---
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<SmsCategory>('General');
  const [tplContent, setTplContent] = useState('');
  const [tplPreviewMode, setTplPreviewMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Comprehensive Notification State
  const [notifConfig, setNotifConfig] = useState<NotificationState>(user?.preferences?.notifications || {
    global: { app: true, email: true, sms: true },
    categories: {
      financial: [
        { id: 'fee', label: 'Fee Payment Reminders', app: true, email: true, sms: true },
        { id: 'pay_rec', label: 'Large Payment Received', app: true, email: true, sms: false },
        { id: 'recon', label: 'Reconciliation Failure', app: true, email: true, sms: false },
      ],
      academic: [
        { id: 'comp', label: 'New Competency Recorded', app: true, email: false, sms: false },
        { id: 'avg', label: 'Class Average Alerts', app: true, email: true, sms: false },
        { id: 'grade', label: 'Grading Deadlines', app: true, email: true, sms: true },
      ],
      system: [
        { id: 'maint', label: 'Server Maintenance', app: true, email: true, sms: true },
        { id: 'new_user', label: 'New User Accounts', app: true, email: false, sms: false },
        { id: 'leave', label: 'Pending Leave Requests', app: true, email: true, sms: false },
      ],
      communication: [
        { id: 'ann', label: 'School Announcements', app: true, email: true, sms: true },
        { id: 'dm', label: 'Direct Messages', app: true, email: true, sms: false },
      ]
    }
  });

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();

  const handleSaveProfile = async () => {
    if (password && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsSaving(true);
    // In a real backend, password would be handled securely
    await updateProfile({ 
        name, 
        phoneNumber: phone,
        // Mocking password update logic if implemented in AuthContext
        ...(password ? { password } : {}) 
    });
    setPassword('');
    setConfirmPassword('');
    setIsSaving(false);
    showSaveSuccess();
  };

  const handleSavePreferences = async (section: 'NOTIFICATIONS' | 'REGION' | 'APPEARANCE' | 'ADMIN_FINANCE' | 'TEACHER' | 'PARENT') => {
    setIsSaving(true);
    const existingPrefs = user?.preferences || {};
    let updates = {};

    switch (section) {
        case 'NOTIFICATIONS':
            updates = { notifications: notifConfig };
            break;
        case 'REGION':
            updates = { language, currency, timezone };
            break;
        case 'APPEARANCE':
            updates = { theme };
            break;
        case 'ADMIN_FINANCE':
            updates = { adminFinance: { apiKey, apiSecret, provider: paymentProvider } };
            break;
        case 'TEACHER':
            updates = { teacherDefaultClass: defaultClass };
            break;
        case 'PARENT':
            updates = { parentFeeThreshold: parseInt(feeThreshold) };
            break;
    }

    await updateProfile({ preferences: { ...existingPrefs, ...updates } });
    
    setIsSaving(false);
    setIsDirty(false);
    showSaveSuccess();
  };

  const showSaveSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleGlobal = (channel: 'app' | 'email' | 'sms') => {
    setNotifConfig(prev => ({
      ...prev,
      global: { ...prev.global, [channel]: !prev.global[channel] }
    }));
    setIsDirty(true);
  };

  const toggleEvent = (category: keyof NotificationState['categories'], eventIndex: number, channel: 'app' | 'email' | 'sms') => {
    setNotifConfig(prev => {
      const newCategories = { ...prev.categories };
      const event = newCategories[category][eventIndex];
      event[channel] = !event[channel];
      return { ...prev, categories: newCategories };
    });
    setIsDirty(true);
  };

  const handleLinkChild = async () => {
    if (linkToken.length < 3) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate verification
    
    // Logic: Find student by admission number (acting as token)
    const foundStudent = students.find(s => s.admissionNumber.toLowerCase() === linkToken.toLowerCase());
    
    if (foundStudent) {
        const currentIds = user?.linkedStudentIds || [];
        if (!currentIds.includes(foundStudent.id)) {
            await updateProfile({ linkedStudentIds: [...currentIds, foundStudent.id] });
            setLinkStatus('SUCCESS');
        } else {
            setLinkStatus('ERROR'); // Already linked
        }
    } else {
        setLinkStatus('ERROR'); // Invalid admission number
    }
    
    setIsSaving(false);
    setLinkToken('');
    setTimeout(() => setLinkStatus('IDLE'), 3000);
  };

  const handleUnlinkChild = async (childId: string) => {
      if(!confirm("Are you sure you want to remove this student from your profile?")) return;
      setIsSaving(true);
      const currentIds = user?.linkedStudentIds || [];
      const newIds = currentIds.filter(id => id !== childId);
      await updateProfile({ linkedStudentIds: newIds });
      setIsSaving(false);
      showSaveSuccess();
  }

  // --- Template Handlers ---
  const resetTemplateForm = () => {
    setTplName(''); 
    setTplCategory('General'); 
    setTplContent(''); 
    setEditingTemplateId(null);
    setTplPreviewMode(false);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleOpenTemplateModal = (template?: SmsTemplate) => {
    if (template) {
        setEditingTemplateId(template.id);
        setTplName(template.name);
        setTplCategory(template.category);
        setTplContent(template.content);
    } else {
        resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const handleInsertVariable = (variable: string) => {
    const varText = `{{${variable}}}`;
    if (contentRef.current) {
        const start = contentRef.current.selectionStart;
        const end = contentRef.current.selectionEnd;
        const text = tplContent;
        const newText = text.substring(0, start) + ` ${varText} ` + text.substring(end);
        setTplContent(newText);
        
        // Restore focus and cursor position after React re-render
        setTimeout(() => {
            if(contentRef.current) {
                contentRef.current.focus();
                const newCursorPos = start + varText.length + 2;
                contentRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    } else {
        setTplContent(prev => prev + ` ${varText} `);
    }
  };

  const handleSaveTemplate = async (status: SmsTemplateStatus) => {
    if(!tplName || !tplContent) return;
    setIsSaving(true);

    if (editingTemplateId) {
        await updateSmsTemplate(editingTemplateId, {
            name: tplName,
            category: tplCategory,
            content: tplContent,
            status: status
        });
    } else {
        await addSmsTemplate({
            name: tplName,
            category: tplCategory,
            content: tplContent,
            status: status,
            createdBy: user?.id || 'unknown'
        });
    }

    setIsSaving(false);
    setShowTemplateModal(false);
    resetTemplateForm();
    showSaveSuccess();
  };

  const handlePrincipalAction = async (action: 'APPROVE' | 'REJECT') => {
      if (!editingTemplateId) return;
      
      setIsSaving(true);
      if (action === 'APPROVE') {
          await updateSmsTemplate(editingTemplateId, { status: 'APPROVED' });
      } else {
          await updateSmsTemplate(editingTemplateId, { status: 'REJECTED', rejectionReason: rejectReason });
      }
      setIsSaving(false);
      setShowTemplateModal(false);
      resetTemplateForm();
      showSaveSuccess();
  };

  const handleDeleteTemplate = async (id: string) => {
    if(confirm('Delete this template?')) {
        await deleteSmsTemplate(id);
        showSaveSuccess();
    }
  };

  const getPreviewText = (text: string) => {
    return text
        .replace(/{{Student Name}}/g, "John Doe")
        .replace(/{{Parent Name}}/g, "Mr. Doe")
        .replace(/{{Class}}/g, "Grade 4")
        .replace(/{{Fee Balance}}/g, "15,000")
        .replace(/{{Admission No}}/g, "ADM-2023-001");
  };

  const getStatusColor = (status: SmsTemplateStatus) => {
      switch(status) {
          case 'APPROVED': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
          case 'PENDING_APPROVAL': return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
          case 'REJECTED': return 'bg-brand-red/10 text-brand-red border-brand-red/20';
          default: return 'bg-gray-100 text-gray-500 border-gray-200';
      }
  };

  // --- Components ---

  const NavItem = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: React.ElementType }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all ${
        activeTab === id 
        ? 'bg-brand-blue text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType, title: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
      <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
        <Icon size={24} />
      </div>
      <h3 className="font-display font-bold text-xl text-gray-800">{title}</h3>
    </div>
  );

  const Checkbox = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled: boolean }) => (
    <div 
      onClick={!disabled ? onChange : undefined}
      className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
        disabled 
          ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
          : checked 
            ? 'bg-brand-green border-brand-green' 
            : 'bg-white border-gray-300 hover:border-brand-sky'
      }`}
    >
      {checked && <Check size={12} className={disabled ? 'text-gray-400' : 'text-white'} />}
    </div>
  );

  const NotificationCard = ({ 
    title, 
    events, 
    category,
    color 
  }: { 
    title: string, 
    events: NotificationEvent[], 
    category: keyof NotificationState['categories'],
    color: string 
  }) => (
    <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${color}`}>
        <h3 className="font-display font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-12 gap-4 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
           <div className="col-span-6">Alert Event</div>
           <div className="col-span-2 text-center flex items-center justify-center gap-1"><Smartphone size={12}/> App</div>
           <div className="col-span-2 text-center flex items-center justify-center gap-1"><Mail size={12}/> Email</div>
           <div className="col-span-2 text-center flex items-center justify-center gap-1"><MessageSquare size={12}/> SMS</div>
        </div>
        <div className="space-y-4">
           {events.map((evt, idx) => (
             <div key={evt.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 text-sm font-medium text-gray-700">{evt.label}</div>
                <div className="col-span-2 flex justify-center">
                   <Checkbox 
                      checked={evt.app} 
                      onChange={() => toggleEvent(category, idx, 'app')} 
                      disabled={!notifConfig.global.app} 
                   />
                </div>
                <div className="col-span-2 flex justify-center">
                   <Checkbox 
                      checked={evt.email} 
                      onChange={() => toggleEvent(category, idx, 'email')} 
                      disabled={!notifConfig.global.email} 
                   />
                </div>
                <div className="col-span-2 flex justify-center">
                   <Checkbox 
                      checked={evt.sms} 
                      onChange={() => toggleEvent(category, idx, 'sms')} 
                      disabled={!notifConfig.global.sms} 
                   />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const inputClass = "w-full h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white";

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[600px] bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in relative">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-brand-grey p-4 space-y-2 border-r border-gray-100 overflow-y-auto">
        <div className="px-4 py-2 mb-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">General</h4>
        </div>
        <NavItem id="PROFILE" label="Profile & Security" icon={User} />
        <NavItem id="NOTIFICATIONS" label="Notifications" icon={Bell} />
        <NavItem id="REGION" label="Language & Region" icon={Globe} />
        <NavItem id="APPEARANCE" label="App Appearance" icon={Moon} />

        {/* Role Specific Modules */}
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER || user?.role === UserRole.PRINCIPAL) && (
          <>
            <div className="px-4 py-2 mb-2 mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administration</h4>
            </div>
            {user?.role === UserRole.ADMIN && (
                <>
                    <NavItem id="ADMIN_SYSTEM" label="System Config" icon={CreditCard} />
                    <NavItem id="ADMIN_ACCESS" label="Access Control" icon={Shield} />
                    <NavItem id="ADMIN_FINANCE" label="Payment Gateways" icon={CreditCard} />
                </>
            )}
            <NavItem id="TEMPLATES" label="Communication Templates" icon={LayoutTemplate} />
          </>
        )}

        {user?.role === UserRole.TEACHER && (
          <>
            <div className="px-4 py-2 mb-2 mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Classroom</h4>
            </div>
            <NavItem id="TEACHER_CLASS" label="Teaching Defaults" icon={BookOpen} />
          </>
        )}

        {user?.role === UserRole.PARENT && (
          <>
            <div className="px-4 py-2 mb-2 mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Family</h4>
            </div>
            <NavItem id="PARENT_CHILD" label="Child Access" icon={Users} />
            <NavItem id="PARENT_FEES" label="Financial Alerts" icon={Calendar} />
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
        
        {/* PROFILE */}
        {activeTab === 'PROFILE' && (
          <div className="max-w-2xl animate-slide-up">
            <SectionTitle icon={User} title="Profile & Security" />
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                <div className="flex gap-2">
                    <input type="email" value={email} disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} />
                    <button className="px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50" onClick={() => alert("Please contact admin to change email")}>
                        Request Change
                    </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={16}/> Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Password</label>
                     <input 
                       type="password" 
                       className={inputClass} 
                       placeholder="••••••••" 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm Password</label>
                     <input 
                        type="password" 
                        className={inputClass} 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                     />
                   </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'NOTIFICATIONS' && (
            <div className="max-w-3xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <SectionTitle icon={Bell} title="Notification Preferences" />
                    <button 
                        onClick={() => handleSavePreferences('NOTIFICATIONS')}
                        disabled={!isDirty || isSaving}
                        className="px-6 py-2 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-[12px] p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="font-bold text-brand-blue text-sm mb-1">Global Channels</h4>
                        <p className="text-xs text-gray-600">Quickly toggle communication channels for all alerts.</p>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs font-bold text-gray-600">App Push</span>
                            <div 
                                onClick={() => toggleGlobal('app')}
                                className={`w-10 h-6 rounded-full p-1 transition-colors ${notifConfig.global.app ? 'bg-brand-blue' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifConfig.global.app ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs font-bold text-gray-600">Email</span>
                            <div 
                                onClick={() => toggleGlobal('email')}
                                className={`w-10 h-6 rounded-full p-1 transition-colors ${notifConfig.global.email ? 'bg-brand-blue' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifConfig.global.email ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs font-bold text-gray-600">SMS</span>
                            <div 
                                onClick={() => toggleGlobal('sms')}
                                className={`w-10 h-6 rounded-full p-1 transition-colors ${notifConfig.global.sms ? 'bg-brand-blue' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifConfig.global.sms ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>

                <NotificationCard 
                    title="Financial Alerts" 
                    category="financial" 
                    events={notifConfig.categories.financial} 
                    color="bg-brand-green/5 text-brand-green"
                />
                <NotificationCard 
                    title="Academic Updates" 
                    category="academic" 
                    events={notifConfig.categories.academic} 
                    color="bg-brand-blue/5 text-brand-blue"
                />
                <NotificationCard 
                    title="System & Security" 
                    category="system" 
                    events={notifConfig.categories.system} 
                    color="bg-brand-red/5 text-brand-red"
                />
            </div>
        )}

        {/* REGION & LANGUAGE */}
        {activeTab === 'REGION' && (
            <div className="max-w-2xl animate-slide-up">
                <SectionTitle icon={Globe} title="Language & Region" />
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                            <option>English</option>
                            <option>Kiswahili</option>
                            <option>French</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Currency Format</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                            <option value="KES">Kenyan Shilling (KES)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time Zone</label>
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
                            <option value="EAT">East Africa Time (EAT)</option>
                            <option value="GMT">Greenwich Mean Time (GMT)</option>
                            <option value="EST">Eastern Standard Time (EST)</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={() => handleSavePreferences('REGION')}
                            disabled={isSaving}
                            className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90"
                        >
                            {isSaving ? 'Saving...' : 'Update Region'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* APPEARANCE */}
        {activeTab === 'APPEARANCE' && (
            <div className="max-w-2xl animate-slide-up">
                <SectionTitle icon={Moon} title="Appearance Settings" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        onClick={() => setTheme('LIGHT')}
                        className={`p-6 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-3 transition-all ${theme === 'LIGHT' ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 hover:border-brand-sky'}`}
                    >
                        <div className="w-16 h-12 bg-white border border-gray-200 rounded shadow-sm"></div>
                        <span className="font-bold text-sm text-gray-700">Light Mode</span>
                    </div>
                    <div 
                        onClick={() => setTheme('DARK')}
                        className={`p-6 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-3 transition-all ${theme === 'DARK' ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 hover:border-brand-sky'}`}
                    >
                        <div className="w-16 h-12 bg-gray-800 border border-gray-700 rounded shadow-sm"></div>
                        <span className="font-bold text-sm text-gray-700">Dark Mode</span>
                    </div>
                    <div 
                        onClick={() => setTheme('SYSTEM')}
                        className={`p-6 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-3 transition-all ${theme === 'SYSTEM' ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 hover:border-brand-sky'}`}
                    >
                        <div className="w-16 h-12 bg-gradient-to-r from-white to-gray-800 border border-gray-200 rounded shadow-sm"></div>
                        <span className="font-bold text-sm text-gray-700">System Default</span>
                    </div>
                </div>
                <div className="pt-8 flex justify-end">
                    <button 
                        onClick={() => handleSavePreferences('APPEARANCE')}
                        disabled={isSaving}
                        className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90"
                    >
                        {isSaving ? 'Saving...' : 'Apply Theme'}
                    </button>
                </div>
            </div>
        )}

        {/* ADMIN FINANCE */}
        {activeTab === 'ADMIN_FINANCE' && (
            <div className="max-w-2xl animate-slide-up">
                <SectionTitle icon={CreditCard} title="Payment Gateways" />
                <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-brand-yellow shrink-0 mt-0.5"/>
                    <p className="text-sm text-gray-700">
                        Sensitive Credentials. Ensure these keys are kept private. 
                        Changes here affect all transaction processing immediately.
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Primary Provider</label>
                        <select value={paymentProvider} onChange={(e) => setPaymentProvider(e.target.value)} className={inputClass}>
                            <option value="MPESA">M-Pesa (Daraja API)</option>
                            <option value="STRIPE">Stripe</option>
                            <option value="PAYPAL">PayPal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Consumer Key</label>
                        <div className="relative">
                            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} placeholder="****************"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Consumer Secret</label>
                        <div className="relative">
                            <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className={inputClass} placeholder="****************"/>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={() => handleSavePreferences('ADMIN_FINANCE')}
                            disabled={isSaving}
                            className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90"
                        >
                            {isSaving ? 'Saving...' : 'Update Keys'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ACCESS CONTROL */}
        {activeTab === 'ADMIN_ACCESS' && (
            <UserManagement />
        )}

        {/* COMMUNICATION TEMPLATES */}
        {activeTab === 'TEMPLATES' && (
            <div className="max-w-4xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <SectionTitle icon={LayoutTemplate} title="SMS Templates" />
                    <button 
                        onClick={() => handleOpenTemplateModal()}
                        className="px-4 py-2 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center gap-2"
                    >
                        <Plus size={16}/> Create New Template
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {smsTemplates.map(tpl => {
                        const canEdit = user?.role === UserRole.ADMIN || tpl.createdBy === user?.id; // Only Admin or Creator can delete/edit drafts
                        const isPrincipal = user?.role === UserRole.PRINCIPAL;
                        const canReview = isPrincipal && tpl.status === 'PENDING_APPROVAL';

                        return (
                            <div key={tpl.id} className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col h-full group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-display uppercase tracking-wider border ${getStatusColor(tpl.status)}`}>
                                        {tpl.status.replace('_', ' ')}
                                    </span>
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleDeleteTemplate(tpl.id)}
                                            className="text-gray-300 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    )}
                                </div>
                                <h4 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{tpl.name}</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">{tpl.category}</span>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-3 flex-1">{tpl.content}</p>
                                
                                <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                                    {(canEdit || canReview) ? (
                                        <button 
                                            onClick={() => handleOpenTemplateModal(tpl)}
                                            className="text-xs font-bold text-brand-blue flex items-center gap-1 hover:underline"
                                        >
                                            <Edit2 size={12}/> {canReview ? 'Review' : 'Edit'}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400">Read Only</span>
                                    )}
                                    <span className="text-[10px] text-gray-400">{tpl.content.length} chars</span>
                                </div>
                            </div>
                        );
                    })}
                    {smsTemplates.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 italic bg-gray-50 rounded-[12px]">
                            No templates created yet.
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* TEACHER DEFAULTS */}
        {activeTab === 'TEACHER_CLASS' && (
            <div className="max-w-2xl animate-slide-up">
                <SectionTitle icon={BookOpen} title="Classroom Defaults" />
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Default Class View</label>
                        <select value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} className={inputClass}>
                            <option value="">Select Default...</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">This class will load automatically on your dashboard.</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={() => handleSavePreferences('TEACHER')}
                            disabled={isSaving}
                            className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90"
                        >
                            {isSaving ? 'Saving...' : 'Save Default'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* PARENT CHILD LINKING */}
        {activeTab === 'PARENT_CHILD' && (
            <div className="max-w-3xl animate-slide-up">
                <SectionTitle icon={Users} title="Linked Students" />
                
                {/* Existing Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {students.filter(s => user?.linkedStudentIds?.includes(s.id)).map(student => (
                        <div key={student.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-brand-grey" alt=""/>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                                    <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleUnlinkChild(student.id)}
                                className="p-2 text-gray-300 hover:text-brand-red rounded-lg transition-colors"
                                title="Unlink Student"
                            >
                                <Unlink size={18}/>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Link */}
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                    <h4 className="font-bold text-gray-700 text-sm mb-4">Link a New Child</h4>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input 
                                type="text" 
                                placeholder="Enter Student Admission Number" 
                                value={linkToken}
                                onChange={(e) => setLinkToken(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <button 
                            onClick={handleLinkChild}
                            disabled={isSaving}
                            className="px-6 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><LinkIcon size={18}/> Link Child</>}
                        </button>
                    </div>
                    {linkStatus === 'ERROR' && (
                        <div className="mt-3 flex items-center gap-2 text-brand-red text-sm font-bold animate-fade-in">
                            <AlertCircle size={16}/> Student not found or already linked. Check Admission Number.
                        </div>
                    )}
                    {linkStatus === 'SUCCESS' && (
                        <div className="mt-3 flex items-center gap-2 text-brand-green text-sm font-bold animate-fade-in">
                            <Check size={16}/> Student linked successfully!
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* PARENT FINANCIAL ALERTS */}
        {activeTab === 'PARENT_FEES' && (
            <div className="max-w-2xl animate-slide-up">
                <SectionTitle icon={Calendar} title="Financial Alerts" />
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Low Balance Threshold (KES)</label>
                        <input 
                            type="number" 
                            value={feeThreshold} 
                            onChange={(e) => setFeeThreshold(e.target.value)} 
                            className={inputClass} 
                        />
                        <p className="text-xs text-gray-400 mt-1">Receive an alert when fee balance drops below this amount.</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={() => handleSavePreferences('PARENT')}
                            disabled={isSaving}
                            className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow hover:bg-brand-blue/90"
                        >
                            {isSaving ? 'Saving...' : 'Update Threshold'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* TEMPLATE EDITOR MODAL */}
        {showTemplateModal && (
            <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setShowTemplateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
                    
                    <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">
                        {editingTemplateId ? 'Edit Template' : 'Create Template'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Manage reusable message content.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Template Name</label>
                            <input 
                                type="text" 
                                value={tplName}
                                onChange={(e) => setTplName(e.target.value)}
                                className={inputClass}
                                placeholder="e.g. Fee Reminder Term 2"
                                disabled={user?.role === UserRole.PRINCIPAL && editingTemplateId !== null} // Principal reviews only
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                            <select 
                                value={tplCategory} 
                                onChange={(e) => setTplCategory(e.target.value as SmsCategory)}
                                className={inputClass}
                                disabled={user?.role === UserRole.PRINCIPAL && editingTemplateId !== null}
                            >
                                <option value="General">General</option>
                                <option value="Fees">Fees & Finance</option>
                                <option value="Exams">Academics / Exams</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Transport">Transport</option>
                            </select>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Message Body</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setTplPreviewMode(!tplPreviewMode)}
                                        className="text-xs font-bold text-brand-sky flex items-center gap-1 hover:underline"
                                    >
                                        {tplPreviewMode ? <><EyeOff size={12}/> Edit</> : <><Eye size={12}/> Preview</>}
                                    </button>
                                </div>
                            </div>

                            {!tplPreviewMode ? (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 self-center">Insert:</span>
                                        {['Student Name', 'Parent Name', 'Class', 'Fee Balance', 'Admission No'].map(v => (
                                            <button 
                                                key={v}
                                                onClick={() => handleInsertVariable(v)}
                                                disabled={user?.role === UserRole.PRINCIPAL && editingTemplateId !== null}
                                                className="px-2 py-1 rounded-full bg-brand-sky/10 text-brand-blue text-xs font-bold hover:bg-brand-sky/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea 
                                        ref={contentRef}
                                        value={tplContent}
                                        onChange={(e) => setTplContent(e.target.value)}
                                        className="w-full h-32 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none resize-none font-medium text-gray-700 disabled:bg-gray-50 disabled:text-gray-500"
                                        placeholder="Type your message here..."
                                        disabled={user?.role === UserRole.PRINCIPAL && editingTemplateId !== null}
                                    />
                                    <div className="text-right mt-1">
                                        <span className={`text-xs font-bold ${tplContent.length > 160 ? 'text-brand-yellow' : 'text-gray-400'}`}>
                                            {tplContent.length} chars ({Math.ceil(tplContent.length / 160)} SMS)
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-32 p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm overflow-y-auto text-gray-600">
                                    {getPreviewText(tplContent)}
                                </div>
                            )}
                        </div>

                        {/* Workflow Actions */}
                        <div className="pt-4 flex justify-between gap-3 border-t border-gray-100">
                            {/* Standard Actions (Cancel) */}
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 h-12 border border-gray-200 text-gray-600 rounded-[12px] font-bold hover:bg-gray-50">Cancel</button>
                            
                            <div className="flex gap-3">
                                {/* PRINCIPAL APPROVAL ACTIONS */}
                                {user?.role === UserRole.PRINCIPAL && editingTemplateId ? (
                                    <>
                                        {!showRejectInput ? (
                                            <>
                                                <button 
                                                    onClick={() => setShowRejectInput(true)}
                                                    className="px-4 h-12 bg-brand-red/10 text-brand-red rounded-[12px] font-bold hover:bg-brand-red/20"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => handlePrincipalAction('APPROVE')}
                                                    disabled={isSaving}
                                                    className="px-6 h-12 bg-brand-green text-white rounded-[12px] font-bold shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 flex items-center gap-2"
                                                >
                                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <><Check size={18}/> Approve</>}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col gap-2 w-full animate-fade-in">
                                                <input 
                                                    type="text" 
                                                    placeholder="Reason for rejection..." 
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    className="h-10 px-3 rounded-lg border border-brand-red/30 text-sm w-full"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setShowRejectInput(false)} className="text-xs text-gray-500 font-bold">Cancel</button>
                                                    <button 
                                                        onClick={() => handlePrincipalAction('REJECT')}
                                                        disabled={!rejectReason}
                                                        className="px-3 py-1 bg-brand-red text-white text-xs font-bold rounded"
                                                    >
                                                        Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* ADMIN / TEACHER ACTIONS */
                                    <>
                                        <button 
                                            onClick={() => handleSaveTemplate('DRAFT')}
                                            disabled={isSaving || !tplName || !tplContent}
                                            className="px-4 h-12 text-brand-blue font-bold hover:bg-brand-blue/5 rounded-[12px]"
                                        >
                                            Save Draft
                                        </button>
                                        <button 
                                            onClick={() => handleSaveTemplate('PENDING_APPROVAL')} 
                                            disabled={isSaving || !tplName || !tplContent}
                                            className="px-6 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><Send size={16}/> Submit for Approval</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SUCCESS TOAST */}
        {showSuccess && (
            <div className="fixed top-20 right-8 z-50 px-6 py-4 bg-brand-green text-white rounded-xl shadow-xl flex items-center gap-3 animate-slide-up">
               <Check size={20}/> <span className="font-bold text-sm">Settings saved successfully</span>
            </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
