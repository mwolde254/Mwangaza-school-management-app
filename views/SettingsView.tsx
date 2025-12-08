import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { UserRole } from '../types';
import { 
  User, Lock, Bell, Globe, Moon, Shield, CreditCard, 
  BookOpen, MessageSquare, Users, Calendar, Save, Check,
  Smartphone, Mail, AlertTriangle, Loader2, Link as LinkIcon, Unlink, Plus, AlertCircle
} from 'lucide-react';
import { db } from '../services/db';
import UserManagement from '../components/UserManagement';

type SettingsTab = 'PROFILE' | 'NOTIFICATIONS' | 'REGION' | 'APPEARANCE' | 'ADMIN_SYSTEM' | 'ADMIN_ACCESS' | 'ADMIN_FINANCE' | 'TEACHER_CLASS' | 'TEACHER_MSG' | 'PARENT_CHILD' | 'PARENT_FEES';

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
  const { students } = useStudentData(); // Added to resolve student names
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || ''); // Assuming email display only or managed elsewhere
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  // Mock Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('KES');
  const [language, setLanguage] = useState('English');

  // Admin Finance Logic
  const [apiKey, setApiKey] = useState('****************');
  const [apiSecret, setApiSecret] = useState('****************');

  // Parent Child Logic
  const [linkToken, setLinkToken] = useState('');
  const [linkStatus, setLinkStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Comprehensive Notification State
  const [notifConfig, setNotifConfig] = useState<NotificationState>({
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({ name, phoneNumber: phone });
    setIsSaving(false);
    showSaveSuccess();
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
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

  const handleUpdateCredentials = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    showSaveSuccess();
  };

  const handleLinkChild = async () => {
    if (linkToken.length < 5) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate verification
    
    // Mock logic: add a new student ID
    const currentIds = user?.linkedStudentIds || [];
    if (!currentIds.includes('st4')) {
        await updateProfile({ linkedStudentIds: [...currentIds, 'st4'] });
        setLinkStatus('SUCCESS');
    } else {
        setLinkStatus('ERROR'); // Already linked or invalid
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

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[12px] border border-gray-100">
      <span className="font-medium text-gray-700 text-sm">{label}</span>
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-brand-green' : 'bg-gray-300'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
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
    <div className="flex flex-col md:flex-row h-full min-h-[600px] bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      
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
        {user?.role === UserRole.ADMIN && (
          <>
            <div className="px-4 py-2 mb-2 mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administration</h4>
            </div>
            <NavItem id="ADMIN_SYSTEM" label="System Config" icon={CreditCard} />
            <NavItem id="ADMIN_ACCESS" label="Access Control" icon={Shield} />
            <NavItem id="ADMIN_FINANCE" label="Payment Gateways" icon={CreditCard} />
          </>
        )}

        {user?.role === UserRole.TEACHER && (
          <>
            <div className="px-4 py-2 mb-2 mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Classroom</h4>
            </div>
            <NavItem id="TEACHER_CLASS" label="Teaching Defaults" icon={BookOpen} />
            <NavItem id="TEACHER_MSG" label="Message Templates" icon={MessageSquare} />
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
                <input type="email" value={email} disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Contact admin to change email.</p>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={16}/> Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Password</label>
                     <input type="password" className={inputClass} placeholder="••••••••" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm Password</label>
                     <input type="password" className={inputClass} placeholder="••••••••" />
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
          <div className="max-w-4xl animate-slide-up">
            <SectionTitle icon={Bell} title="Notifications Configuration" />
            
            {/* Global Preferences */}
            <div className="bg-brand-grey/50 rounded-[12px] p-6 mb-8 border border-gray-200">
               <h3 className="font-display font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Globe size={18} className="text-brand-blue"/> Global Channel Preferences
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Smartphone size={16}/> In-App Push</span>
                     <button 
                        onClick={() => toggleGlobal('app')}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${notifConfig.global.app ? 'bg-brand-green' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifConfig.global.app ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Mail size={16}/> Email Updates</span>
                     <button 
                        onClick={() => toggleGlobal('email')}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${notifConfig.global.email ? 'bg-brand-green' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifConfig.global.email ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare size={16}/> SMS Alerts</span>
                     <button 
                        onClick={() => toggleGlobal('sms')}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${notifConfig.global.sms ? 'bg-brand-green' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifConfig.global.sms ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                  </div>
               </div>
            </div>

            {/* Granular Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <NotificationCard 
                   title="Financial Alerts" 
                   category="financial"
                   events={notifConfig.categories.financial} 
                   color="bg-gradient-to-r from-brand-blue/5 to-brand-yellow/5 border-b-brand-blue/10"
                 />
               </div>
               <div className="md:col-span-1">
                 <NotificationCard 
                   title="Academic Updates" 
                   category="academic"
                   events={notifConfig.categories.academic} 
                   color="bg-brand-green/5 border-b-brand-green/10"
                 />
               </div>
               <div className="md:col-span-1">
                 <NotificationCard 
                   title="System & Health" 
                   category="system"
                   events={notifConfig.categories.system} 
                   color="bg-brand-sky/5 border-b-brand-sky/10"
                 />
               </div>
               <div className="md:col-span-2">
                 <NotificationCard 
                   title="Communication" 
                   category="communication"
                   events={notifConfig.categories.communication} 
                   color="bg-gray-50 border-b-gray-100"
                 />
               </div>
            </div>
            
            {/* Warning Message */}
            {!notifConfig.global.sms && (
               <div className="flex items-start gap-3 p-4 bg-brand-yellow/10 rounded-[12px] text-brand-yellow-700 border border-brand-yellow/20 mb-4 animate-fade-in">
                  <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-brand-yellow"/>
                  <div>
                    <h4 className="font-bold text-sm text-brand-yellow">Critical Warning</h4>
                    <p className="text-xs opacity-90">Disabling Global SMS Alerts may prevent you from receiving urgent emergency broadcasts and critical financial OTPs. Are you sure?</p>
                  </div>
               </div>
            )}

            {/* Save Actions */}
            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 flex items-center justify-between z-10">
               {showSuccess ? (
                  <div className="flex items-center gap-2 text-brand-green font-bold text-sm animate-fade-in">
                    <Check size={18}/> Changes saved successfully!
                  </div>
               ) : (
                  <div className="text-xs text-gray-400 font-medium italic">
                    {isDirty ? 'You have unsaved changes.' : 'All systems synchronized.'}
                  </div>
               )}
               
               <button 
                 onClick={handleSaveNotifications}
                 disabled={!isDirty || isSaving}
                 className="px-8 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isSaving ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </div>
        )}

        {/* REGION */}
        {activeTab === 'REGION' && (
           <div className="max-w-2xl animate-slide-up">
             <SectionTitle icon={Globe} title="Language & Region" />
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">System Language</label>
                   <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                      <option>English</option>
                      <option>Swahili</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Currency</label>
                   <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                      <option>KES (Kenyan Shilling)</option>
                      <option>USD (US Dollar)</option>
                   </select>
                </div>
             </div>
           </div>
        )}

        {/* APPEARANCE */}
        {activeTab === 'APPEARANCE' && (
           <div className="max-w-2xl animate-slide-up">
             <SectionTitle icon={Moon} title="App Appearance" />
             <div className="space-y-4">
                <Toggle label="Dark Mode" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                <p className="text-sm text-gray-500">Switch between light and dark themes. Current theme: <span className="font-bold">{darkMode ? 'Dark' : 'Light'}</span></p>
             </div>
           </div>
        )}

        {/* --- ADMIN ACCESS (INVITE) --- */}
        {activeTab === 'ADMIN_ACCESS' && (
           <UserManagement />
        )}

        {/* --- ADMIN FINANCE --- */}
        {activeTab === 'ADMIN_FINANCE' && (
           <div className="max-w-2xl animate-slide-up">
              <SectionTitle icon={CreditCard} title="Payment Gateways" />
              <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-[12px] mb-6 flex items-start gap-3">
                 <AlertCircle className="text-brand-yellow shrink-0 mt-1" size={20}/>
                 <div>
                    <h4 className="font-bold text-brand-yellow text-sm">Sensitive Configuration</h4>
                    <p className="text-xs text-brand-yellow/80">Updating these keys will immediately affect MPesa processing.</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">MPesa Consumer Key</label>
                   <div className="flex gap-2">
                     <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} />
                     <button className="px-4 border border-gray-200 rounded-[6px] hover:bg-gray-50 font-bold text-xs text-gray-600">Show</button>
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">MPesa Consumer Secret</label>
                   <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className={inputClass} />
                 </div>
                 <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleUpdateCredentials}
                      disabled={isSaving}
                      className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all"
                    >
                      {isSaving ? 'Updating...' : 'Update Credentials'}
                    </button>
                 </div>
                 {showSuccess && <p className="text-right text-brand-green font-bold text-sm">Credentials Updated.</p>}
              </div>
           </div>
        )}

        {/* --- PARENT CHILD --- */}
        {activeTab === 'PARENT_CHILD' && (
           <div className="max-w-2xl animate-slide-up">
              <SectionTitle icon={Users} title="Child Access" />
              
              <div className="space-y-4 mb-8">
                 <h4 className="font-bold text-gray-800 text-sm">Linked Profiles</h4>
                 {user?.linkedStudentIds?.map(id => {
                    const student = students.find(s => s.id === id);
                    return (
                        <div key={id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[12px] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-grey flex items-center justify-center text-gray-500 font-bold overflow-hidden border border-gray-200">
                                {student ? <img src={student.avatarUrl} alt="" className="w-full h-full object-cover"/> : id.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{student ? student.name : `Student ID: ${id}`}</p>
                                <p className="text-xs text-brand-green font-bold flex items-center gap-1"><Check size={10}/> Verified • {student ? student.grade : 'Linked'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleUnlinkChild(id)}
                            className="p-2 text-brand-red hover:bg-brand-red/10 rounded-full transition-colors" title="Unlink"
                        >
                            <Unlink size={18}/>
                        </button>
                        </div>
                    );
                 })}
                 {(!user?.linkedStudentIds || user.linkedStudentIds.length === 0) && (
                    <p className="text-sm text-gray-400 italic">No students linked yet.</p>
                 )}
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-6">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><LinkIcon size={18}/> Link Another Student</h4>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={linkToken}
                      onChange={(e) => setLinkToken(e.target.value)}
                      placeholder="Enter Verification Token (e.g. ST4-XYZ)"
                      className={inputClass}
                    />
                    <button 
                      onClick={handleLinkChild}
                      disabled={isSaving || linkToken.length < 3}
                      className="px-6 bg-brand-blue text-white rounded-[6px] font-bold hover:bg-brand-blue/90 disabled:opacity-50"
                    >
                       {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                    </button>
                 </div>
                 {linkStatus === 'SUCCESS' && <p className="text-brand-green text-xs font-bold mt-2">Student linked successfully!</p>}
                 {linkStatus === 'ERROR' && <p className="text-brand-red text-xs font-bold mt-2">Invalid token or student already linked.</p>}
                 <p className="text-xs text-gray-400 mt-2">Tokens are provided by the school administration office.</p>
              </div>
           </div>
        )}

        {/* Fallback for other role tabs just to show structure */}
        {['ADMIN_SYSTEM', 'TEACHER_CLASS', 'TEACHER_MSG', 'PARENT_FEES'].includes(activeTab) && (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-fade-in">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                 <Shield size={32} />
              </div>
              <p className="font-bold">Restricted Configuration Area</p>
              <p className="text-xs mt-1">Settings for this module are currently locked.</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;