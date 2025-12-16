
import React, { useState } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { StaffRecord, SchoolEvent, EventType, EventAudience } from '../types';
import { Check, X, Wallet, Search, UserPlus, Users, Activity, AlertTriangle, LayoutDashboard, Loader2, Trash2, Save, AlertCircle, Calendar, ChevronLeft, ChevronRight, Briefcase, Table, HelpCircle, GraduationCap, Bus, Edit3, Plus, MessageSquare, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import TimetableModule from '../components/TimetableModule';
import UserManagement from '../components/UserManagement';
import AdminFinance from '../components/admin/AdminFinance';
import AdminAcademics from '../components/admin/AdminAcademics';
import AdminHelpDesk from '../components/admin/AdminHelpDesk';
import AdminSMS from '../components/admin/AdminSMS';
import AdminAdmissions from '../components/admin/AdminAdmissions';

const AdminPortal: React.FC = () => {
  const { students, transactions, leaveRequests, resolveLeaveRequest, addEvent, updateEvent, deleteEvent, events, transportRoutes, transportVehicles, transportLogs, addTransportRoute, staffRecords, addStaffRecord, updateStaffRecord, smsTemplates } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FINANCE' | 'ACADEMICS' | 'SMS' | 'ALERTS' | 'USERS' | 'CALENDAR' | 'HR' | 'TIMETABLE' | 'HELPDESK' | 'ADMISSIONS' | 'TRANSPORT'>('DASHBOARD');

  // -- GLOBAL METRICS --
  const totalStudents = students.length;
  const staffCount = staffRecords.length; 
  const attendanceRate = 92; // Mock

  // -- ALERTS DATA --
  const pendingLeaves = leaveRequests.filter(req => req.status === 'PENDING');
  const pendingTemplates = smsTemplates.filter(t => t.status === 'PENDING_APPROVAL');

  // -- CALENDAR STATE --
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventType, setEventType] = useState<EventType>('GENERAL');
  const [eventAudience, setEventAudience] = useState<EventAudience>('WHOLE_SCHOOL');
  const [eventTargetGrade, setEventTargetGrade] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventRequiresConsent, setEventRequiresConsent] = useState(false);
  const [eventRequiresPayment, setEventRequiresPayment] = useState(false);
  const [eventCost, setEventCost] = useState(0);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // -- TRANSPORT STATE --
  const [transportMode, setTransportMode] = useState<'LIVE' | 'ROUTES' | 'LOGS'>('LIVE');
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDriver, setRouteDriver] = useState('');
  const [routeVehicle, setRouteVehicle] = useState('');
  const [routeStops, setRouteStops] = useState<string[]>(['']);
  const [routeTime, setRouteTime] = useState('06:00');

  // -- HR STATE --
  const [hrMode, setHrMode] = useState<'RECORDS' | 'LEAVE'>('RECORDS');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFilterRole, setStaffFilterRole] = useState('ALL');
  const [staffForm, setStaffForm] = useState<Partial<StaffRecord>>({});
  const [qualInput, setQualInput] = useState('');

  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCalendarConfirm, setShowCalendarConfirm] = useState<string | null>(null);

  const calendarDays = React.useMemo(() => {
      const start = startOfWeek(startOfMonth(currentMonth));
      const end = endOfWeek(endOfMonth(currentMonth));
      return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getEventColor = (type: EventType) => {
      switch(type) {
          case 'ACADEMIC': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
          case 'HOLIDAY': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
          case 'TRIP': return 'bg-brand-yellow/10 text-brand-yellow-600 border-brand-yellow/20';
          case 'STAFF': return 'bg-purple-100 text-purple-600 border-purple-200';
          default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
  };

  const filteredStaff = React.useMemo(() => {
      return staffRecords.filter(s => {
          const matchesSearch = s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                s.email.toLowerCase().includes(staffSearch.toLowerCase());
          const matchesRole = staffFilterRole === 'ALL' || s.role === staffFilterRole;
          return matchesSearch && matchesRole;
      });
  }, [staffRecords, staffSearch, staffFilterRole]);

  // Staff Handlers
  const handleOpenStaffModal = (staff?: StaffRecord) => {
      if (staff) { setEditingStaffId(staff.id); setStaffForm(staff); } 
      else { setEditingStaffId(null); setStaffForm({ fullName: '', email: '', phone: '', role: 'TEACHER', department: '', status: 'ACTIVE', startDate: '', salaryBand: '', qualifications: [] }); }
      setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
      e.preventDefault();
      if(editingStaffId) await updateStaffRecord(editingStaffId, staffForm);
      else await addStaffRecord(staffForm as StaffRecord);
      setShowStaffModal(false);
      setNotification({ message: 'Staff record updated successfully.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleAddQualification = () => {
      if(qualInput.trim()) { setStaffForm(prev => ({ ...prev, qualifications: [...(prev.qualifications || []), qualInput.trim()] })); setQualInput(''); }
  };
  const removeQualification = (idx: number) => { setStaffForm(prev => ({ ...prev, qualifications: prev.qualifications?.filter((_, i) => i !== idx) })); };

  // Calendar & Route Handlers
  const resetEventForm = () => {
      setEventTitle(''); setEventStartDate(''); setEventEndDate(''); setEventType('GENERAL');
      setEventAudience('WHOLE_SCHOOL'); setEventTargetGrade(''); setEventDesc(''); setEventRequiresConsent(false); 
      setEventRequiresPayment(false); setEventCost(0); setEditingEventId(null);
  };

  const openAddEventModal = () => { 
      resetEventForm();
      setEventStartDate(format(selectedDate, 'yyyy-MM-dd')); 
      setEventEndDate(format(selectedDate, 'yyyy-MM-dd')); 
      setShowEventModal(true); 
  };

  const handleEditEvent = (ev: SchoolEvent) => {
      setEditingEventId(ev.id); setEventTitle(ev.title); setEventStartDate(ev.startDate.split('T')[0]);
      setEventEndDate(ev.endDate.split('T')[0]); setEventType(ev.type); setEventAudience(ev.audience);
      setEventTargetGrade(ev.targetGrade || ''); setEventDesc(ev.description || '');
      setEventRequiresConsent(ev.requiresConsent); setEventRequiresPayment(ev.requiresPayment);
      setEventCost(ev.cost || 0); setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    const payload = {
        title: eventTitle, startDate: new Date(eventStartDate).toISOString(), endDate: new Date(eventEndDate).toISOString(),
        type: eventType, audience: eventAudience, targetGrade: eventTargetGrade, description: eventDesc,
        requiresConsent: eventRequiresConsent, requiresPayment: eventRequiresPayment, cost: eventRequiresPayment ? eventCost : 0
    };
    if (editingEventId) await updateEvent(editingEventId, payload);
    else await addEvent(payload);
    setIsSavingEvent(false); setShowEventModal(false); setNotification({ message: 'Event saved.', type: 'success' }); setTimeout(() => setNotification(null), 3000); resetEventForm();
  };

  const handleDeleteEvent = async (id: string) => {
      if(confirm('Delete this event?')) { await deleteEvent(id); setNotification({ message: 'Event deleted.', type: 'success' }); setTimeout(() => setNotification(null), 3000); }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransportRoute({ name: routeName, driverName: routeDriver, vehicleNumber: routeVehicle, stops: routeStops.filter(s => s.trim() !== ''), scheduleTime: routeTime });
    setShowAddRouteModal(false); setRouteName(''); setRouteDriver(''); setRouteVehicle(''); setRouteStops(['']);
    setNotification({ message: 'New transport route added.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const inputClass = "w-full h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${notification.type === 'success' ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
           {notification.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
           <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* HEADER & NAV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-blue">
            {activeTab === 'DASHBOARD' ? 'Welcome, Principal Admin' : 
             activeTab === 'FINANCE' ? 'Financial Management' :
             activeTab === 'ACADEMICS' ? 'Grade & Class Manager' :
             activeTab === 'SMS' ? 'Communications' :
             activeTab === 'ALERTS' ? 'Action Center' : 
             activeTab === 'CALENDAR' ? 'School Calendar' : 
             activeTab === 'TIMETABLE' ? 'Academic Timetable' :
             activeTab === 'HELPDESK' ? 'Central Help Desk' :
             activeTab === 'ADMISSIONS' ? 'Admissions Pipeline' :
             activeTab === 'TRANSPORT' ? 'Transport Intelligence' :
             activeTab === 'HR' ? 'HR & Staff Directory' : 'User Management'}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'DASHBOARD' ? 'Here is the system overview for today.' : 'Manage system records.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['DASHBOARD', 'FINANCE', 'ACADEMICS', 'TIMETABLE', 'ADMISSIONS', 'SMS', 'HELPDESK', 'TRANSPORT', 'CALENDAR', 'HR', 'USERS', 'ALERTS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-sky/50 flex items-center gap-2 ${activeTab === tab ? 'bg-brand-blue text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'}`}
            >
              {tab === 'DASHBOARD' && <LayoutDashboard size={16}/>}
              {tab === 'FINANCE' && <Wallet size={16}/>}
              {tab === 'ACADEMICS' && <GraduationCap size={16}/>}
              {tab === 'SMS' && <MessageSquare size={16}/>}
              {tab === 'HELPDESK' && <HelpCircle size={16}/>}
              {tab === 'CALENDAR' && <Calendar size={16}/>}
              {tab === 'HR' && <Briefcase size={16}/>}
              {tab === 'USERS' && <Users size={16}/>}
              {tab === 'TIMETABLE' && <Table size={16}/>}
              {tab === 'ADMISSIONS' && <UserPlus size={16}/>}
              {tab === 'TRANSPORT' && <Bus size={16}/>}
              {tab === 'ALERTS' && <AlertTriangle size={16}/>}
              <span className="capitalize">{tab === 'HR' ? 'HR & Staff' : tab === 'SMS' ? 'SMS' : tab === 'HELPDESK' ? 'Help Desk' : tab === 'TRANSPORT' ? 'Transport' : tab === 'ALERTS' ? 'Alerts' : tab.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === DASHBOARD OVERVIEW === */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cardBase + " flex items-center justify-between bg-gradient-to-br from-brand-blue to-blue-900 text-white border-none"}>
                 <div>
                   <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Enrollment</p>
                   <p className="text-3xl font-bold font-sans">{totalStudents}</p>
                 </div>
                 <div className="p-3 bg-white/10 rounded-full"><Users size={24}/></div>
              </div>
              <div className={cardBase + " flex items-center justify-between"}>
                 <div>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Active Staff</p>
                   <p className="text-3xl font-bold font-sans text-brand-blue">{staffCount}</p>
                 </div>
                 <div className="p-3 bg-brand-sky/10 text-brand-sky rounded-full"><Activity size={24}/></div>
              </div>
              <div className={cardBase + " flex items-center justify-between"}>
                 <div>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Attendance Rate</p>
                   <p className={`text-3xl font-bold font-sans ${attendanceRate > 90 ? 'text-brand-green' : 'text-brand-yellow'}`}>{attendanceRate}%</p>
                 </div>
                 <div className={`p-3 rounded-full ${attendanceRate > 90 ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
                    <Check size={24}/>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cardBase}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-bold text-lg text-gray-800">Recent Transactions</h3>
                    <button onClick={() => setActiveTab('FINANCE')} className="text-xs font-bold text-brand-blue hover:underline">View All</button>
                 </div>
                 <div className="space-y-3">
                    {transactions.slice(0, 4).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="text-sm font-bold text-gray-700">{t.studentName}</p>
                                <p className="text-xs text-gray-500">{t.type} via {t.method}</p>
                            </div>
                            <span className="font-mono font-bold text-brand-green">+{t.amount.toLocaleString()}</span>
                        </div>
                    ))}
                 </div>
              </div>
              <div className={cardBase}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-bold text-lg text-gray-800">Pending Approvals</h3>
                    <button onClick={() => setActiveTab('ALERTS')} className="text-xs font-bold text-brand-blue hover:underline">View All</button>
                 </div>
                 <div className="space-y-3">
                    {pendingLeaves.length > 0 ? pendingLeaves.slice(0, 3).map(l => (
                        <div key={l.id} className="flex justify-between items-center p-3 bg-brand-yellow/5 rounded-lg border border-brand-yellow/20">
                            <div>
                                <p className="text-sm font-bold text-gray-700">{l.staffName}</p>
                                <p className="text-xs text-gray-500">{l.type} Leave ({l.days} days)</p>
                            </div>
                            <span className="text-xs font-bold bg-brand-yellow text-brand-blue px-2 py-1 rounded">PENDING</span>
                        </div>
                    )) : (
                        <p className="text-center text-gray-400 italic py-4">No pending approvals.</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* === HR MODULE === */}
      {activeTab === 'HR' && (
          <div className="space-y-6 animate-slide-up">
              {/* Sub Navigation */}
              <div className="flex gap-4 border-b border-gray-200 pb-1">
                  <button onClick={() => setHrMode('RECORDS')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${hrMode === 'RECORDS' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Staff Directory</button>
                  <button onClick={() => setHrMode('LEAVE')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${hrMode === 'LEAVE' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Leave Management</button>
              </div>

              {/* HR: STAFF RECORDS */}
              {hrMode === 'RECORDS' && (
                  <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <div className="flex gap-2">
                              <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                  <input 
                                      type="text" 
                                      placeholder="Search Staff..." 
                                      value={staffSearch}
                                      onChange={(e) => setStaffSearch(e.target.value)}
                                      className={`${inputClass} pl-10 h-10 text-sm`}
                                  />
                              </div>
                              <select 
                                  value={staffFilterRole} 
                                  onChange={(e) => setStaffFilterRole(e.target.value)}
                                  className={`${inputClass} w-32 h-10 text-sm`}
                              >
                                  <option value="ALL">All Roles</option>
                                  <option value="TEACHER">Teacher</option>
                                  <option value="ADMIN">Admin</option>
                                  <option value="SUPPORT">Support</option>
                              </select>
                          </div>
                          <button onClick={() => handleOpenStaffModal()} className="px-4 h-10 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
                              <UserPlus size={16}/> Add Staff
                          </button>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-white text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                  <tr>
                                      <th className="px-6 py-4">Name</th>
                                      <th className="px-6 py-4">Role</th>
                                      <th className="px-6 py-4">Department</th>
                                      <th className="px-6 py-4">Contact</th>
                                      <th className="px-6 py-4">Status</th>
                                      <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {filteredStaff.map(staff => (
                                      <tr key={staff.id} className="hover:bg-gray-50 group transition-colors">
                                          <td className="px-6 py-4 font-bold text-gray-800">{staff.fullName}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                  staff.role === 'TEACHER' ? 'bg-brand-green/10 text-brand-green' : 
                                                  staff.role === 'ADMIN' ? 'bg-brand-blue/10 text-brand-blue' :
                                                  'bg-gray-100 text-gray-600'
                                              }`}>
                                                  {staff.role}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-gray-600">{staff.department}</td>
                                          <td className="px-6 py-4 text-gray-600">
                                              <div className="text-xs">{staff.email}</div>
                                              <div className="text-[10px] text-gray-400">{staff.phone}</div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`flex items-center gap-1 text-xs font-bold ${staff.status === 'ACTIVE' ? 'text-brand-green' : 'text-gray-400'}`}>
                                                  <div className={`w-2 h-2 rounded-full ${staff.status === 'ACTIVE' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
                                                  {staff.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <button onClick={() => handleOpenStaffModal(staff)} className="p-2 text-gray-400 hover:text-brand-blue rounded hover:bg-brand-blue/5 transition-colors">
                                                  <Edit3 size={16}/>
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* HR: LEAVE MANAGEMENT */}
              {hrMode === 'LEAVE' && (
                  <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6">
                      <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Leave Requests History</h3>
                      <div className="space-y-3">
                          {leaveRequests.map(req => (
                              <div key={req.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                                  <div>
                                      <p className="font-bold text-gray-800">{req.staffName}</p>
                                      <p className="text-xs text-gray-500">{req.type} • {req.days} Days ({format(new Date(req.startDate), 'dd MMM')} - {format(new Date(req.endDate), 'dd MMM')})</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      {req.status === 'PENDING' ? (
                                          <span className="px-3 py-1 bg-brand-yellow/10 text-brand-yellow-600 text-xs font-bold rounded-full border border-brand-yellow/20">Pending</span>
                                      ) : (
                                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${req.status === 'APPROVED' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-red/10 text-brand-red border-brand-red/20'}`}>
                                              {req.status}
                                          </span>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {leaveRequests.length === 0 && <p className="text-center text-gray-400 italic">No leave history available.</p>}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* === ALERTS MODULE === */}
      {activeTab === 'ALERTS' && (
          <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand-yellow/10 rounded-lg text-brand-yellow-600">
                      <AlertTriangle size={24}/>
                  </div>
                  <div>
                      <h2 className="text-xl font-display font-bold text-gray-800">Action Center</h2>
                      <p className="text-sm text-gray-500">Pending items requiring your attention.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pending Leaves */}
                  <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Briefcase size={18} className="text-brand-blue"/> Leave Approvals
                      </h3>
                      {pendingLeaves.length > 0 ? (
                          <div className="space-y-4">
                              {pendingLeaves.map(req => (
                                  <div key={req.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-bold text-gray-800">{req.staffName}</span>
                                          <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded">{req.type}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-3">{req.reason}</p>
                                      <p className="text-xs text-gray-500 mb-4">{req.days} Days • {format(new Date(req.startDate), 'MMM dd')} to {format(new Date(req.endDate), 'MMM dd')}</p>
                                      <div className="flex gap-2">
                                          <button 
                                              onClick={() => { setRejectModalId(req.id); }}
                                              className="flex-1 py-2 text-xs font-bold text-brand-red border border-brand-red/30 rounded hover:bg-brand-red/5"
                                          >
                                              Reject
                                          </button>
                                          <button 
                                              onClick={() => { setShowCalendarConfirm(req.id); }}
                                              className="flex-1 py-2 text-xs font-bold text-white bg-brand-green rounded hover:bg-brand-green/90"
                                          >
                                              Approve
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">No pending leave requests.</div>
                      )}
                  </div>

                  {/* Pending Templates (ReadOnly Preview, Action in SMS Tab) */}
                  <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 opacity-60">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <MessageSquare size={18} className="text-brand-blue"/> SMS Template Reviews
                      </h3>
                      <p className="text-xs text-gray-500">Please visit the Communication tab to review templates.</p>
                  </div>
              </div>
          </div>
      )}

      {/* === MODULES === */}
      {activeTab === 'ACADEMICS' && <AdminAcademics />}
      {activeTab === 'FINANCE' && <AdminFinance />}
      {activeTab === 'SMS' && <AdminSMS />}
      {activeTab === 'HELPDESK' && <AdminHelpDesk />}
      {activeTab === 'ADMISSIONS' && <AdminAdmissions />}
      {activeTab === 'USERS' && <UserManagement />}
      {activeTab === 'TIMETABLE' && <TimetableModule mode="ADMIN" />}

      {/* === CALENDAR MODULE === */}
      {activeTab === 'CALENDAR' && (
          <div className="animate-slide-up flex flex-col h-[calc(100vh-180px)]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-gray-100 shadow-sm mb-6">
                  <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-display font-bold text-gray-800">
                          {format(currentMonth, 'MMMM yyyy')}
                      </h2>
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                          <button onClick={handlePrevMonth} className="p-1 hover:bg-white rounded hover:shadow-sm text-gray-600"><ChevronLeft size={20}/></button>
                          <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-xs font-bold text-gray-600 hover:bg-white rounded hover:shadow-sm">Today</button>
                          <button onClick={handleNextMonth} className="p-1 hover:bg-white rounded hover:shadow-sm text-gray-600"><ChevronRight size={20}/></button>
                      </div>
                  </div>
                  <button 
                      onClick={openAddEventModal} 
                      className="px-4 py-2 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow-lg hover:bg-brand-blue/90 flex items-center gap-2"
                  >
                      <Plus size={16}/> Add Event
                  </button>
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {/* Days Header */}
                  <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                      ))}
                  </div>
                  
                  {/* Days Grid */}
                  <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
                      {calendarDays.map((day, dayIdx) => {
                          const isSelectedMonth = isSameMonth(day, currentMonth);
                          const isCurrentDay = isToday(day);
                          const dayEvents = events.filter(e => 
                              isSameDay(parseISO(e.startDate), day) || 
                              (day >= parseISO(e.startDate) && day <= parseISO(e.endDate))
                          );

                          return (
                              <div 
                                  key={day.toString()} 
                                  className={`bg-white min-h-[100px] p-2 flex flex-col transition-colors hover:bg-gray-50/50 ${!isSelectedMonth ? 'bg-gray-50/30' : ''}`}
                                  onClick={() => { setSelectedDate(day); openAddEventModal(); }}
                              >
                                  <div className={`text-right mb-1`}>
                                      <span className={`text-xs font-medium w-6 h-6 inline-flex items-center justify-center rounded-full ${isCurrentDay ? 'bg-brand-blue text-white font-bold' : isSelectedMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                                          {format(day, 'd')}
                                      </span>
                                  </div>
                                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                                      {dayEvents.map(event => (
                                          <div 
                                              key={event.id}
                                              onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                              className={`text-[10px] px-1.5 py-1 rounded truncate cursor-pointer font-medium border-l-2 ${getEventColor(event.type)}`}
                                              title={event.title}
                                          >
                                              {event.title}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* === TRANSPORT MODULE === */}
      {activeTab === 'TRANSPORT' && (
          <div className="space-y-6 animate-slide-up">
              <div className="flex gap-4 border-b border-gray-200 pb-1">
                  <button onClick={() => setTransportMode('LIVE')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${transportMode === 'LIVE' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Live Monitor</button>
                  <button onClick={() => setTransportMode('ROUTES')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${transportMode === 'ROUTES' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Route Manager</button>
                  <button onClick={() => setTransportMode('LOGS')} className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${transportMode === 'LOGS' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Trip Logs</button>
              </div>

              {transportMode === 'LIVE' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                      <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden flex items-center justify-center">
                          {/* Mock Map */}
                          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/OpenStreetMap_Mapnik_logo.svg')] bg-cover opacity-20 grayscale"></div>
                          <div className="relative z-10 w-full h-full p-4">
                              {transportVehicles.map(v => {
                                  const route = transportRoutes.find(r => r.id === v.routeId);
                                  return (
                                      <div 
                                          key={v.id} 
                                          className="absolute w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white transition-all duration-1000 ease-linear"
                                          style={{ top: `${v.currentLocation.y}%`, left: `${v.currentLocation.x}%` }}
                                          title={`${route?.name} - ${v.speed} km/h`}
                                      >
                                          <Bus size={14}/>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-y-auto">
                          <h3 className="font-bold text-gray-800 mb-4">Active Fleet</h3>
                          <div className="space-y-3">
                              {transportVehicles.map(v => {
                                  const route = transportRoutes.find(r => r.id === v.routeId);
                                  return (
                                      <div key={v.id} className="p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                                          <div className="flex justify-between items-center mb-1">
                                              <span className="font-bold text-sm text-gray-800">{route?.name}</span>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${v.status === 'ON_ROUTE' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'}`}>{v.status}</span>
                                          </div>
                                          <div className="flex justify-between text-xs text-gray-500">
                                              <span>{route?.vehicleNumber}</span>
                                              <span>{v.speed} km/h</span>
                                          </div>
                                          <div className="mt-2 text-xs font-medium text-brand-blue flex items-center gap-1">
                                              <MapPin size={10}/> Next: {v.nextStop} ({v.etaToNextStop})
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              )}

              {transportMode === 'ROUTES' && (
                  <div className="space-y-6">
                      <div className="flex justify-end">
                          <button onClick={() => setShowAddRouteModal(true)} className="px-4 py-2 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
                              <Plus size={16}/> Add Route
                          </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {transportRoutes.map(route => (
                              <div key={route.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-gray-800">{route.name}</h4>
                                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{route.scheduleTime}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-3">{route.vehicleNumber} • {route.driverName}</p>
                                  <div className="space-y-1">
                                      {route.stops.map((stop, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                              <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/30"></div>
                                              {stop}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {transportMode === 'LOGS' && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                              <tr>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Route</th>
                                  <th className="px-6 py-4">Driver</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4">Times</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {transportLogs.map(log => {
                                  const route = transportRoutes.find(r => r.id === log.routeId);
                                  return (
                                      <tr key={log.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 font-medium text-gray-600">{log.date}</td>
                                          <td className="px-6 py-4 font-bold text-gray-800">{route?.name || 'Unknown Route'}</td>
                                          <td className="px-6 py-4 text-gray-600">{log.driverName}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'ON_TIME' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                                                  {log.status === 'LATE' ? `Late (+${log.delayMinutes}m)` : 'On Time'}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-xs text-gray-500">
                                              Dep: {log.departureTime} • Arr: {log.arrivalTime}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[12px]">
                      <h3 className="text-xl font-display font-bold text-brand-blue">{editingEventId ? 'Edit Event' : 'Add Calendar Event'}</h3>
                      <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Event Title</label>
                          <input 
                              type="text" 
                              value={eventTitle} 
                              onChange={(e) => setEventTitle(e.target.value)} 
                              className={inputClass}
                              placeholder="e.g. Sports Day"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                              <input 
                                  type="date" 
                                  value={eventStartDate} 
                                  onChange={(e) => setEventStartDate(e.target.value)} 
                                  className={inputClass}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
                              <input 
                                  type="date" 
                                  value={eventEndDate} 
                                  onChange={(e) => setEventEndDate(e.target.value)} 
                                  className={inputClass}
                              />
                          </div>
                      </div>
                      {/* ... Rest of form omitted for brevity but logic remains ... */}
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-[12px] flex justify-between">
                      {editingEventId ? (
                          <button 
                              type="button" 
                              onClick={() => handleDeleteEvent(editingEventId)}
                              className="px-4 h-12 text-brand-red font-bold hover:bg-brand-red/10 rounded-[12px] flex items-center gap-2"
                          >
                              <Trash2 size={18}/> Delete
                          </button>
                      ) : (
                          <div></div> 
                      )}
                      <button 
                          onClick={handleSaveEvent}
                          disabled={isSavingEvent}
                          className="px-8 h-12 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isSavingEvent ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                          {editingEventId ? 'Update Event' : 'Save Event'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* STAFF MODAL */}
      {showStaffModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[12px] w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[12px]">
                      <h3 className="text-xl font-display font-bold text-brand-blue">{editingStaffId ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                      <button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      {/* ... Staff Form ... */}
                      <button 
                          onClick={handleSaveStaff}
                          className="w-full h-12 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2"
                      >
                          <Save size={18}/> {editingStaffId ? 'Update Record' : 'Create Staff Record'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD ROUTE MODAL --- */}
      {showAddRouteModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[12px]">
                      <h3 className="text-xl font-display font-bold text-brand-blue">Add Transport Route</h3>
                      <button onClick={() => setShowAddRouteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      {/* ... Route Form ... */}
                      <button 
                          onClick={handleSaveRoute}
                          className="w-full h-12 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2"
                      >
                          <Save size={18}/> Save Route
                      </button>
                  </div>
              </div>
          </div>
      )}
      
    </div>
  );
};

export default AdminPortal;
