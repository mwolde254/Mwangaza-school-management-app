
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { FinanceTransaction, LeaveRequest, UserRole, SchoolEvent, EventType, EventAudience, LeaveType, AdmissionStage, SmsTemplate, StaffRecord, StaffRole, EmploymentStatus, AttendanceStatus } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Check, X, CreditCard, MessageSquare, Plus, Filter, Wallet, Search, UserPlus, Users, Activity, FileText, AlertTriangle, ArrowRight, LayoutDashboard, Loader2, Trash2, Save, Send, AlertCircle, Smartphone, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Briefcase, Stethoscope, Palmtree, Heart, Table, HelpCircle, GraduationCap, GripVertical, FileCheck, Mail, User, CheckCircle2, Bus, Map, Navigation, Fuel, Shield, Database, Server, Link, Edit3, UploadCloud, ChevronDown, History, Trophy, Star, Award } from 'lucide-react';
import { db } from '../services/db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, formatDistanceToNow, startOfWeek, endOfWeek } from 'date-fns';
import TimetableModule from '../components/TimetableModule';
import UserManagement from '../components/UserManagement';

// Brand Palette Mapping for Data Viz
const COLORS = ['#1E3A8A', '#059669', '#FCD34D', '#38BDF8'];

const AdminPortal: React.FC = () => {
  const { students, transactions, leaveRequests, resolveLeaveRequest, addTransaction, addEvent, deleteEvent, events, supportTickets, resolveSupportTicket, applications, updateApplicationStage, enrollApplicant, smsTemplates, transportRoutes, transportVehicles, transportLogs, addTransportRoute, staffRecords, addStaffRecord, updateStaffRecord, systemConfig, systemHealth, users, awardPoints, attendance } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FINANCE' | 'SMS' | 'ALERTS' | 'USERS' | 'CALENDAR' | 'HR' | 'TIMETABLE' | 'HELPDESK' | 'ADMISSIONS' | 'TRANSPORT' | 'REWARDS'>('DASHBOARD');

  // -- GLOBAL METRICS --
  const totalStudents = students.length;
  const staffCount = staffRecords.length; 
  
  // Real Attendance Calculation (Today)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysAttendance = attendance.filter(a => a.date === todayStr);
  const presentToday = todaysAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  // If no attendance taken, assume 0 rate or hide. If taken, calculate rate.
  // We'll calculate rate based on students who have a record for today.
  const attendanceRate = todaysAttendance.length > 0 
    ? Math.round((presentToday / todaysAttendance.length) * 100) 
    : 0;

  // Real Staff Absent Calculation
  const staffAbsentToday = leaveRequests.filter(req => 
    req.status === 'APPROVED' && 
    new Date(req.startDate) <= new Date() && 
    new Date(req.endDate) >= new Date()
  ).length;

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

  // -- SMS LOGIC & STATE --
  const [smsMessage, setSmsMessage] = useState('');
  const [smsAudienceType, setSmsAudienceType] = useState<'ALL' | 'GRADE' | 'INDIVIDUAL'>('ALL');
  const [smsTargetGrade, setSmsTargetGrade] = useState('');
  const [smsSearchTerm, setSmsSearchTerm] = useState('');
  const [showSmsConfirm, setShowSmsConfirm] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsNotification, setSmsNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Filter approved templates for usage
  const approvedTemplates = useMemo(() => {
      return smsTemplates.filter(t => t.status === 'APPROVED');
  }, [smsTemplates]);

  // -- HELP DESK STATE --
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');

  // -- ADMISSIONS STATE --
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // -- CALENDAR STATE --
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Event Form State
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

  // -- TRANSPORT STATE --
  const [transportMode, setTransportMode] = useState<'LIVE' | 'ROUTES' | 'LOGS'>('LIVE');
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  // Route Form
  const [routeName, setRouteName] = useState('');
  const [routeDriver, setRouteDriver] = useState('');
  const [routeVehicle, setRouteVehicle] = useState('');
  const [routeStops, setRouteStops] = useState<string[]>(['']);
  const [routeTime, setRouteTime] = useState('06:00');

  // -- HR STATE --
  const [hrMode, setHrMode] = useState<'RECORDS' | 'SYSTEM'>('RECORDS');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFilterRole, setStaffFilterRole] = useState('ALL');
  
  // Staff Form
  const [staffForm, setStaffForm] = useState<Partial<StaffRecord>>({
      fullName: '',
      email: '',
      phone: '',
      role: 'TEACHER',
      department: '',
      status: 'ACTIVE',
      startDate: '',
      salaryBand: '',
      qualifications: []
  });
  const [qualInput, setQualInput] = useState('');

  // -- HR / LEAVE STATE --
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCalendarConfirm, setShowCalendarConfirm] = useState<string | null>(null); // Stores leave ID to approve

  // -- REWARDS STATE --
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardTargetId, setAwardTargetId] = useState('');
  const [awardPointsVal, setAwardPointsVal] = useState(50);
  const [awardReason, setAwardReason] = useState('');

  const teacherLeaderboard = useMemo(() => {
      return users
        .filter(u => u.role === UserRole.TEACHER)
        .sort((a,b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users]);

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

  const handleClearDraft = () => {
    setSmsMessage('');
    setSmsAudienceType('ALL');
    setSmsTargetGrade('');
    setSmsSearchTerm('');
  };

  const handleSendSms = async () => {
    setIsSendingSms(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate API call
    setIsSendingSms(false);
    setShowSmsConfirm(false);
    setSmsNotification({ message: 'Message scheduled for delivery.', type: 'success' });
    setTimeout(() => {
        setSmsNotification(null);
        handleClearDraft();
    }, 3000);
  };

  const handleTemplateSelect = (content: string) => {
    setSmsMessage(content);
    setShowTemplatePicker(false);
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

  // -- HR LOGIC --
  const filteredStaff = useMemo(() => {
      return staffRecords.filter(s => {
          const matchesSearch = s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                s.email.toLowerCase().includes(staffSearch.toLowerCase());
          const matchesRole = staffFilterRole === 'ALL' || s.role === staffFilterRole;
          return matchesSearch && matchesRole;
      });
  }, [staffRecords, staffSearch, staffFilterRole]);

  const handleOpenStaffModal = (staff?: StaffRecord) => {
      if (staff) {
          setEditingStaffId(staff.id);
          setStaffForm(staff);
      } else {
          setEditingStaffId(null);
          setStaffForm({
            fullName: '',
            email: '',
            phone: '',
            role: 'TEACHER',
            department: '',
            status: 'ACTIVE',
            startDate: '',
            salaryBand: '',
            qualifications: []
          });
      }
      setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
      e.preventDefault();
      if(editingStaffId) {
          await updateStaffRecord(editingStaffId, staffForm);
      } else {
          await addStaffRecord(staffForm as StaffRecord);
      }
      setShowStaffModal(false);
      setSmsNotification({ message: 'Staff record updated successfully.', type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  const handleAddQualification = () => {
      if(qualInput.trim()) {
          setStaffForm(prev => ({ ...prev, qualifications: [...(prev.qualifications || []), qualInput.trim()] }));
          setQualInput('');
      }
  };

  const removeQualification = (idx: number) => {
      setStaffForm(prev => ({
          ...prev,
          qualifications: prev.qualifications?.filter((_, i) => i !== idx)
      }));
  };

  // -- REWARDS LOGIC --
  const handleAwardTeacher = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!awardTargetId || !awardPointsVal) return;
      await awardPoints(awardTargetId, 'TEACHER', awardPointsVal, awardReason, user?.id || 'ADMIN');
      setShowAwardModal(false);
      setAwardReason(''); setAwardTargetId('');
      setSmsNotification({ message: 'Points awarded successfully!', type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  const handleAwardTeacherOfTheMonth = () => {
      if (teacherLeaderboard.length > 0) {
          const winner = teacherLeaderboard[0];
          setSmsNotification({ message: `Announcement sent: ${winner.name} is Teacher of the Month!`, type: 'success' });
          setTimeout(() => setSmsNotification(null), 4000);
      }
  };

  // -- HELP DESK LOGIC --
  const filteredTickets = useMemo(() => {
      return supportTickets.filter(t => {
          const matchesStatus = t.status === ticketFilterStatus;
          const matchesSearch = t.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || 
                                t.parentName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                                (t.studentName && t.studentName.toLowerCase().includes(ticketSearchTerm.toLowerCase()));
          return matchesStatus && matchesSearch;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [supportTickets, ticketFilterStatus, ticketSearchTerm]);

  const selectedTicket = useMemo(() => {
      return supportTickets.find(t => t.id === selectedTicketId);
  }, [supportTickets, selectedTicketId]);

  const handleResolveTicket = async () => {
    if(!selectedTicketId || !ticketReply) return;
    setIsSendingReply(true);
    await resolveSupportTicket(selectedTicketId, ticketReply, user?.name || 'Admin');
    setIsSendingReply(false);
    // Keep selected to show the resolution
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

  const handleEnroll = async (appId?: string) => {
    const idToEnroll = appId || selectedAppId;
    if(idToEnroll) {
        await enrollApplicant(idToEnroll);
        setSmsNotification({ message: 'Student Enrolled Successfully!', type: 'success' });
        setSelectedAppId(null);
        setTimeout(() => setSmsNotification(null), 3000);
    }
  };

  // -- CALENDAR LOGIC --
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
      return events.filter(e => {
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          // Check if selectedDate is within range
          return selectedDate >= new Date(start.setHours(0,0,0,0)) && selectedDate <= new Date(end.setHours(23,59,59,999));
      }).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDate]);

  const openAddEventModal = () => {
      setEventStartDate(format(selectedDate, 'yyyy-MM-dd'));
      setEventEndDate(format(selectedDate, 'yyyy-MM-dd'));
      setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    await addEvent({
        title: eventTitle,
        startDate: new Date(eventStartDate).toISOString(),
        endDate: new Date(eventEndDate).toISOString(),
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
    setSmsNotification({ message: 'Event added to calendar.', type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
    
    // Reset Form
    setEventTitle(''); setEventStartDate(''); setEventEndDate(''); setEventType('GENERAL'); setEventAudience('WHOLE_SCHOOL'); 
    setEventDesc(''); setEventRequiresConsent(false); setEventRequiresPayment(false); setEventCost(0);
  };

  // -- TRANSPORT LOGIC --
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransportRoute({
      name: routeName,
      driverName: routeDriver,
      vehicleNumber: routeVehicle,
      stops: routeStops.filter(s => s.trim() !== ''),
      scheduleTime: routeTime
    });
    setShowAddRouteModal(false);
    setRouteName(''); setRouteDriver(''); setRouteVehicle(''); setRouteStops(['']);
    setSmsNotification({ message: 'New transport route added.', type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
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

  const getEventDotColor = (type: EventType) => {
    switch(type) {
       case 'ACADEMIC': return 'bg-brand-blue';
       case 'HOLIDAY': return 'bg-brand-yellow';
       case 'TRIP': return 'bg-brand-green';
       case 'STAFF': return 'bg-gray-500';
       default: return 'bg-brand-sky';
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

  // Mock Performance Data (Still mocked as this requires complex aggregating of multiple collections not in scope for simple context)
  const staffUtilizationData = [
    { name: 'Teacher A', load: 85, target: 80 },
    { name: 'Teacher B', load: 60, target: 80 },
    { name: 'Teacher C', load: 95, target: 80 },
    { name: 'Teacher D', load: 40, target: 80 },
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
             activeTab === 'ALERTS' ? 'Approvals & Alerts' : 
             activeTab === 'CALENDAR' ? 'School Calendar' : 
             activeTab === 'TIMETABLE' ? 'Academic Timetable' :
             activeTab === 'HELPDESK' ? 'Parent Help Desk' :
             activeTab === 'ADMISSIONS' ? 'Admissions Pipeline' :
             activeTab === 'TRANSPORT' ? 'Transport Intelligence' :
             activeTab === 'REWARDS' ? 'Staff Recognition' :
             activeTab === 'HR' ? 'HR & System Records' : 'User Management'}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'DASHBOARD' ? 'Here is the system overview for today.' : 'Manage system records.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['DASHBOARD', 'FINANCE', 'TIMETABLE', 'ADMISSIONS', 'SMS', 'HELPDESK', 'TRANSPORT', 'REWARDS', 'CALENDAR', 'HR', 'USERS', 'ALERTS'].map(tab => (
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
              {tab === 'TRANSPORT' && <Bus size={16}/>}
              {tab === 'ALERTS' && <AlertTriangle size={16}/>}
              {tab === 'REWARDS' && <Trophy size={16}/>}
              <span className="capitalize">{tab === 'HR' ? 'HR & Staff' : tab === 'SMS' ? 'SMS' : tab === 'HELPDESK' ? 'Help Desk' : tab === 'TRANSPORT' ? 'Transport' : tab.toLowerCase()}</span>
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
              {/* Recent Finance */}
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

              {/* Pending Leaves & Alerts */}
              <div className={cardBase}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-bold text-lg text-gray-800">Alerts & Approvals</h3>
                    <button onClick={() => setActiveTab('ALERTS')} className="text-xs font-bold text-brand-blue hover:underline">View All</button>
                 </div>
                 <div className="space-y-3">
                    {/* Staff Absence Alert */}
                    {staffAbsentToday > 0 && (
                        <div className="flex justify-between items-center p-3 bg-brand-red/5 rounded-lg border border-brand-red/20">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-brand-red"/>
                                <p className="text-sm font-bold text-gray-700">{staffAbsentToday} Staff Absent Today</p>
                            </div>
                            <span className="text-xs font-bold bg-brand-red text-white px-2 py-1 rounded">ALERT</span>
                        </div>
                    )}

                    {pendingLeaves.length > 0 ? pendingLeaves.slice(0, 3).map(l => (
                        <div key={l.id} className="flex justify-between items-center p-3 bg-brand-yellow/5 rounded-lg border border-brand-yellow/20">
                            <div>
                                <p className="text-sm font-bold text-gray-700">{l.staffName}</p>
                                <p className="text-xs text-gray-500">{l.type} Leave ({l.days} days)</p>
                            </div>
                            <span className="text-xs font-bold bg-brand-yellow text-brand-blue px-2 py-1 rounded">PENDING</span>
                        </div>
                    )) : (
                        staffAbsentToday === 0 && <p className="text-center text-gray-400 italic py-4">No pending alerts.</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- REWARDS VIEW --- */}
      {activeTab === 'REWARDS' && (
          <div className="space-y-6 animate-slide-up">
              {/* Leaderboard Header */}
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Top Performer Spotlight */}
                  <div className="md:w-1/3 bg-gradient-to-br from-brand-blue to-blue-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow rounded-full blur-3xl opacity-20 transform translate-x-10 -translate-y-10"></div>
                      <div className="relative z-10 flex flex-col items-center text-center">
                          <Trophy size={48} className="text-brand-yellow mb-4" />
                          <h3 className="text-brand-yellow text-sm font-bold uppercase tracking-widest mb-1">Leading This Month</h3>
                          <p className="text-2xl font-display font-bold mb-6">{teacherLeaderboard[0]?.name || 'N/A'}</p>
                          <div className="bg-white/10 rounded-full px-6 py-2 mb-6">
                              <span className="text-3xl font-bold font-display">{teacherLeaderboard[0]?.totalPoints || 0}</span> <span className="text-xs uppercase text-blue-200">Points</span>
                          </div>
                          <button 
                            onClick={handleAwardTeacherOfTheMonth}
                            className="w-full py-3 bg-brand-yellow text-brand-blue font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg flex items-center justify-center gap-2"
                          >
                              <Award size={18}/> Award Teacher of Month
                          </button>
                      </div>
                  </div>

                  {/* Top 3 List */}
                  <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-display font-bold text-lg text-gray-800">Top Performers</h3>
                          <button onClick={() => setShowAwardModal(true)} className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                              <Plus size={14}/> Manual Award
                          </button>
                      </div>
                      <div className="space-y-4">
                          {teacherLeaderboard.slice(0, 3).map((teacher, idx) => (
                              <div key={teacher.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-brand-yellow text-brand-blue' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-200 text-orange-800'}`}>
                                      {idx + 1}
                                  </div>
                                  <img src={teacher.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                                  <div className="flex-1">
                                      <p className="font-bold text-gray-800 text-sm">{teacher.name}</p>
                                      <p className="text-xs text-gray-500">Teacher</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="block font-bold text-brand-green text-lg">{teacher.totalPoints || 0}</span>
                                      <span className="text-[10px] text-gray-400 uppercase">Points</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Full Leaderboard Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-display font-bold text-gray-800">Staff Performance Ranking</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="text-gray-500 font-bold text-xs uppercase border-b border-gray-100 bg-white">
                              <tr>
                                  <th className="px-6 py-4">Rank</th>
                                  <th className="px-6 py-4">Teacher</th>
                                  <th className="px-6 py-4 text-center">Score</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {teacherLeaderboard.map((teacher, idx) => (
                                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4 font-mono text-gray-500">#{idx + 1}</td>
                                      <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                                          <img src={teacher.avatarUrl} className="w-8 h-8 rounded-full" alt=""/>
                                          {teacher.name}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full font-bold">{teacher.totalPoints || 0}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => { setAwardTargetId(teacher.id); setShowAwardModal(true); }}
                                            className="text-xs font-bold text-brand-blue hover:bg-brand-blue/10 px-3 py-1.5 rounded transition-colors"
                                          >
                                              Award Points
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- USERS VIEW --- */}
      {activeTab === 'USERS' && (
          <UserManagement />
      )}

      {/* --- TIMETABLE VIEW --- */}
      {activeTab === 'TIMETABLE' && (
          <TimetableModule mode="ADMIN" />
      )}

      {/* --- HELP DESK VIEW --- */}
      {activeTab === 'HELPDESK' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] animate-slide-up">
            {/* Ticket List */}
            <div className="lg:col-span-1 bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-display font-bold text-gray-800">Support Tickets</h3>
                        <span className="text-xs font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded">{openTickets.length} Open</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <button 
                            onClick={() => setTicketFilterStatus('OPEN')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded ${ticketFilterStatus === 'OPEN' ? 'bg-brand-blue text-white' : 'bg-white border text-gray-500'}`}
                        >
                            Open
                        </button>
                        <button 
                            onClick={() => setTicketFilterStatus('RESOLVED')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded ${ticketFilterStatus === 'RESOLVED' ? 'bg-brand-green text-white' : 'bg-white border text-gray-500'}`}
                        >
                            Resolved
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            value={ticketSearchTerm}
                            onChange={(e) => setTicketSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:border-brand-blue outline-none"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredTickets.map(ticket => (
                        <div 
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTicketId === ticket.id ? 'bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue/20' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-xs text-gray-700 truncate w-2/3">{ticket.subject}</span>
                                <span className="text-[10px] text-gray-400">{format(new Date(ticket.date), 'MMM dd')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                                <User size={10}/> {ticket.parentName}
                            </div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{ticket.category}</span>
                        </div>
                    ))}
                    {filteredTickets.length === 0 && (
                        <div className="text-center py-8 text-gray-400 italic text-xs">No tickets found.</div>
                    )}
                </div>
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2 bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {selectedTicket ? (
                    <>
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                            <div>
                                <h2 className="font-display font-bold text-xl text-gray-800 mb-1">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><User size={14}/> {selectedTicket.parentName}</span>
                                    <span>•</span>
                                    <span className="font-mono text-xs">{selectedTicket.studentName || 'General Inquiry'}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedTicket.status === 'OPEN' ? 'bg-brand-yellow/20 text-brand-yellow-700' : 'bg-brand-green/20 text-brand-green'}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-bold">{format(new Date(selectedTicket.date), 'dd MMM yyyy, HH:mm')}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                            {/* Parent Message */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-grey flex items-center justify-center text-gray-500 shrink-0">
                                    <User size={20}/>
                                </div>
                                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                                </div>
                            </div>

                            {/* Admin Response (If any) */}
                            {selectedTicket.adminResponse && (
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center shrink-0">
                                        <Shield size={20}/>
                                    </div>
                                    <div className="bg-brand-blue/10 p-4 rounded-2xl rounded-tr-none max-w-[80%] border border-brand-blue/20">
                                        <div className="text-xs font-bold text-brand-blue mb-1 flex justify-between">
                                            <span>{selectedTicket.resolvedBy}</span>
                                            <span>{selectedTicket.resolvedAt && format(new Date(selectedTicket.resolvedAt), 'HH:mm')}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reply Box */}
                        {selectedTicket.status === 'OPEN' && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reply & Resolve</label>
                                <div className="flex gap-2">
                                    <textarea 
                                        value={ticketReply}
                                        onChange={(e) => setTicketReply(e.target.value)}
                                        className="flex-1 h-20 p-3 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm resize-none"
                                        placeholder="Type your response here..."
                                    ></textarea>
                                    <button 
                                        onClick={handleResolveTicket}
                                        disabled={!ticketReply || isSendingReply}
                                        className="w-24 bg-brand-blue text-white rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-brand-blue/90 disabled:opacity-50"
                                    >
                                        {isSendingReply ? <Loader2 size={16} className="animate-spin"/> : <><Send size={16}/> Send</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={48} className="mb-4 opacity-20"/>
                        <p className="text-sm">Select a ticket to view details.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- CALENDAR VIEW --- */}
      {activeTab === 'CALENDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] animate-slide-up">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-bold text-xl text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 border border-gray-200 rounded hover:bg-gray-50"><ChevronLeft size={16}/></button>
                        <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-2 border border-gray-200 rounded text-xs font-bold hover:bg-gray-50">Today</button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 border border-gray-200 rounded hover:bg-gray-50"><ChevronRight size={16}/></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">
                            {day}
                        </div>
                    ))}
                    {calendarDays.map((day, idx) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));
                        return (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedDate(day)}
                                className={`bg-white min-h-[80px] p-2 cursor-pointer transition-colors relative hover:bg-brand-sky/5 ${
                                    !isSameMonth(day, currentMonth) ? 'bg-gray-50/50 text-gray-300' : ''
                                } ${isSameDay(day, selectedDate) ? 'ring-2 ring-brand-blue ring-inset z-10' : ''}`}
                            >
                                <span className={`text-xs font-bold ${isToday(day) ? 'bg-brand-blue text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 3).map(e => (
                                        <div key={e.id} className={`text-[10px] truncate px-1 rounded ${getEventColor(e.type)}`}>
                                            {e.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[9px] text-gray-400 font-bold pl-1">+{dayEvents.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event List Sidebar */}
            <div className="lg:col-span-1 bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-display font-bold text-gray-800">{format(selectedDate, 'EEEE')}</h3>
                        <p className="text-sm text-gray-500">{format(selectedDate, 'MMMM do, yyyy')}</p>
                    </div>
                    <button 
                        onClick={openAddEventModal}
                        className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center hover:bg-brand-blue/90 shadow-lg"
                    >
                        <Plus size={18}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {selectedDayEvents.length > 0 ? selectedDayEvents.map(e => (
                        <div key={e.id} className="p-3 border border-gray-100 rounded-lg group relative hover:shadow-sm transition-all">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getEventDotColor(e.type)}`}></div>
                            <div className="pl-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-800 text-sm">{e.title}</h4>
                                    <button onClick={() => deleteEvent(e.id)} className="text-gray-300 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[8px] border ${getEventDotColor(e.type).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                                        {e.type}
                                    </span>
                                    <span>{e.audience === 'GRADE' ? e.targetGrade : 'All School'}</span>
                                </div>
                                {e.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{e.description}</p>}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-400 italic">
                            <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                            <p className="text-sm">No events scheduled.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- TRANSPORT VIEW --- */}
      {activeTab === 'TRANSPORT' && (
        <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col animate-slide-up">
            {/* Transport Sub-Nav */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
                {['LIVE', 'ROUTES', 'LOGS'].map(m => (
                    <button 
                        key={m}
                        onClick={() => setTransportMode(m as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${transportMode === m ? 'bg-brand-blue text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {m === 'LIVE' ? 'Live Dashboard' : m === 'ROUTES' ? 'Routes & Fleet' : 'Trip Logs'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {transportMode === 'LIVE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                        {/* Status Sidebar */}
                        <div className="lg:col-span-4 bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-display font-bold text-gray-800">Active Fleet Status</h3>
                                <p className="text-xs text-gray-500">Real-time updates from vehicle GPS</p>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {transportVehicles.map(v => {
                                    const route = transportRoutes.find(r => r.id === v.routeId);
                                    return (
                                        <div key={v.id} className="p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-all bg-white group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-brand-blue text-sm">{route?.vehicleNumber}</h4>
                                                    <p className="text-xs text-gray-500">{route?.name}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    v.status === 'ON_ROUTE' ? 'bg-brand-green/10 text-brand-green' : 
                                                    v.status === 'DELAYED' ? 'bg-brand-red/10 text-brand-red' : 
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {v.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Navigation size={12}/> {v.nextStop}
                                                </div>
                                                <div className="flex items-center gap-1 font-mono">
                                                    <Clock size={12}/> ETA: {v.etaToNextStop}
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
                                                <span>Speed: {Math.round(v.speed)} km/h</span>
                                                <span>Driver: {route?.driverName}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Live Map Visualization */}
                        <div className="lg:col-span-8 bg-gray-100 rounded-[12px] border border-gray-200 shadow-inner relative overflow-hidden flex items-center justify-center">
                            {/* Simulated Map Background */}
                            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                            
                            {/* Map Markers */}
                            {transportVehicles.map(v => (
                                <div 
                                    key={v.id}
                                    className="absolute transition-all duration-[5000ms] ease-linear flex flex-col items-center"
                                    style={{ left: `${v.currentLocation.x}%`, top: `${v.currentLocation.y}%` }}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white ${
                                        v.status === 'ON_ROUTE' ? 'bg-brand-green' : 
                                        v.status === 'DELAYED' ? 'bg-brand-red' : 'bg-gray-500'
                                    }`}>
                                        <Bus size={14}/>
                                    </div>
                                    <div className="mt-1 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap backdrop-blur-sm">
                                        {transportRoutes.find(r => r.id === v.routeId)?.vehicleNumber}
                                    </div>
                                </div>
                            ))}

                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow text-xs text-gray-500">
                                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-brand-green"></span> On Time</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-red"></span> Delayed</div>
                            </div>
                        </div>
                    </div>
                )}

                {transportMode === 'ROUTES' && (
                    <div className="h-full bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-display font-bold text-gray-800">Route Management</h3>
                            <button onClick={() => setShowAddRouteModal(true)} className="px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-brand-blue/90">
                                <Plus size={16}/> Add New Route
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {transportRoutes.map(route => (
                                <div key={route.id} className="border border-gray-200 rounded-xl p-4 hover:border-brand-blue/30 transition-all bg-gray-50/50 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{route.name}</h4>
                                            <p className="text-xs text-gray-500">{route.vehicleNumber}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-brand-blue">
                                            <Map size={16}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <User size={12}/> {route.driverName}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Clock size={12}/> Departs: {route.scheduleTime}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 text-xs">
                                        <span className="font-bold text-gray-400 uppercase block mb-1">Stops</span>
                                        <div className="flex flex-wrap gap-1">
                                            {route.stops.map((stop, idx) => (
                                                <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex items-center">
                                                    {stop}
                                                    {idx < route.stops.length - 1 && <ChevronRight size={10} className="ml-1 text-gray-300"/>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transportMode === 'LOGS' && (
                    <div className="h-full bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-display font-bold text-gray-800">Trip Logs & Compliance</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Route</th>
                                        <th className="px-6 py-3">Driver</th>
                                        <th className="px-6 py-3">Time</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Delay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transportLogs.map(log => {
                                        const route = transportRoutes.find(r => r.id === log.routeId);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-mono text-gray-600">{log.date}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800">{route?.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{log.driverName}</td>
                                                <td className="px-6 py-4 text-gray-500">{log.departureTime} - {log.arrivalTime}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'ON_TIME' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                                                        {log.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-600">
                                                    {log.delayMinutes ? `+${log.delayMinutes} min` : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Route Modal */}
            {showAddRouteModal && (
                <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100">
                        <button onClick={() => setShowAddRouteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
                        <h3 className="text-xl font-display font-bold mb-6 text-brand-blue">Add Transport Route</h3>
                        <form onSubmit={handleSaveRoute} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Route Name</label>
                                <input type="text" required value={routeName} onChange={(e) => setRouteName(e.target.value)} className={inputClass} placeholder="e.g. South C Express" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle No.</label>
                                    <input type="text" required value={routeVehicle} onChange={(e) => setRouteVehicle(e.target.value)} className={inputClass} placeholder="KBA..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Schedule Time</label>
                                    <input type="time" required value={routeTime} onChange={(e) => setRouteTime(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Driver Name</label>
                                <input type="text" required value={routeDriver} onChange={(e) => setRouteDriver(e.target.value)} className={inputClass} placeholder="Driver Full Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stops (Comma Separated)</label>
                                <textarea 
                                    className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none h-24" 
                                    placeholder="Stop 1, Stop 2, Stop 3..."
                                    value={routeStops.join(', ')}
                                    onChange={(e) => setRouteStops(e.target.value.split(',').map(s => s.trim()))}
                                ></textarea>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className={`w-full h-12 bg-brand-blue text-white ${buttonBaseClass} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90`}>Save Route Configuration</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- SMS / COMMUNICATIONS VIEW --- */}
      {activeTab === 'SMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] animate-slide-up">
            {/* Compose Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[12px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                            <MessageSquare size={20} className="text-brand-blue"/> Compose Broadcast
                        </h3>
                        {approvedTemplates.length > 0 && (
                            <button 
                                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                                className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                            >
                                <FileText size={14}/> Use Template
                            </button>
                        )}
                    </div>

                    {showTemplatePicker && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {approvedTemplates.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleTemplateSelect(t.content)}
                                    className="text-left p-2 bg-white border border-gray-200 rounded hover:border-brand-sky hover:shadow-sm text-xs"
                                >
                                    <span className="font-bold text-gray-700 block">{t.name}</span>
                                    <span className="text-gray-400 truncate block">{t.content.substring(0, 30)}...</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Audience Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Audience</label>
                            <div className="flex gap-2">
                                {['ALL', 'GRADE', 'INDIVIDUAL'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSmsAudienceType(type as any)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                                            smsAudienceType === type 
                                                ? 'bg-brand-blue text-white border-brand-blue' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type === 'ALL' ? 'Whole School' : type === 'GRADE' ? 'Specific Grade' : 'Individual'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conditional Inputs */}
                        {smsAudienceType === 'GRADE' && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Grade</label>
                                <select 
                                    value={smsTargetGrade}
                                    onChange={(e) => setSmsTargetGrade(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">-- Select Grade --</option>
                                    {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        )}

                        {smsAudienceType === 'INDIVIDUAL' && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Student</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input 
                                        type="text" 
                                        value={smsSearchTerm}
                                        onChange={(e) => setSmsSearchTerm(e.target.value)}
                                        className={`${inputClass} pl-10`}
                                        placeholder="Name or Admission Number..."
                                    />
                                </div>
                                {targetedRecipients.length > 0 && smsSearchTerm && (
                                    <div className="mt-2 text-xs text-brand-green font-bold flex items-center gap-1">
                                        <Check size={12}/> {targetedRecipients[0].name} selected
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message Body */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Content</label>
                            <textarea 
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                className="w-full h-32 p-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white resize-none"
                                placeholder="Type your message here..."
                            ></textarea>
                            <div className="flex justify-between items-center mt-2">
                                <span className={`text-xs font-bold ${smsIsOverLimit ? 'text-brand-red' : 'text-gray-400'}`}>
                                    {smsCharCount} chars ({smsSegments} SMS)
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                    Est. Cost: <span className="text-brand-blue">KES {smsTotalCost.toFixed(2)}</span>
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                onClick={handleClearDraft}
                                className="px-6 h-12 border border-gray-200 text-gray-600 rounded-[12px] font-bold hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={() => setShowSmsConfirm(true)}
                                disabled={!smsMessage || (smsAudienceType === 'GRADE' && !smsTargetGrade) || (smsAudienceType === 'INDIVIDUAL' && targetedRecipients.length === 0)}
                                className="px-8 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send size={18}/> Review & Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Column */}
            <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
                        <History size={18} className="text-gray-500"/> Recent Blasts
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {/* Mock History Items */}
                    {[
                        { id: 1, date: 'Today, 10:30 AM', target: 'Grade 4 Parents', status: 'Delivered', msg: 'Reminder: Science Trip tomorrow...' },
                        { id: 2, date: 'Yesterday, 4:00 PM', target: 'Whole School', status: 'Delivered', msg: 'School closes at 3PM on Friday...' },
                        { id: 3, date: 'Oct 24, 9:00 AM', target: 'Staff', status: 'Failed', msg: 'Meeting rescheduled to 10AM.' },
                    ].map(log => (
                        <div key={log.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{log.date}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    log.status === 'Delivered' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'
                                }`}>
                                    {log.status}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-brand-blue mb-1">{log.target}</p>
                            <p className="text-xs text-gray-600 line-clamp-2">"{log.msg}"</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showSmsConfirm && (
                <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100">
                        <h3 className="font-display font-bold text-xl text-brand-blue mb-4">Confirm Broadcast</h3>
                        <div className="space-y-3 mb-6 text-sm text-gray-600">
                            <p>You are about to send a message to <span className="font-bold text-gray-800">{recipientCount} recipients</span>.</p>
                            <p>Estimated Cost: <span className="font-bold text-gray-800">KES {smsTotalCost.toFixed(2)}</span></p>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs italic text-gray-500">
                                "{smsMessage}"
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSmsConfirm(false)} 
                                className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendSms}
                                disabled={isSendingSms}
                                className="flex-1 h-10 bg-brand-blue text-white rounded-lg font-bold shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2"
                            >
                                {isSendingSms ? <Loader2 className="animate-spin" size={16}/> : 'Confirm Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- FINANCE VIEW --- */}
      {activeTab === 'FINANCE' && (
          <div className="space-y-6 animate-slide-up">
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Summary Cards */}
                  <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Collected</p>
                      <p className="text-3xl font-display font-bold text-brand-green">KES {totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 text-xs font-bold uppercase mb-1">Outstanding Fees</p>
                      <p className="text-3xl font-display font-bold text-brand-red">KES {outstandingTotal.toLocaleString()}</p>
                  </div>
              </div>

              {/* Transactions Table */}
              <div className={cardBase}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                      <h3 className="font-display font-bold text-lg text-gray-800">Financial Records</h3>
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-brand-blue text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-blue/90"
                      >
                          Record Payment
                      </button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                              <tr>
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3">Student</th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3">Method</th>
                                  <th className="px-4 py-3 text-right">Amount</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredTransactions.map(t => (
                                  <tr key={t.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-gray-500">{t.date}</td>
                                      <td className="px-4 py-3 font-bold text-gray-700">{t.studentName}</td>
                                      <td className="px-4 py-3 text-xs font-bold uppercase text-gray-500">{t.type}</td>
                                      <td className="px-4 py-3 text-gray-600">{t.method}</td>
                                      <td className="px-4 py-3 text-right font-mono text-brand-green">+{t.amount.toLocaleString()}</td>
                                      <td className="px-4 py-3 text-center">
                                          <span className="bg-brand-green/10 text-brand-green px-2 py-1 rounded text-[10px] font-bold">{t.status}</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADMISSIONS VIEW --- */}
      {activeTab === 'ADMISSIONS' && (
          <div className="h-[calc(100vh-200px)] flex flex-col animate-slide-up">
              <div className="flex gap-4 overflow-x-auto pb-4 h-full custom-scrollbar">
                  {PIPELINE_STAGES.map(stage => {
                      const stageApps = applications.filter(a => a.stage === stage.id);
                      return (
                          <div key={stage.id} className="min-w-[280px] w-[280px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 max-h-full">
                              {/* Column Header */}
                              <div className={`p-3 border-b border-gray-200 rounded-t-xl font-bold text-sm flex justify-between items-center ${stage.color}`}>
                                  <span>{stage.label}</span>
                                  <span className="bg-white/50 px-2 py-0.5 rounded text-xs">{stageApps.length}</span>
                              </div>
                              
                              {/* Droppable Area (Mock) */}
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
                                        onClick={() => setSelectedAppId(app.id)}
                                        className={`bg-white p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md transition-all ${selectedAppId === app.id ? 'ring-2 ring-brand-blue border-brand-blue' : 'border-gray-200'}`}
                                      >
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="font-bold text-sm text-gray-800">{app.childName}</span>
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
                                                    onClick={(e) => { e.stopPropagation(); handleEnroll(app.id); }}
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
          </div>
      )}

      {/* --- ALERTS (APPROVALS) VIEW --- */}
      {activeTab === 'ALERTS' && (
          <div className="max-w-4xl animate-slide-up">
              <h3 className="font-display font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={24} className="text-brand-yellow"/> Outstanding Approvals
              </h3>
              
              <div className="space-y-4">
                  {pendingLeaves.map(req => (
                      <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-800 text-sm">{req.staffName}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{req.type} Leave</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{req.reason}</p>
                              <p className="text-xs text-gray-400 font-mono">
                                  {format(new Date(req.startDate), 'dd MMM')} - {format(new Date(req.endDate), 'dd MMM')} ({req.days} days)
                              </p>
                          </div>
                          <div className="flex gap-3">
                              <button 
                                onClick={() => { setRejectModalId(req.id); setRejectionReason(''); }}
                                className="px-4 py-2 border border-brand-red text-brand-red text-xs font-bold rounded-lg hover:bg-brand-red/5"
                              >
                                  Reject
                              </button>
                              <button 
                                onClick={() => { setShowCalendarConfirm(req.id); handleApproveLeave(true); }}
                                className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 flex items-center gap-2"
                              >
                                  <Check size={14}/> Approve
                              </button>
                          </div>
                      </div>
                  ))}
                  {pendingLeaves.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 text-gray-400">
                          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                          <p>All caught up! No pending approvals.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- HR & SYSTEM VIEW --- */}
      {activeTab === 'HR' && (
        <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col animate-slide-up">
            {/* Sub-Nav */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
                <button 
                    onClick={() => setHrMode('RECORDS')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${hrMode === 'RECORDS' ? 'bg-brand-blue text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Staff Directory
                </button>
                <button 
                    onClick={() => setHrMode('SYSTEM')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${hrMode === 'SYSTEM' ? 'bg-brand-blue text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    System Oversight
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {hrMode === 'RECORDS' && (
                    <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm flex flex-col h-full">
                        {/* Directory Header */}
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex gap-4 w-full md:w-auto flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Search Staff..." 
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                        className={`${inputClass} h-10 pl-9 text-sm`}
                                    />
                                </div>
                                <select 
                                    value={staffFilterRole}
                                    onChange={(e) => setStaffFilterRole(e.target.value)}
                                    className={`${inputClass} h-10 w-40 text-sm`}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="TEACHER">Teachers</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPPORT">Support</option>
                                    <option value="TRANSPORT">Transport</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 border border-brand-blue text-brand-blue rounded-lg text-xs font-bold hover:bg-brand-blue/5 transition-all flex items-center gap-2">
                                    <UploadCloud size={14}/> Bulk Upload
                                </button>
                                <button 
                                    onClick={() => handleOpenStaffModal()}
                                    className="px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue/90 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14}/> Add Staff
                                </button>
                            </div>
                        </div>

                        {/* Staff Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Staff Member</th>
                                        <th className="px-6 py-3">Role & Dept</th>
                                        <th className="px-6 py-3">Contact</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStaff.map(staff => (
                                        <tr key={staff.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{staff.fullName}</div>
                                                <div className="text-xs text-gray-400">Joined: {staff.startDate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-brand-blue text-xs bg-brand-blue/5 px-2 py-0.5 rounded mr-2">{staff.role}</span>
                                                <span className="text-gray-500">{staff.department}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-1"><Mail size={12}/> {staff.email}</div>
                                                <div className="flex items-center gap-1 mt-1"><Smartphone size={12}/> {staff.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    staff.status === 'ACTIVE' ? 'bg-brand-green/10 text-brand-green' : 
                                                    staff.status === 'ON_LEAVE' ? 'bg-brand-yellow/10 text-brand-yellow' : 
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {staff.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleOpenStaffModal(staff)}
                                                    className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-full transition-all"
                                                >
                                                    <Edit3 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400 italic">No staff records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {hrMode === 'SYSTEM' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                        
                        {/* 1. Core System Variables */}
                        <div className={cardBase + " space-y-4"}>
                            <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Database size={20} className="text-brand-blue"/> Core System Configuration
                            </h3>
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Academic Year</span>
                                    <span className="font-mono font-bold text-gray-800">{systemConfig?.academicYear || '2023'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Current Term</span>
                                    <span className="font-mono font-bold text-gray-800">{systemConfig?.currentTerm || 'Term 3'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Base Currency</span>
                                    <span className="font-mono font-bold text-gray-800">{systemConfig?.currency || 'KES'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Last Updated</span>
                                    <span className="text-xs text-gray-500">
                                        {systemConfig?.lastModifiedDate ? format(new Date(systemConfig.lastModifiedDate), 'dd MMM yyyy') : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <span className="text-[10px] text-gray-400 italic">Config managed by: {systemConfig?.lastModifiedBy || 'Admin'}</span>
                            </div>
                        </div>

                        {/* 2. Data Health Check */}
                        <div className={cardBase + " space-y-4"}>
                            <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Activity size={20} className="text-brand-green"/> Data Health Check
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded text-gray-500"><Link size={16}/></div>
                                        <span className="text-sm font-bold text-gray-700">Unlinked Students</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        (systemHealth?.unlinkedStudents || 0) > 0 ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-green/10 text-brand-green'
                                    }`}>
                                        {systemHealth?.unlinkedStudents || 0} Found
                                    </span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded text-gray-500"><Server size={16}/></div>
                                        <span className="text-sm font-bold text-gray-700">Finance API Status</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        systemHealth?.financeApiStatus === 'ACTIVE' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'
                                    }`}>
                                        {systemHealth?.financeApiStatus || 'UNKNOWN'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded text-gray-500"><Clock size={16}/></div>
                                        <span className="text-sm font-bold text-gray-700">Timetable Gaps</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        (systemHealth?.missingTimetableEntries || 0) > 0 ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-green/10 text-brand-green'
                                    }`}>
                                        {systemHealth?.missingTimetableEntries || 0} Alerts
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Staff Utilization Report */}
                        <div className={`col-span-1 lg:col-span-2 ${cardBase} h-80`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-display font-bold text-lg text-gray-800">Teacher Load Utilization</h3>
                                <button className="text-xs font-bold text-brand-blue hover:underline">Export Report</button>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={staffUtilizationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                                    <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false}/>
                                    <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                                    <Bar dataKey="load" name="Actual Load (%)" fill="#1E3A8A" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="target" name="Target Cap (%)" fill="#059669" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                )}
            </div>

            {/* STAFF MODAL */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowStaffModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
                        <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">
                            {editingStaffId ? 'Edit Staff Profile' : 'Add New Staff'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Manage employment details and role assignment.</p>

                        <form onSubmit={handleSaveStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={staffForm.fullName}
                                    onChange={(e) => setStaffForm({...staffForm, fullName: e.target.value})}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={staffForm.email}
                                        onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={staffForm.phone}
                                        onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                                    <select 
                                        value={staffForm.role}
                                        onChange={(e) => setStaffForm({...staffForm, role: e.target.value as StaffRole})}
                                        className={inputClass}
                                    >
                                        <option value="TEACHER">Teacher</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPPORT">Support</option>
                                        <option value="TRANSPORT">Transport</option>
                                        <option value="PRINCIPAL">Principal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                                    <select 
                                        value={staffForm.status}
                                        onChange={(e) => setStaffForm({...staffForm, status: e.target.value as EmploymentStatus})}
                                        className={inputClass}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="ON_LEAVE">On Leave</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department</label>
                                    <input 
                                        type="text" 
                                        value={staffForm.department}
                                        onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={staffForm.startDate}
                                        onChange={(e) => setStaffForm({...staffForm, startDate: e.target.value})}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            
                            {/* Qualifications List */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qualifications</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        value={qualInput}
                                        onChange={(e) => setQualInput(e.target.value)}
                                        className={`${inputClass} flex-1`}
                                        placeholder="e.g. B.Ed Degree"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddQualification}
                                        className="px-4 bg-brand-grey border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {staffForm.qualifications?.map((qual, idx) => (
                                        <span key={idx} className="bg-brand-blue/5 text-brand-blue border border-brand-blue/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            {qual}
                                            <button type="button" onClick={() => removeQualification(idx)} className="hover:text-brand-red"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    type="submit" 
                                    className={`w-full h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-blue/90 ${buttonBaseClass} flex items-center justify-center gap-2`}
                                >
                                    <Save size={18}/> Save Staff Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* ... (Other Tabs Logic - Calendar, Helpdesk, SMS are assumed complete from context) ... */}
      {/* ... (Existing Modals: Payment, Event, Leave Rejection, Calendar Confirm - preserving existing code logic structure) ... */}
      
      {/* Re-rendering existing Modals for full functionality preservation */}
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
                 {/* ... Rest of payment form ... */}
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

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowEventModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Add School Event</h3>
              <p className="text-sm text-gray-500 mb-6">Create a new calendar entry.</p>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Event Title</label>
                    <input 
                        type="text" 
                        required 
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
                            required 
                            value={eventStartDate}
                            onChange={(e) => setEventStartDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
                        <input 
                            type="date" 
                            required 
                            value={eventEndDate}
                            onChange={(e) => setEventEndDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
                        <select 
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as any)}
                            className={inputClass}
                        >
                            <option value="GENERAL">General</option>
                            <option value="ACADEMIC">Academic</option>
                            <option value="HOLIDAY">Holiday</option>
                            <option value="TRIP">Trip / Activity</option>
                            <option value="STAFF">Staff Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Audience</label>
                        <select 
                            value={eventAudience}
                            onChange={(e) => setEventAudience(e.target.value as any)}
                            className={inputClass}
                        >
                            <option value="WHOLE_SCHOOL">Whole School</option>
                            <option value="GRADE">Specific Grade</option>
                            <option value="STAFF">Staff Only</option>
                        </select>
                    </div>
                 </div>

                 {eventAudience === 'GRADE' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Grade</label>
                        <select 
                            value={eventTargetGrade}
                            onChange={(e) => setEventTargetGrade(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Select Grade</option>
                            <option value="Grade 1">Grade 1</option>
                            <option value="Grade 2">Grade 2</option>
                            <option value="Grade 3">Grade 3</option>
                            <option value="Grade 4">Grade 4</option>
                            <option value="Grade 5">Grade 5</option>
                        </select>
                    </div>
                 )}

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea 
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none h-24"
                        placeholder="Details about the event..."
                    ></textarea>
                 </div>

                 <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={eventRequiresConsent} 
                            onChange={(e) => setEventRequiresConsent(e.target.checked)}
                            className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
                        />
                        <span className="text-sm text-gray-700 font-medium">Requires Consent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={eventRequiresPayment} 
                            onChange={(e) => setEventRequiresPayment(e.target.checked)}
                            className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
                        />
                        <span className="text-sm text-gray-700 font-medium">Requires Payment</span>
                    </label>
                 </div>

                 {eventRequiresPayment && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost (KES)</label>
                        <input 
                            type="number" 
                            value={eventCost}
                            onChange={(e) => setEventCost(parseInt(e.target.value) || 0)}
                            className={inputClass}
                        />
                    </div>
                 )}

                 <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSavingEvent}
                        className={`w-full h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-blue/90 ${buttonBaseClass} flex items-center justify-center gap-2`}
                    >
                        {isSavingEvent ? <Loader2 className="animate-spin" size={20}/> : 'Add Event'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* AWARD POINTS MODAL */}
      {showAwardModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100">
                  <button onClick={() => setShowAwardModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
                  <h3 className="text-xl font-display font-bold mb-4 text-brand-blue flex items-center gap-2">
                      <Star className="fill-brand-yellow text-brand-yellow"/> Award Points
                  </h3>
                  <form onSubmit={handleAwardTeacher} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Points</label>
                          <input 
                              type="number" 
                              value={awardPointsVal}
                              onChange={(e) => setAwardPointsVal(parseInt(e.target.value) || 0)}
                              className={inputClass}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                          <textarea 
                              value={awardReason}
                              onChange={(e) => setAwardReason(e.target.value)}
                              className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none h-20"
                              placeholder="Why is this award being given?"
                              required
                          ></textarea>
                      </div>
                      <div className="pt-2">
                          <button type="submit" className="w-full h-12 bg-brand-blue text-white font-bold rounded-lg hover:bg-brand-blue/90">
                              Confirm Award
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPortal;
