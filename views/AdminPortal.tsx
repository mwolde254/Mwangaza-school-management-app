
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { FinanceTransaction, LeaveRequest, UserRole, SchoolEvent, EventType, EventAudience, LeaveType, AdmissionStage } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Check, X, CreditCard, MessageSquare, Plus, Filter, Wallet, Search, UserPlus, Users, Activity, FileText, AlertTriangle, ArrowRight, LayoutDashboard, Loader2, Trash2, Save, Send, AlertCircle, Smartphone, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Briefcase, Stethoscope, Palmtree, Heart, Table, HelpCircle, GraduationCap, GripVertical, FileCheck, Mail } from 'lucide-react';
import { db } from '../services/db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import TimetableModule from '../components/TimetableModule';

// Brand Palette Mapping for Data Viz
const COLORS = ['#1E3A8A', '#059669', '#FCD34D', '#38BDF8'];

const AdminPortal: React.FC = () => {
  const { students, transactions, leaveRequests, resolveLeaveRequest, addTransaction, addEvent, deleteEvent, events, supportTickets, resolveSupportTicket, applications, updateApplicationStage, enrollApplicant } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FINANCE' | 'SMS' | 'ALERTS' | 'USERS' | 'CALENDAR' | 'HR' | 'TIMETABLE' | 'HELPDESK' | 'ADMISSIONS'>('DASHBOARD');

  // -- GLOBAL METRICS --
  const totalStudents = students.length;
  const staffCount = 24; // Mock
  const attendanceRate = 92; // Mock

  // -- FINANCE DATA --
  const totalCollected = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const outstandingTotal = students.reduce((acc, curr) => acc + curr.balance, 0);
  
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeFilter, setFinanceFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // -- PAYMENT MODAL STATE --
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentType, setPaymentType] = useState('TUITION');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.studentName.toLowerCase().includes(financeSearch.toLowerCase());
      const matchesStatus = financeFilter === 'ALL' || t.status === financeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, financeSearch, financeFilter]);

  // -- ALERTS DATA --
  const pendingLeaves = leaveRequests.filter(req => req.status === 'PENDING');
  const staffAbsentToday = 3; // Mock

  // -- SMS LOGIC & STATE --
  const [smsMessage, setSmsMessage] = useState('');
  const [smsAudienceType, setSmsAudienceType] = useState<'ALL' | 'GRADE' | 'INDIVIDUAL'>('ALL');
  const [smsTargetGrade, setSmsTargetGrade] = useState('');
  const [smsSearchTerm, setSmsSearchTerm] = useState('');
  const [showSmsConfirm, setShowSmsConfirm] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsNotification, setSmsNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // -- HELP DESK STATE --
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // -- ADMISSIONS STATE --
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // -- CALENDAR STATE --
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<EventType>('GENERAL');
  const [eventAudience, setEventAudience] = useState<EventAudience>('WHOLE_SCHOOL');
  const [eventTargetGrade, setEventTargetGrade] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventRequiresConsent, setEventRequiresConsent] = useState(false);
  const [eventRequiresPayment, setEventRequiresPayment] = useState(false);
  const [eventCost, setEventCost] = useState(0);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // -- HR / LEAVE STATE --
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCalendarConfirm, setShowCalendarConfirm] = useState<string | null>(null); // Stores leave ID to approve

  // SMS Derived Calculations
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
  
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
  const smsCostPerSegment = 0.8;
  const smsTotalCost = recipientCount * smsSegments * smsCostPerSegment;
  const smsIsOverLimit = smsCharCount > 160;

  const smsTemplates = [
    "Dear Parent, kindly note that school fees for Term 3 are due by Friday. Please settle via MPesa to avoid disruption.",
    "Reminder: The Grade 4 Science Trip is scheduled for tomorrow. Please ensure your child arrives by 7:30 AM.",
    "Notice: School will be closed this Friday for a public holiday. Classes resume on Monday."
  ];

  const handleClearDraft = () => {
    setSmsMessage('');
    setSmsAudienceType('ALL');
    setSmsTargetGrade('');
    setSmsSearchTerm('');
  };

  const handleSendSms = async () => {
    setIsSendingSms(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate API call
    
    // In a real app, we'd add to a collection here
    // await db.collection('communications').add({ ... });

    setIsSendingSms(false);
    setShowSmsConfirm(false);
    setSmsNotification({ message: 'Message scheduled for delivery.', type: 'success' });
    setTimeout(() => {
        setSmsNotification(null);
        handleClearDraft();
    }, 3000);
  };

  // -- INVITE LOGIC --
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState(UserRole.TEACHER);
  const [inviteStatus, setInviteStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.collection('invites').add({ 
      email: newUserEmail, 
      role: newUserRole, 
      name: newUserEmail.split('@')[0], 
      avatarUrl: `https://ui-avatars.com/api/?name=${newUserEmail.split('@')[0]}&background=random`,
      date: new Date().toISOString() 
    });
    setInviteStatus('SUCCESS');
    setTimeout(() => setInviteStatus('IDLE'), 3000);
    setNewUserEmail('');
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudentId) return;
    
    setIsProcessingPayment(true);
    const student = students.find(s => s.id === paymentStudentId);
    
    await addTransaction({
      studentId: paymentStudentId,
      studentName: student?.name || 'Unknown',
      amount: parseInt(paymentAmount),
      type: paymentType as any,
      date: new Date().toISOString().split('T')[0],
      status: 'PAID',
      method: paymentMethod as any
    });
    
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    setPaymentStudentId('');
    setPaymentAmount('');
  };

  // -- HELP DESK LOGIC --
  const handleResolveTicket = async () => {
    if(!selectedTicketId || !ticketReply) return;
    setIsSendingReply(true);
    await resolveSupportTicket(selectedTicketId, ticketReply, user?.name || 'Admin');
    setIsSendingReply(false);
    setSelectedTicketId(null);
    setTicketReply('');
    setSmsNotification({ message: 'Response sent and ticket closed.', type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
  };

  // -- ADMISSIONS LOGIC --
  const handleDragStart = (id: string) => {
    setDraggedAppId(id);
  };

  const handleDrop = async (stage: AdmissionStage) => {
    if (draggedAppId) {
        await updateApplicationStage(draggedAppId, stage);
        setDraggedAppId(null);
    }
  };

  const handleEnroll = async () => {
    if(selectedAppId) {
        await enrollApplicant(selectedAppId);
        setSmsNotification({ message: 'Student Enrolled Successfully!', type: 'success' });
        setSelectedAppId(null);
        setTimeout(() => setSmsNotification(null), 3000);
    }
  };

  // -- CALENDAR LOGIC --
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    await addEvent({
        title: eventTitle,
        startDate: new Date(eventDate).toISOString(),
        endDate: new Date(eventDate).toISOString(), // Simplified single day events for now
        type: eventType,
        audience: eventAudience,
        targetGrade: eventTargetGrade,
        description: eventDesc,
        requiresConsent: eventRequiresConsent,
        requiresPayment: eventRequiresPayment,
        cost: eventRequiresPayment ? eventCost : 0
    });
    setIsSavingEvent(false);
    setShowEventModal(false);
    // Reset Form
    setEventTitle(''); setEventDate(''); setEventType('GENERAL'); setEventAudience('WHOLE_SCHOOL'); 
    setEventDesc(''); setEventRequiresConsent(false); setEventRequiresPayment(false); setEventCost(0);
  };

  // -- LEAVE APPROVAL LOGIC --
  const handleApproveLeave = async (addToCalendar: boolean) => {
      if (showCalendarConfirm) {
          await resolveLeaveRequest(showCalendarConfirm, 'APPROVED', undefined, addToCalendar);
          setShowCalendarConfirm(null);
          setSmsNotification({ message: 'Leave request approved successfully.', type: 'success' });
          setTimeout(() => setSmsNotification(null), 3000);
      }
  };

  const handleRejectLeave = async () => {
      if (rejectModalId && rejectionReason) {
          await resolveLeaveRequest(rejectModalId, 'REJECTED', rejectionReason);
          setRejectModalId(null);
          setRejectionReason('');
          setSmsNotification({ message: 'Leave request rejected.', type: 'success' }); // Using success color for operation success
          setTimeout(() => setSmsNotification(null), 3000);
      }
  };

  const handleGenerateReport = (reportType: string) => {
    setSmsNotification({ message: `Generating ${reportType}... Download started.`, type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
  };

  const getEventColor = (type: EventType) => {
     switch(type) {
        case 'ACADEMIC': return 'bg-brand-blue text-white';
        case 'HOLIDAY': return 'bg-brand-yellow text-brand-blue';
        case 'TRIP': return 'bg-brand-green text-white';
        case 'STAFF': return 'bg-gray-800 text-white';
        default: return 'bg-brand-sky text-white';
     }
  };

  const getLeaveIcon = (type: LeaveType) => {
    switch(type) {
      case 'MEDICAL': return <Stethoscope size={16} className="text-brand-red"/>;
      case 'ANNUAL': return <Palmtree size={16} className="text-brand-green"/>;
      case 'COMPASSIONATE': return <Heart size={16} className="text-brand-yellow"/>;
      case 'OFFICIAL': return <Briefcase size={16} className="text-brand-blue"/>;
      default: return <Calendar size={16} className="text-gray-400"/>;
    }
  };

  // Mock Performance Data
  const performanceData = [
    { month: 'Jan', attendance: 95 },
    { month: 'Feb', attendance: 92 },
    { month: 'Mar', attendance: 96 },
    { month: 'Apr', attendance: 88 },
  ];

  const activeUsers = [
    { name: 'Tr. Sarah', activity: 90 },
    { name: 'Tr. John', activity: 75 },
    { name: 'Tr. Mary', activity: 60 },
  ];

  const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const buttonBaseClass = "rounded-xl font-bold transition-all shadow-lg focus:ring-4 focus:ring-brand-sky/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform duration-150";
  const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";

  // Filter Support Tickets
  const openTickets = supportTickets.filter(t => t.status === 'OPEN').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Admissions Pipeline Config
  const PIPELINE_STAGES: { id: AdmissionStage, label: string, color: string }[] = [
    { id: 'NEW_INQUIRY', label: 'Inquiry', color: 'border-brand-sky bg-brand-sky/5 text-brand-sky' },
    { id: 'UNDER_REVIEW', label: 'Reviewing', color: 'border-brand-yellow bg-brand-yellow/5 text-brand-yellow' },
    { id: 'INTERVIEW', label: 'Interview', color: 'border-purple-500 bg-purple-50 text-purple-600' },
    { id: 'OFFER_SENT', label: 'Offer Sent', color: 'border-brand-blue bg-brand-blue/5 text-brand-blue' },
    { id: 'ENROLLED', label: 'Enrolled', color: 'border-brand-green bg-brand-green/5 text-brand-green' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      {/* Toast Notification */}
      {smsNotification && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${smsNotification.type === 'success' ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
           {smsNotification.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
           <span className="font-bold">{smsNotification.message}</span>
        </div>
      )}

      {/* HEADER & NAV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-blue">
            {activeTab === 'DASHBOARD' ? 'Welcome, Principal Admin' : 
             activeTab === 'FINANCE' ? 'Financial Management' :
             activeTab === 'SMS' ? 'Communications' :
             activeTab === 'ALERTS' ? 'Approvals' : 
             activeTab === 'CALENDAR' ? 'School Calendar' : 
             activeTab === 'TIMETABLE' ? 'Academic Timetable' :
             activeTab === 'HELPDESK' ? 'Parent Help Desk' :
             activeTab === 'ADMISSIONS' ? 'Admissions Pipeline' :
             activeTab === 'HR' ? 'HR & Staff' : 'User Management'}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'DASHBOARD' ? 'Here is the system overview for today.' : 'Manage system records.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['DASHBOARD', 'FINANCE', 'TIMETABLE', 'ADMISSIONS', 'SMS', 'HELPDESK', 'CALENDAR', 'HR', 'USERS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-sky/50 flex items-center gap-2 ${activeTab === tab ? 'bg-brand-blue text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'}`}
            >
              {tab === 'DASHBOARD' && <LayoutDashboard size={16}/>}
              {tab === 'FINANCE' && <Wallet size={16}/>}
              {tab === 'SMS' && <MessageSquare size={16}/>}
              {tab === 'HELPDESK' && <HelpCircle size={16}/>}
              {tab === 'CALENDAR' && <Calendar size={16}/>}
              {tab === 'HR' && <Briefcase size={16}/>}
              {tab === 'USERS' && <Users size={16}/>}
              {tab === 'TIMETABLE' && <Table size={16}/>}
              {tab === 'ADMISSIONS' && <GraduationCap size={16}/>}
              <span className="capitalize">{tab === 'HR' ? 'HR & Staff' : tab === 'SMS' ? 'SMS' : tab === 'HELPDESK' ? 'Help Desk' : tab.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === DASHBOARD OVERVIEW === */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-slide-up">
           
           {/* 1. Global KPI Bar */}
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

           {/* 2. Main Grid Layout */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Column 1: This Week's Overview (Replaced Critical Alerts) - Span 3 */}
              <div className="lg:col-span-3 space-y-6">
                 <div className={cardBase + " border-l-4 border-l-brand-blue p-4"}>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4">This Week</h3>
                    
                    <div className="space-y-3">
                       {events.filter(e => {
                          const eventDate = new Date(e.startDate);
                          const today = new Date();
                          const nextWeek = new Date();
                          nextWeek.setDate(today.getDate() + 7);
                          return eventDate >= today && eventDate <= nextWeek;
                       }).slice(0, 3).map(evt => (
                         <div key={evt.id} className="p-3 bg-gray-50 rounded-[12px] border border-gray-100 flex items-center gap-3">
                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-xs font-bold ${evt.type === 'TRIP' ? 'bg-brand-green/10 text-brand-green' : evt.type === 'HOLIDAY' ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-blue/10 text-brand-blue'}`}>
                               <span className="uppercase">{format(new Date(evt.startDate), 'MMM')}</span>
                               <span>{format(new Date(evt.startDate), 'dd')}</span>
                            </div>
                            <div>
                               <p className="text-xs font-bold text-gray-800 line-clamp-1">{evt.title}</p>
                               <p className="text-[10px] text-gray-500 capitalize">{evt.type.toLowerCase()}</p>
                            </div>
                         </div>
                       ))}
                       {events.length === 0 && <p className="text-sm text-gray-400 italic">No upcoming events.</p>}
                    </div>
                    <button onClick={() => setActiveTab('CALENDAR')} className="mt-4 w-full text-xs font-bold text-brand-sky hover:underline flex items-center justify-center gap-1">View Full Calendar <ArrowRight size={10}/></button>
                 </div>

                 {/* System Alert Mock */}
                 <div className={cardBase + " border-l-4 border-l-brand-yellow p-4"}>
                    <h3 className="font-display font-bold text-sm text-gray-800 mb-2">System Health</h3>
                    <p className="text-xs text-gray-500 mb-3">Backup scheduled for 2:00 AM.</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-green">
                       <Check size={14}/> Systems Operational
                    </div>
                 </div>
              </div>

              {/* Column 2: Financial & System Health (Wide) - Span 6 */}
              <div className="lg:col-span-6 space-y-6">
                 <div className={cardBase}>
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-display font-bold text-lg text-gray-800">Financial Health</h3>
                       <button onClick={() => setActiveTab('FINANCE')} className="text-xs font-bold text-brand-sky hover:underline">View Detailed Report</button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                       <div className="p-4 rounded-[12px] bg-brand-grey/50 border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Collected</p>
                          <p className="text-2xl font-bold text-brand-blue">KES {totalCollected.toLocaleString()}</p>
                       </div>
                       <div className={`p-4 rounded-[12px] border ${outstandingTotal > 0 ? 'bg-brand-yellow/5 border-brand-yellow/30' : 'bg-brand-green/5 border-brand-green/30'}`}>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Outstanding Balance</p>
                          <p className={`text-2xl font-bold ${outstandingTotal > 0 ? 'text-brand-yellow' : 'text-brand-green'}`}>KES {outstandingTotal.toLocaleString()}</p>
                       </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Recent Transactions</h4>
                    <div className="space-y-3 mb-6">
                       {filteredTransactions.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-[12px] transition-colors border border-transparent hover:border-gray-100">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-green/10 text-brand-green rounded-full">
                                   <Check size={14} strokeWidth={3}/>
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gray-700">{tx.studentName}</p>
                                   <p className="text-[10px] text-gray-400">{tx.date} • {tx.method}</p>
                                </div>
                             </div>
                             <span className="font-mono font-bold text-brand-blue text-sm">+{tx.amount.toLocaleString()}</span>
                          </div>
                       ))}
                    </div>

                    <button 
                      onClick={() => setActiveTab('FINANCE')}
                      className={`w-full h-12 bg-brand-blue text-white ${buttonBaseClass} flex items-center justify-center gap-2`}
                    >
                       <Wallet size={18}/> View Financial Report & Reconcile
                    </button>
                 </div>
              </div>

              {/* Column 3: Operational & Reporting (Standard) - Span 3 */}
              <div className="lg:col-span-3 space-y-6">
                 {/* Operational Stats */}
                 <div className={cardBase}>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Staff & Usage</h3>
                    
                    <div className="mb-6 space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Absent Today</span>
                          <span className={`font-bold ${staffAbsentToday > 2 ? 'text-brand-red' : 'text-gray-800'}`}>{staffAbsentToday}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Vacancies</span>
                          <span className="font-bold text-brand-blue">2</span>
                       </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Top Active Users</h4>
                    <div className="space-y-3 mb-6">
                       {activeUsers.map((u, i) => (
                          <div key={i} className="space-y-1">
                             <div className="flex justify-between text-xs font-bold text-gray-700">
                                <span>{u.name}</span>
                                <span className="text-brand-green">{u.activity} acts</span>
                             </div>
                             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div style={{width: `${u.activity}%`}} className="h-full bg-brand-green rounded-full"></div>
                             </div>
                          </div>
                       ))}
                    </div>

                    <button onClick={() => setActiveTab('USERS')} className="text-xs font-bold text-brand-sky hover:underline w-full text-center">Manage User Access & Roles</button>
                 </div>

                 {/* Key Reports */}
                 <div className={cardBase}>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4">Performance</h3>
                    <div className="h-32 w-full mb-4">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceData}>
                             <Line type="monotone" dataKey="attendance" stroke="#1E3A8A" strokeWidth={3} dot={false}/>
                             <CartesianGrid stroke="#f3f4f6" vertical={false}/>
                             <XAxis dataKey="month" hide/>
                             <YAxis domain={[80, 100]} hide/>
                             <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                       <button 
                         onClick={() => handleGenerateReport('End-of-Term Report')}
                         className="w-full text-left px-3 py-2 text-xs font-bold text-brand-sky bg-brand-sky/5 rounded hover:bg-brand-sky/10 transition-colors flex justify-between items-center"
                       >
                          End-of-Term Report <FileText size={12}/>
                       </button>
                       <button 
                         onClick={() => handleGenerateReport('Financial Audit')}
                         className="w-full text-left px-3 py-2 text-xs font-bold text-brand-sky bg-brand-sky/5 rounded hover:bg-brand-sky/10 transition-colors flex justify-between items-center"
                       >
                          Financial Audit <FileText size={12}/>
                       </button>
                    </div>

                    <button 
                      onClick={() => handleGenerateReport('Custom Report')}
                      className={`w-full h-10 bg-brand-blue text-white text-xs ${buttonBaseClass}`}
                    >
                       Generate Custom Report
                    </button>
                 </div>
              </div>

           </div>
        </div>
      )}

      {/* --- TIMETABLE TAB --- */}
      {activeTab === 'TIMETABLE' && (
        <TimetableModule mode="ADMIN" />
      )}

      {/* --- ADMISSIONS KANBAN (New) --- */}
      {activeTab === 'ADMISSIONS' && (
        <div className="h-full flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-display font-bold text-xl text-gray-800">Enrollment Pipeline</h3>
                    <p className="text-sm text-gray-500">Drag and drop applications to move them through the admission stages.</p>
                </div>
                <div className="flex gap-2 text-sm font-bold text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-sky"></span> New</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-yellow"></span> Review</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-blue"></span> Offer</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-green"></span> Enrolled</span>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-[1000px] h-full">
                    {PIPELINE_STAGES.map(stage => (
                        <div 
                            key={stage.id} 
                            className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col min-h-[500px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            <div className={`p-4 border-b border-gray-200 rounded-t-xl border-t-4 ${stage.color}`}>
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-700">{stage.label}</h4>
                                    <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-500 shadow-sm">
                                        {applications.filter(a => a.stage === stage.id).length}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                {applications.filter(a => a.stage === stage.id).map(app => (
                                    <div 
                                        key={app.id} 
                                        draggable
                                        onDragStart={() => handleDragStart(app.id)}
                                        onClick={() => setSelectedAppId(app.id)}
                                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-gray-800 text-sm">{app.childName}</h5>
                                            <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100"/>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p className="flex items-center gap-1"><GraduationCap size={12}/> {app.targetGrade}</p>
                                            <p className="flex items-center gap-1"><Users size={12}/> {app.parentName}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right">{format(new Date(app.submissionDate), 'MMM d')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- HELP DESK TAB --- */}
      {activeTab === 'HELPDESK' && (
        <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Ticket Inbox */}
            <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-brand-blue"/> Inbox
                    </h3>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold bg-brand-yellow/10 text-brand-yellow px-2 py-1 rounded">Open</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Reuse Logic from previous step */}
                    {supportTickets.filter(t => t.status === 'OPEN').map(ticket => (
                        <div 
                            key={ticket.id} 
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${selectedTicketId === ticket.id ? 'bg-brand-blue/5 border-l-4 border-l-brand-blue' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-gray-800">{ticket.subject}</span>
                                <span className="text-[10px] text-gray-400">{format(new Date(ticket.date), 'dd MMM, HH:mm')}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{ticket.message}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-bold uppercase text-gray-500">{ticket.category}</span>
                                <span>From: <span className="font-bold text-gray-600">{ticket.parentName}</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-4 bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 flex flex-col">
                {selectedTicketId ? (
                    (() => {
                        const ticket = supportTickets.find(t => t.id === selectedTicketId);
                        if (!ticket) return null;
                        return (
                            <div className="flex flex-col h-full animate-fade-in">
                                <div className="mb-4 pb-4 border-b border-gray-100">
                                    <span className="text-[10px] font-bold text-brand-sky uppercase tracking-wider mb-1 block">{ticket.category} Ticket</span>
                                    <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2">{ticket.subject}</h3>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 overflow-y-auto">
                                    {ticket.message}
                                </div>
                                <div className="mt-auto">
                                    <textarea 
                                        value={ticketReply}
                                        onChange={(e) => setTicketReply(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none h-32 mb-3"
                                        placeholder="Type your response here..."
                                    ></textarea>
                                    <button 
                                        onClick={handleResolveTicket}
                                        disabled={!ticketReply || isSendingReply}
                                        className="w-full h-10 bg-brand-green text-white font-bold rounded-lg hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSendingReply ? <Loader2 className="animate-spin" size={16}/> : <><Check size={16}/> Send & Resolve</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6">
                        <MessageSquare size={48} className="mb-4 opacity-20"/>
                        <p className="text-sm font-medium">Select a ticket to reply.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* ... (Rest of existing code preserved) ... */}
      
      {activeTab === 'FINANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Finance Overview Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Collected</p>
                <p className="text-2xl font-display font-bold text-brand-green mt-1">KES {totalCollected.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-brand-green/10 rounded-full text-brand-green"><Wallet size={24}/></div>
            </div>
            <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding</p>
                <p className="text-2xl font-display font-bold text-brand-yellow mt-1">KES {outstandingTotal.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-brand-yellow/10 rounded-full text-brand-yellow"><CreditCard size={24}/></div>
            </div>
             <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 flex items-center justify-center hover:shadow-md transition-shadow">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className={`w-full h-12 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-brand-blue/20 ${buttonBaseClass}`}
              >
                Record Manual Payment
              </button>
            </div>
          </div>

          {/* Transaction List with Reactive Filtering */}
          <div className="lg:col-span-2 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-brand-blue">Recent Transactions</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search student..." 
                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all"
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 transition-all"
                  value={financeFilter}
                  onChange={(e) => setFinanceFilter(e.target.value as any)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-400 font-medium">
                    <th className="pb-3 pl-2">Student</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right pr-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-brand-grey/30 transition-colors group">
                      <td className="py-4 pl-2 font-medium text-gray-700 group-hover:text-brand-blue transition-colors">{tx.studentName}</td>
                      <td className="py-4 text-gray-500 capitalize">{tx.type.toLowerCase()}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-brand-grey text-gray-600 border border-gray-200">{tx.method}</span>
                      </td>
                      <td className="py-4 text-gray-500">{tx.date}</td>
                      <td className="py-4 text-right pr-2 font-mono font-medium text-brand-blue">
                        KES {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">No transactions found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
            <h3 className="font-display font-bold text-lg text-brand-blue mb-4 self-start">Revenue Stream</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tuition', value: 400 },
                      { name: 'Transport', value: 300 },
                      { name: 'Lunch', value: 200 },
                      { name: 'Uniform', value: 100 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-blue"></span>Tuition</span>
                <span>40%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-green"></span>Transport</span>
                <span>30%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... (Existing code for ALERTS, USERS, MODALS) ... */}
      
      {activeTab === 'SMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">
           {/* Header */}
           <div className="lg:col-span-12 flex justify-between items-center mb-2">
              <h2 className="font-display font-bold text-xl text-brand-blue flex items-center gap-2">
                 <MessageSquare size={24}/> Bulk Communication Interface
              </h2>
              <button onClick={handleClearDraft} className="text-sm font-bold text-brand-sky hover:text-brand-blue flex items-center gap-1 transition-colors">
                 <Trash2 size={16}/> Clear Draft
              </button>
           </div>

           {/* 1. Recipient Selection Card */}
           <div className="lg:col-span-4 space-y-6">
              <div className={cardBase + " h-full"}>
                 <div className="mb-4 pb-4 border-b border-gray-100">
                   <h3 className="font-sans font-bold text-gray-800 text-lg">Target Audience</h3>
                   <p className="text-xs text-gray-400 mt-1">Select who should receive this broadcast.</p>
                 </div>
                 
                 <div className="space-y-4">
                    {/* Audience Type Toggles */}
                    <div className="space-y-2">
                       <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${smsAudienceType === 'ALL' ? 'bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="audience" className="hidden" checked={smsAudienceType === 'ALL'} onChange={() => setSmsAudienceType('ALL')} />
                          <div className="flex-1">
                             <span className={`block text-sm font-bold ${smsAudienceType === 'ALL' ? 'text-brand-blue' : 'text-gray-700'}`}>Whole School</span>
                             <span className="text-xs text-gray-400">All active parent contacts</span>
                          </div>
                          {smsAudienceType === 'ALL' && <Check size={16} className="text-brand-blue"/>}
                       </label>

                       <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${smsAudienceType === 'GRADE' ? 'bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="audience" className="hidden" checked={smsAudienceType === 'GRADE'} onChange={() => setSmsAudienceType('GRADE')} />
                          <div className="flex-1">
                             <span className={`block text-sm font-bold ${smsAudienceType === 'GRADE' ? 'text-brand-blue' : 'text-gray-700'}`}>By Grade Level</span>
                             <span className="text-xs text-gray-400">Select specific grade</span>
                          </div>
                          {smsAudienceType === 'GRADE' && <Check size={16} className="text-brand-blue"/>}
                       </label>

                       <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${smsAudienceType === 'INDIVIDUAL' ? 'bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="audience" className="hidden" checked={smsAudienceType === 'INDIVIDUAL'} onChange={() => setSmsAudienceType('INDIVIDUAL')} />
                          <div className="flex-1">
                             <span className={`block text-sm font-bold ${smsAudienceType === 'INDIVIDUAL' ? 'text-brand-blue' : 'text-gray-700'}`}>Individual Student</span>
                             <span className="text-xs text-gray-400">Search for specific parent</span>
                          </div>
                          {smsAudienceType === 'INDIVIDUAL' && <Check size={16} className="text-brand-blue"/>}
                       </label>
                    </div>

                    {/* Conditional Filters */}
                    {smsAudienceType === 'GRADE' && (
                       <div className="animate-fade-in">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Grade</label>
                          <select 
                            value={smsTargetGrade}
                            onChange={(e) => setSmsTargetGrade(e.target.value)}
                            className={inputClass}
                          >
                             <option value="">-- Choose Grade --</option>
                             {uniqueGrades.map(g => (
                                <option key={g} value={g}>{g}</option>
                             ))}
                          </select>
                       </div>
                    )}

                    {smsAudienceType === 'INDIVIDUAL' && (
                       <div className="animate-fade-in relative">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Student Name</label>
                          <Search className="absolute left-3 top-9 text-gray-400" size={16}/>
                          <input 
                            type="text" 
                            value={smsSearchTerm}
                            onChange={(e) => setSmsSearchTerm(e.target.value)}
                            placeholder="e.g. John Doe"
                            className={`${inputClass} pl-10`}
                          />
                       </div>
                    )}
                 </div>
                 
                 {/* Count Feedback */}
                 <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase">Targeted Recipients</span>
                    <span className="bg-brand-sky/10 text-brand-sky px-3 py-1 rounded-full text-sm font-bold">
                       {recipientCount} Parents
                    </span>
                 </div>
              </div>
           </div>

           {/* 2. Message Composer & Summary */}
           <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Composer */}
              <div className={cardBase}>
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <h3 className="font-sans font-bold text-gray-800 text-lg">Message Composer</h3>
                    <div className="relative group">
                       <button className="text-xs font-bold text-brand-sky flex items-center gap-1 hover:underline">
                          <FileText size={14}/> Load Template
                       </button>
                       {/* Simple Template Dropdown Mock */}
                       <div className="absolute right-0 top-6 w-64 bg-white shadow-xl rounded-xl border border-gray-100 p-2 hidden group-hover:block z-20">
                          {smsTemplates.map((t, idx) => (
                             <div key={idx} onClick={() => setSmsMessage(t)} className="p-2 hover:bg-brand-grey text-xs text-gray-600 rounded cursor-pointer mb-1 last:mb-0">
                                {t.substring(0, 50)}...
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sender ID</label>
                       <input type="text" value="Mwangaza School" disabled className="w-full h-10 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-sm font-bold cursor-not-allowed"/>
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Body</label>
                       <textarea 
                          value={smsMessage}
                          onChange={(e) => setSmsMessage(e.target.value)}
                          className={`w-full h-40 p-4 rounded-lg border focus:ring-2 outline-none resize-none transition-all ${smsIsOverLimit ? 'border-brand-yellow focus:border-brand-yellow focus:ring-brand-yellow/20' : 'border-gray-200 focus:border-brand-sky focus:ring-brand-sky/20'}`}
                          placeholder="Type your message here..."
                       ></textarea>
                    </div>

                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold ${smsIsOverLimit ? 'text-brand-yellow' : 'text-gray-400'}`}>
                             {smsCharCount} / 160 Characters
                          </span>
                          {smsSegments > 1 && (
                             <span className="text-xs font-bold text-brand-yellow flex items-center gap-1 bg-brand-yellow/10 px-2 py-1 rounded">
                                <AlertCircle size={12}/> {smsSegments} Segments
                             </span>
                          )}
                       </div>
                       <div className="text-right">
                          <span className="block text-[10px] text-gray-400 font-bold uppercase">Est. Cost</span>
                          <span className="text-lg font-bold text-brand-blue font-mono">KES {smsTotalCost.toFixed(2)}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Summary & Actions */}
              <div className={cardBase + " bg-gray-50 border-gray-200"}>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 text-center md:text-left">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Recipients</p>
                          <p className="text-xl font-bold text-gray-800">{recipientCount}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Segments</p>
                          <p className="text-xl font-bold text-gray-800">{smsSegments}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Cost</p>
                          <p className="text-xl font-bold text-brand-blue">KES {smsTotalCost.toFixed(2)}</p>
                       </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                       <button className="flex-1 md:flex-none h-12 px-6 border border-brand-sky text-brand-sky font-bold rounded-xl hover:bg-brand-sky/10 transition-all flex items-center justify-center gap-2">
                          <Save size={18}/> Save Draft
                       </button>
                       <button 
                          onClick={() => setShowSmsConfirm(true)}
                          disabled={recipientCount === 0 || smsMessage.length === 0}
                          className="flex-1 md:flex-none h-12 px-8 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          <Send size={18}/> Send Message Now
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ... (Existing code for ALERTS, USERS, MODALS) ... */}
      
      {activeTab === 'ALERTS' && (
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
           <div className="p-6 border-b border-gray-100">
             <h3 className="font-display font-bold text-lg text-brand-blue">Critical Alerts & Approvals</h3>
           </div>
           <div className="divide-y divide-gray-50">
             {leaveRequests.map(req => (
               <div key={req.id} className="p-6 flex items-center justify-between hover:bg-brand-grey/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.status === 'PENDING' ? 'bg-brand-yellow/10 text-brand-yellow' : req.status === 'APPROVED' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                      {req.status === 'PENDING' ? '?' : req.status === 'APPROVED' ? <Check size={18}/> : <X size={18}/>}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{req.staffName}</h4>
                      <p className="text-sm text-gray-500">Requesting {req.days} days for {req.type}</p>
                    </div>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2">
                      {/* Old simple approve/reject logic kept for compatibility */}
                      <span className="text-xs text-gray-400 italic self-center">Go to HR Tab for details</span>
                    </div>
                  )}
                  {req.status !== 'PENDING' && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                      {req.status}
                    </span>
                  )}
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="max-w-2xl bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 animate-slide-up">
           <h3 className="font-display font-bold text-lg text-brand-blue mb-6 flex items-center gap-2">
            <UserPlus size={20}/> Invite New User
           </h3>
           <p className="text-sm text-gray-500 mb-6">Send an invitation email to add a new administrator, teacher, or parent to the system.</p>
           
           <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={inputClass}
                  placeholder="user@school.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className={inputClass}
                >
                  <option value={UserRole.TEACHER}>Teacher</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                  <option value={UserRole.PARENT}>Parent</option>
                </select>
              </div>
              <button 
                type="submit"
                className={`w-full h-12 bg-brand-blue text-white hover:bg-brand-blue/90 shadow-brand-blue/20 ${buttonBaseClass}`}
              >
                Send Invitation
              </button>
              {inviteStatus === 'SUCCESS' && (
                 <div className="p-4 bg-brand-green/10 text-brand-green text-sm font-bold rounded-lg text-center mt-4 border border-brand-green/20 animate-fade-in flex items-center justify-center gap-2">
                   <Check size={16}/> Invitation sent successfully!
                 </div>
              )}
           </form>
        </div>
      )}

      {/* ... MODALS ... */}
      
      {/* Application Detail Modal */}
      {selectedAppId && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-0 w-full max-w-2xl shadow-2xl relative animate-slide-up border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
              {(() => {
                  const app = applications.find(a => a.id === selectedAppId);
                  if(!app) return null;
                  return (
                      <>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div>
                                <h3 className="font-display font-bold text-xl text-gray-800">{app.childName}</h3>
                                <p className="text-sm text-gray-500">Applying for <span className="font-bold text-brand-blue">{app.targetGrade}</span></p>
                            </div>
                            <button onClick={() => setSelectedAppId(null)} className="text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Applicant Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">DOB</span> {app.dob}</div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Gender</span> {app.gender}</div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Parent</span> {app.parentName}</div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Contact</span> {app.parentPhone}</div>
                                <div className="col-span-2"><span className="block text-xs font-bold text-gray-400 uppercase">Email</span> {app.parentEmail}</div>
                            </div>

                            {/* Medical */}
                            {(app.hasAllergies || app.hasSpecialNeeds) && (
                                <div className="bg-brand-red/5 p-4 rounded-lg border border-brand-red/10">
                                    <h4 className="text-xs font-bold text-brand-red uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Medical Alerts</h4>
                                    {app.hasAllergies && <p className="text-sm mb-1"><span className="font-bold">Allergies:</span> {app.allergyDetails}</p>}
                                    {app.hasSpecialNeeds && <p className="text-sm"><span className="font-bold">Needs:</span> {app.specialNeedsDetails}</p>}
                                </div>
                            )}

                            {/* Documents */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Submitted Documents</h4>
                                <div className="flex gap-2">
                                    {[
                                        { label: 'Birth Cert', exists: app.docBirthCert },
                                        { label: 'Report Card', exists: app.docReportCard },
                                        { label: 'Immunization', exists: app.docImmunization }
                                    ].map(doc => (
                                        <div key={doc.label} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 ${doc.exists ? 'bg-white border-brand-green/30 text-brand-green' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                            {doc.exists ? <FileCheck size={14}/> : <X size={14}/>} {doc.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-3">
                            <button className="flex-1 h-10 border border-gray-200 bg-white rounded-lg text-gray-600 text-sm font-bold hover:bg-gray-100">
                                Request Info
                            </button>
                            {app.stage === 'OFFER_SENT' && (
                                <button onClick={handleEnroll} className="flex-1 h-10 bg-brand-green text-white rounded-lg text-sm font-bold hover:bg-brand-green/90 shadow-lg shadow-brand-green/20">
                                    Finalize Enrollment
                                </button>
                            )}
                            {app.stage !== 'OFFER_SENT' && app.stage !== 'ENROLLED' && (
                                <button onClick={() => { updateApplicationStage(app.id, 'OFFER_SENT'); setSelectedAppId(null); }} className="flex-1 h-10 bg-brand-blue text-white rounded-lg text-sm font-bold hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20">
                                    Approve & Send Offer
                                </button>
                            )}
                        </div>
                      </>
                  );
              })()}
           </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Record Payment</h3>
              <p className="text-sm text-gray-500 mb-6">Manually log a financial transaction.</p>

              <form onSubmit={handleManualPayment} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student</label>
                   <select 
                     value={paymentStudentId}
                     onChange={(e) => setPaymentStudentId(e.target.value)}
                     required
                     className={inputClass}
                   >
                     <option value="">Select Student</option>
                     {students.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount (KES)</label>
                     <input 
                       type="number"
                       value={paymentAmount}
                       onChange={(e) => setPaymentAmount(e.target.value)}
                       required
                       className={inputClass}
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
                     <select 
                       value={paymentMethod}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className={inputClass}
                     >
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank Transfer</option>
                        <option value="MPESA">MPesa</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Type</label>
                   <select 
                     value={paymentType}
                     onChange={(e) => setPaymentType(e.target.value)}
                     className={inputClass}
                   >
                      <option value="TUITION">Tuition Fee</option>
                      <option value="LUNCH">Lunch Fund</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="UNIFORM">Uniform</option>
                      <option value="TRIP">Trip / Activity</option>
                   </select>
                 </div>

                 <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isProcessingPayment}
                      className={`w-full h-12 bg-brand-blue text-white ${buttonBaseClass} flex items-center justify-center gap-2`}
                    >
                       {isProcessingPayment ? <Loader2 className="animate-spin" size={20}/> : 'Record Transaction'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowEventModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Create Event</h3>
              <p className="text-sm text-gray-500 mb-6">Add a new event to the school calendar.</p>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Event Title</label>
                   <input type="text" required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className={inputClass} placeholder="e.g., Science Trip" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                        <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
                        <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className={inputClass}>
                           <option value="GENERAL">General</option>
                           <option value="ACADEMIC">Academic / Exam</option>
                           <option value="HOLIDAY">Holiday</option>
                           <option value="TRIP">Trip / Activity</option>
                           <option value="STAFF">Staff Only</option>
                        </select>
                     </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Audience</label>
                    <select value={eventAudience} onChange={(e) => setEventAudience(e.target.value as EventAudience)} className={inputClass}>
                       <option value="WHOLE_SCHOOL">Whole School</option>
                       <option value="GRADE">Specific Grade</option>
                       <option value="CLASS">Specific Class</option>
                       <option value="STAFF">Staff Only</option>
                    </select>
                 </div>

                 {eventAudience === 'GRADE' && (
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Grade Level</label>
                       <select value={eventTargetGrade} onChange={(e) => setEventTargetGrade(e.target.value)} className={inputClass}>
                          <option value="">Select Grade</option>
                          {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                 )}

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none h-24" placeholder="Event details..."></textarea>
                 </div>

                 {eventType === 'TRIP' && (
                    <div className="bg-brand-green/5 p-4 rounded-lg border border-brand-green/20 space-y-3">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={eventRequiresConsent} onChange={(e) => setEventRequiresConsent(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                          <span className="text-sm font-bold text-gray-700">Requires Parental Consent?</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={eventRequiresPayment} onChange={(e) => setEventRequiresPayment(e.target.checked)} className="w-4 h-4 text-brand-green rounded" />
                          <span className="text-sm font-bold text-gray-700">Requires Payment?</span>
                       </label>
                       {eventRequiresPayment && (
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost (KES)</label>
                             <input type="number" value={eventCost} onChange={(e) => setEventCost(parseInt(e.target.value))} className={inputClass} placeholder="0.00" />
                          </div>
                       )}
                    </div>
                 )}

                 <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSavingEvent}
                      className={`w-full h-12 bg-brand-blue text-white ${buttonBaseClass} flex items-center justify-center gap-2`}
                    >
                       {isSavingEvent ? <Loader2 className="animate-spin" size={20}/> : 'Publish Event'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showSmsConfirm && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
              <button onClick={() => setShowSmsConfirm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-4 text-brand-blue flex items-center gap-2">
                 <AlertTriangle className="text-brand-yellow"/> Confirm Broadcast
              </h3>
              
              <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <div className="flex justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Recipients</span>
                    <span className="text-sm font-bold text-gray-800">{recipientCount}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Segments</span>
                    <span className="text-sm font-bold text-gray-800">{smsSegments} ({smsSegments * recipientCount} total SMS)</span>
                 </div>
                 <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Cost</span>
                    <span className="text-lg font-bold text-brand-blue">KES {smsTotalCost.toFixed(2)}</span>
                 </div>
              </div>

              {smsIsOverLimit && (
                 <div className="p-3 bg-brand-yellow/10 rounded-lg text-brand-yellow text-xs font-bold mb-6 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                    <p>Warning: Your message exceeds 160 characters. This will be charged as multiple SMS segments.</p>
                 </div>
              )}

              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowSmsConfirm(false)}
                   className="flex-1 h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleSendSms}
                   disabled={isSendingSms}
                   className="flex-1 h-12 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2"
                 >
                    {isSendingSms ? <Loader2 className="animate-spin" size={20}/> : 'Confirm & Send'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {rejectModalId && (
        <div className="fixed inset-0 bg-brand-red/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border-2 border-brand-red">
              <h3 className="text-xl font-display font-bold text-brand-red mb-2">Reject Request</h3>
              <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this leave request.</p>
              
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full h-24 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-red/20 outline-none mb-4"
                placeholder="Reason for rejection..."
              ></textarea>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setRejectModalId(null)}
                   className="flex-1 h-10 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleRejectLeave}
                   disabled={!rejectionReason}
                   className="flex-1 h-10 bg-brand-red text-white font-bold rounded-lg hover:bg-brand-red/90 disabled:opacity-50"
                 >
                    Confirm Rejection
                 </button>
              </div>
           </div>
        </div>
      )}

      {showCalendarConfirm && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-brand-blue">
              <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-4">
                     <Calendar size={28}/>
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-800 mb-2">Approve & Add to Calendar?</h3>
                  <p className="text-sm text-gray-500 mb-6">
                     Do you want to automatically add this leave to the official school calendar as a staff event?
                  </p>
                  
                  <div className="flex flex-col w-full gap-3">
                     <button 
                        onClick={() => handleApproveLeave(true)}
                        className="h-12 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90"
                     >
                        Yes, Add to Calendar
                     </button>
                     <button 
                        onClick={() => handleApproveLeave(false)}
                        className="h-12 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                     >
                        No, Just Approve
                     </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
