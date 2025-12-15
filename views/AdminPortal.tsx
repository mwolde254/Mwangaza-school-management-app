
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { FinanceTransaction, LeaveRequest, UserRole, SchoolEvent, EventType, EventAudience, LeaveType, AdmissionStage, SmsTemplate, StaffRecord, StaffRole, EmploymentStatus, AdmissionApplication, FeeStructure, Student, ClassStream, SyllabusTopic, SupportTicket, TicketStatus, TicketPriority } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Check, X, CreditCard, MessageSquare, Plus, Filter, Wallet, Search, UserPlus, Users, Activity, FileText, AlertTriangle, ArrowRight, LayoutDashboard, Loader2, Trash2, Save, Send, AlertCircle, Smartphone, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Briefcase, Stethoscope, Palmtree, Heart, Table, HelpCircle, GraduationCap, GripVertical, FileCheck, Mail, User, CheckCircle2, Bus, Map, Navigation, Fuel, Shield, Database, Server, Link, Edit3, UploadCloud, ChevronDown, History, Printer, Download, Sparkles, Eye, DollarSign, Book, ArrowLeft, BookOpen, UserCircle, MessageCircle } from 'lucide-react';
import { db } from '../services/db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, formatDistanceToNow, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import TimetableModule from '../components/TimetableModule';
import UserManagement from '../components/UserManagement';

// Brand Palette Mapping for Data Viz
const COLORS = ['#1E3A8A', '#059669', '#FCD34D', '#38BDF8'];

const AdminPortal: React.FC = () => {
  const { students, transactions, feeStructures, addFeeStructure, leaveRequests, resolveLeaveRequest, addTransaction, addEvent, updateEvent, deleteEvent, events, supportTickets, resolveSupportTicket, replyToTicket, updateTicket, applications, updateApplicationStage, enrollApplicant, smsTemplates, updateSmsTemplate, transportRoutes, transportVehicles, transportLogs, addTransportRoute, staffRecords, addStaffRecord, updateStaffRecord, systemConfig, systemHealth, streams, addStream, syllabus, addSyllabusTopic, updateSyllabusStatus, users } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FINANCE' | 'ACADEMICS' | 'SMS' | 'ALERTS' | 'USERS' | 'CALENDAR' | 'HR' | 'TIMETABLE' | 'HELPDESK' | 'ADMISSIONS' | 'TRANSPORT'>('DASHBOARD');

  // -- GLOBAL METRICS --
  const totalStudents = students.length;
  const staffCount = staffRecords.length; 
  const attendanceRate = 92; // Mock

  // -- FINANCE DATA --
  const totalCollected = transactions.filter(t => t.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const outstandingTotal = students.reduce((acc, curr) => acc + curr.balance, 0);
  const mpesaVolume = transactions.filter(t => t.method === 'MPESA').reduce((acc, curr) => acc + curr.amount, 0);
  
  const [financeView, setFinanceView] = useState<'OVERVIEW' | 'LEDGER' | 'FEES'>('OVERVIEW');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeFilter, setFinanceFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');

  // -- ACADEMICS / GRADE MANAGER STATE --
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [academicTab, setAcademicTab] = useState<'TIMETABLE' | 'FEES' | 'SYLLABUS' | 'EVENTS' | 'STUDENTS'>('TIMETABLE');
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamColor, setNewStreamColor] = useState('#38BDF8');
  const [newStreamTeacher, setNewStreamTeacher] = useState('');
  const [showStreamModal, setShowStreamModal] = useState(false);

  // -- FEE STRUCTURE STATE --
  const [isFeeBuilderOpen, setIsFeeBuilderOpen] = useState(false);
  const [feeForm, setFeeForm] = useState<Partial<FeeStructure>>({
      grade: 'Grade 1',
      term: 'Term 1',
      academicYear: new Date().getFullYear().toString(),
      items: [{ name: 'Tuition Fee', amount: 0 }],
      status: 'DRAFT'
  });

  // -- PAYMENT MODAL STATE --
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudentSearch, setPaymentStudentSearch] = useState('');
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentType, setPaymentType] = useState('TUITION');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // -- ALERTS DATA --
  const pendingLeaves = leaveRequests.filter(req => req.status === 'PENDING');
  const pendingTemplates = smsTemplates.filter(t => t.status === 'PENDING_APPROVAL');

  // -- SMS LOGIC & STATE --
  const [smsMessage, setSmsMessage] = useState('');
  const [smsAudienceType, setSmsAudienceType] = useState<'ALL' | 'GRADE' | 'INDIVIDUAL'>('ALL');
  const [smsTargetGrade, setSmsTargetGrade] = useState('');
  const [smsSearchTerm, setSmsSearchTerm] = useState('');
  const [showSmsConfirm, setShowSmsConfirm] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsNotification, setSmsNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // -- HELP DESK STATE --
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');

  // -- ADMISSIONS STATE --
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [viewingApp, setViewingApp] = useState<AdmissionApplication | null>(null); // For Detail Modal
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollApp, setEnrollApp] = useState<AdmissionApplication | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // -- CALENDAR STATE --
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Event form states...
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

  // -- HR / LEAVE STATE --
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCalendarConfirm, setShowCalendarConfirm] = useState<string | null>(null);

  // Memoized Filters...
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.studentName.toLowerCase().includes(financeSearch.toLowerCase()) || (t.reference && t.reference.toLowerCase().includes(financeSearch.toLowerCase()));
      const matchesStatus = financeFilter === 'ALL' || t.status === financeFilter;
      let matchesDate = true;
      if (financeStartDate) {
          matchesDate = new Date(t.date) >= new Date(financeStartDate);
      }
      if (financeEndDate && matchesDate) {
          matchesDate = new Date(t.date) <= new Date(financeEndDate);
      }
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, financeSearch, financeFilter, financeStartDate, financeEndDate]);

  const searchedStudentsForPayment = useMemo(() => {
      if (paymentStudentSearch.length < 2) return [];
      return students.filter(s => s.name.toLowerCase().includes(paymentStudentSearch.toLowerCase()) || s.admissionNumber.toLowerCase().includes(paymentStudentSearch.toLowerCase()));
  }, [students, paymentStudentSearch]);

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
  const smsTotalCost = recipientCount * smsSegments * 0.8;
  const smsIsOverLimit = smsCharCount > 160;
  
  const approvedTemplates = useMemo(() => smsTemplates.filter(t => t.status === 'APPROVED'), [smsTemplates]);
  
  const filteredStaff = useMemo(() => {
      return staffRecords.filter(s => {
          const matchesSearch = s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                s.email.toLowerCase().includes(staffSearch.toLowerCase());
          const matchesRole = staffFilterRole === 'ALL' || s.role === staffFilterRole;
          return matchesSearch && matchesRole;
      });
  }, [staffRecords, staffSearch, staffFilterRole]);

  // --- ACADEMICS MEMOS ---
  const gradeStudents = useMemo(() => students.filter(s => s.grade === selectedGrade), [students, selectedGrade]);
  const gradeStreams = useMemo(() => streams.filter(s => s.grade === selectedGrade), [streams, selectedGrade]);
  const gradeSyllabus = useMemo(() => syllabus.filter(s => s.grade === selectedGrade), [syllabus, selectedGrade]);
  const gradeFeeStructure = useMemo(() => feeStructures.find(fs => fs.grade === selectedGrade), [feeStructures, selectedGrade]);
  const gradeEvents = useMemo(() => events.filter(e => e.targetGrade === selectedGrade || e.audience === 'WHOLE_SCHOOL'), [events, selectedGrade]);

  // --- HELPDESK MEMOS ---
  const filteredTickets = useMemo(() => {
      return supportTickets.filter(t => {
          const matchesStatus = ticketFilterStatus === 'ALL' || t.status === ticketFilterStatus;
          const matchesSearch = t.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || t.requestorName.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || t.id.includes(ticketSearchTerm);
          return matchesStatus && matchesSearch;
      }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [supportTickets, ticketFilterStatus, ticketSearchTerm]);

  const selectedTicket = useMemo(() => supportTickets.find(t => t.id === selectedTicketId), [supportTickets, selectedTicketId]);

  // --- CALENDAR MEMOS ---
  const calendarDays = useMemo(() => {
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

  // --- ACTIONS ---
  
  const handlePrintReceipt = (transactionId: string) => alert(`Printing receipt for transaction #${transactionId}...`);
  const handleExportFinance = () => alert("Exporting Ledger CSV...");
  const handleClearDraft = () => { setSmsMessage(''); setSmsAudienceType('ALL'); setSmsTargetGrade(''); setSmsSearchTerm(''); };
  
  const handleSendSms = async () => {
    setIsSendingSms(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSendingSms(false);
    setShowSmsConfirm(false);
    setSmsNotification({ message: 'Message scheduled for delivery.', type: 'success' });
    setTimeout(() => { setSmsNotification(null); handleClearDraft(); }, 3000);
  };

  const handleTemplateSelect = (content: string) => { setSmsMessage(content); setShowTemplatePicker(false); };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;
    setIsProcessingPayment(true);
    await addTransaction({
      studentId: selectedStudentForPay.id,
      studentName: selectedStudentForPay.name,
      amount: parseInt(paymentAmount),
      type: paymentType as any,
      date: new Date().toISOString().split('T')[0],
      status: 'PAID',
      method: paymentMethod as any,
      reference: paymentReference
    });
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    setPaymentStudentSearch(''); setSelectedStudentForPay(null); setPaymentAmount(''); setPaymentReference('');
    setSmsNotification({ message: 'Payment recorded successfully.', type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
  };

  // Fee Structure Logic
  const handleAddFeeItem = () => {
      setFeeForm(prev => ({
          ...prev,
          items: [...(prev.items || []), { name: '', amount: 0 }]
      }));
  };

  const handleUpdateFeeItem = (index: number, field: 'name' | 'amount', value: any) => {
      const newItems = [...(feeForm.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      const total = newItems.reduce((sum, item) => sum + Number(item.amount), 0);
      setFeeForm(prev => ({ ...prev, items: newItems, total }));
  };

  const handleRemoveFeeItem = (index: number) => {
      const newItems = (feeForm.items || []).filter((_, i) => i !== index);
      const total = newItems.reduce((sum, item) => sum + Number(item.amount), 0);
      setFeeForm(prev => ({ ...prev, items: newItems, total }));
  };

  const handleSaveFeeStructure = async () => {
      if(!feeForm.grade || !feeForm.total) return;
      await addFeeStructure(feeForm as Omit<FeeStructure, 'id'>);
      setIsFeeBuilderOpen(false);
      setSmsNotification({ message: `Fee structure published for ${feeForm.grade}.`, type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  // Academics Handlers
  const handleAddStream = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedGrade || !newStreamName) return;
      
      const teacher = staffRecords.find(s => s.id === newStreamTeacher);
      
      await addStream({
          grade: selectedGrade,
          name: newStreamName,
          color: newStreamColor,
          classTeacherId: newStreamTeacher,
          classTeacherName: teacher?.fullName || 'Unassigned'
      });
      setShowStreamModal(false);
      setNewStreamName('');
      setNewStreamTeacher('');
      setSmsNotification({ message: 'Class stream added successfully.', type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  // Staff/HR Handlers
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
      setSmsNotification({ message: 'Staff record updated successfully.', type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  const handleAddQualification = () => {
      if(qualInput.trim()) { setStaffForm(prev => ({ ...prev, qualifications: [...(prev.qualifications || []), qualInput.trim()] })); setQualInput(''); }
  };
  const removeQualification = (idx: number) => { setStaffForm(prev => ({ ...prev, qualifications: prev.qualifications?.filter((_, i) => i !== idx) })); };

  // Ticket Handler
  const handleResolveTicket = async () => {
    if(!selectedTicketId || !ticketReply) return;
    setIsSendingReply(true);
    // Robust threaded reply
    await replyToTicket(selectedTicketId, {
        senderId: user?.id || 'admin',
        senderName: user?.name || 'Admin',
        role: 'ADMIN',
        message: ticketReply
    });
    
    // Auto-status update
    if (selectedTicket?.status === 'OPEN') {
        await updateTicket(selectedTicketId, { status: 'IN_PROGRESS' });
    }

    setIsSendingReply(false);
    setTicketReply('');
  };

  const handleChangeTicketStatus = async (status: TicketStatus) => {
      if(!selectedTicketId) return;
      await updateTicket(selectedTicketId, { status });
      setSmsNotification({ message: `Ticket marked as ${status}`, type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  const handleChangeTicketPriority = async (priority: TicketPriority) => {
      if(!selectedTicketId) return;
      await updateTicket(selectedTicketId, { priority });
  };

  const handleAssignTicket = async (staffId: string) => {
      if(!selectedTicketId) return;
      const staff = staffRecords.find(s => s.userId === staffId);
      await updateTicket(selectedTicketId, { assignedToId: staffId, assignedToName: staff?.fullName });
      setSmsNotification({ message: `Ticket assigned to ${staff?.fullName}`, type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  // Admissions Handlers
  const handleDragStart = (id: string) => setDraggedAppId(id);
  const handleDrop = async (stage: AdmissionStage) => { if (draggedAppId) { await updateApplicationStage(draggedAppId, stage); setDraggedAppId(null); } };
  
  const handleOpenEnrollWizard = (app: AdmissionApplication) => {
      setEnrollApp(app);
      setViewingApp(null); // Close detail view if open
      setShowEnrollmentModal(true);
  };

  const handleFinalizeEnrollment = async () => {
      if (!enrollApp) return;
      setIsEnrolling(true);
      await enrollApplicant(enrollApp.id);
      setIsEnrolling(false);
      setShowEnrollmentModal(false);
      setSmsNotification({ message: `Success! ${enrollApp.childName} is now enrolled. Parent account created/linked.`, type: 'success' });
      setEnrollApp(null);
      setTimeout(() => setSmsNotification(null), 4000);
  };

  // Manual Stage Change from Detail View
  const handleManualStageChange = async (appId: string, stage: AdmissionStage) => {
      await updateApplicationStage(appId, stage);
      setViewingApp(null); // Close modal
      setSmsNotification({ message: `Application moved to ${stage.replace('_', ' ')}`, type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  // Calendar & Route Handlers
  const resetEventForm = () => {
      setEventTitle(''); 
      setEventStartDate(''); 
      setEventEndDate(''); 
      setEventType('GENERAL');
      setEventAudience('WHOLE_SCHOOL');
      setEventTargetGrade('');
      setEventDesc(''); 
      setEventRequiresConsent(false); 
      setEventRequiresPayment(false); 
      setEventCost(0);
      setEditingEventId(null);
  };

  const openAddEventModal = () => { 
      resetEventForm();
      setEventStartDate(format(selectedDate, 'yyyy-MM-dd')); 
      setEventEndDate(format(selectedDate, 'yyyy-MM-dd')); 
      setShowEventModal(true); 
  };

  const handleEditEvent = (ev: SchoolEvent) => {
      setEditingEventId(ev.id);
      setEventTitle(ev.title);
      setEventStartDate(ev.startDate.split('T')[0]);
      setEventEndDate(ev.endDate.split('T')[0]);
      setEventType(ev.type);
      setEventAudience(ev.audience);
      setEventTargetGrade(ev.targetGrade || '');
      setEventDesc(ev.description || '');
      setEventRequiresConsent(ev.requiresConsent);
      setEventRequiresPayment(ev.requiresPayment);
      setEventCost(ev.cost || 0);
      setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    
    const payload = {
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
    };

    if (editingEventId) {
        await updateEvent(editingEventId, payload);
        setSmsNotification({ message: 'Event updated successfully.', type: 'success' });
    } else {
        await addEvent(payload);
        setSmsNotification({ message: 'Event added to calendar.', type: 'success' });
    }

    setIsSavingEvent(false);
    setShowEventModal(false);
    setTimeout(() => setSmsNotification(null), 3000);
    resetEventForm();
  };

  const handleDeleteEvent = async (id: string) => {
      if(confirm('Delete this event?')) {
          await deleteEvent(id);
          setSmsNotification({ message: 'Event deleted.', type: 'success' });
          setTimeout(() => setSmsNotification(null), 3000);
      }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransportRoute({ name: routeName, driverName: routeDriver, vehicleNumber: routeVehicle, stops: routeStops.filter(s => s.trim() !== ''), scheduleTime: routeTime });
    setShowAddRouteModal(false); setRouteName(''); setRouteDriver(''); setRouteVehicle(''); setRouteStops(['']);
    setSmsNotification({ message: 'New transport route added.', type: 'success' });
    setTimeout(() => setSmsNotification(null), 3000);
  };

  const handleApproveLeave = async (addToCalendar: boolean) => {
      if (showCalendarConfirm) { await resolveLeaveRequest(showCalendarConfirm, 'APPROVED', undefined, addToCalendar); setShowCalendarConfirm(null); setSmsNotification({ message: 'Leave request approved.', type: 'success' }); setTimeout(() => setSmsNotification(null), 3000); }
  };
  const handleRejectLeave = async () => {
      if (rejectModalId && rejectionReason) { await resolveLeaveRequest(rejectModalId, 'REJECTED', rejectionReason); setRejectModalId(null); setRejectionReason(''); setSmsNotification({ message: 'Leave request rejected.', type: 'success' }); setTimeout(() => setSmsNotification(null), 3000); }
  };

  const handleApproveTemplate = async (id: string) => {
      await updateSmsTemplate(id, { status: 'APPROVED' });
      setSmsNotification({ message: 'Template approved.', type: 'success' });
      setTimeout(() => setSmsNotification(null), 3000);
  };

  const PIPELINE_STAGES: { id: AdmissionStage, label: string, color: string }[] = [
    { id: 'NEW_INQUIRY', label: 'Inquiry', color: 'border-brand-sky bg-brand-sky/5 text-brand-sky' },
    { id: 'UNDER_REVIEW', label: 'Reviewing', color: 'border-brand-yellow bg-brand-yellow/5 text-brand-yellow' },
    { id: 'INTERVIEW', label: 'Interview', color: 'border-purple-500 bg-purple-50 text-purple-600' },
    { id: 'OFFER_SENT', label: 'Offer Sent', color: 'border-brand-blue bg-brand-blue/5 text-brand-blue' },
    { id: 'ENROLLED', label: 'Enrolled', color: 'border-brand-green bg-brand-green/5 text-brand-green' },
  ];

  const buttonBaseClass = "rounded-xl font-bold transition-all shadow-lg focus:ring-4 focus:ring-brand-sky/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform duration-150";
  const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";

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
                          <button onClick={() => handleOpenStaffModal()} className="px-4 h-10 bg-brand-blue text-white rounded-lg font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
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

                  {/* Pending Templates */}
                  <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <MessageSquare size={18} className="text-brand-blue"/> SMS Template Reviews
                      </h3>
                      {pendingTemplates.length > 0 ? (
                          <div className="space-y-4">
                              {pendingTemplates.map(tpl => (
                                  <div key={tpl.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-bold text-gray-800">{tpl.name}</span>
                                          <span className="text-xs text-gray-500 italic">{tpl.category}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-3 italic">"{tpl.content}"</p>
                                      <div className="flex gap-2">
                                          <button 
                                              onClick={async () => { await updateSmsTemplate(tpl.id, { status: 'REJECTED' }); setSmsNotification({message: 'Template rejected.', type: 'success'}); }}
                                              className="flex-1 py-2 text-xs font-bold text-brand-red border border-brand-red/30 rounded hover:bg-brand-red/5"
                                          >
                                              Reject
                                          </button>
                                          <button 
                                              onClick={async () => { await updateSmsTemplate(tpl.id, { status: 'APPROVED' }); setSmsNotification({message: 'Template approved.', type: 'success'}); }}
                                              className="flex-1 py-2 text-xs font-bold text-white bg-brand-green rounded hover:bg-brand-green/90"
                                          >
                                              Approve
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">No templates awaiting approval.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* === ACADEMICS MODULE === */}
      {activeTab === 'ACADEMICS' && (
          <div className="space-y-6 animate-slide-up">
              {!selectedGrade ? (
                  // Grade Grid View
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {['Play Group', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map((grade) => {
                          const count = students.filter(s => s.grade === grade).length;
                          return (
                              <div 
                                key={grade} 
                                onClick={() => setSelectedGrade(grade)}
                                className="bg-white rounded-[12px] p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-sky/50 transition-all cursor-pointer group flex flex-col justify-between h-40"
                              >
                                  <div className="flex justify-between items-start">
                                      <h3 className="font-display font-bold text-xl text-gray-800 group-hover:text-brand-blue">{grade}</h3>
                                      <div className="p-2 bg-brand-grey rounded-full group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                                          <GraduationCap size={20}/>
                                      </div>
                                  </div>
                                  <div className="flex justify-between items-end">
                                      <div>
                                          <p className="text-3xl font-display font-bold text-brand-blue">{count}</p>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Students Enrolled</p>
                                      </div>
                                      <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-blue transition-transform group-hover:translate-x-1"/>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  // Detailed Grade Dashboard
                  <div className="space-y-6">
                      <button onClick={() => setSelectedGrade(null)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-blue mb-2 transition-colors group">
                          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Grades
                      </button>

                      {/* Header Card */}
                      <div className={`${cardBase} p-6 border-l-4 border-l-brand-blue`}>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                              <div>
                                  <h2 className="font-display font-extrabold text-3xl text-gray-800">{selectedGrade} Dashboard</h2>
                                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                      <Users size={16}/> {gradeStudents.length} Students 
                                      <span className="text-gray-300">|</span> 
                                      <BookOpen size={16}/> {gradeStreams.length} Active Streams
                                  </p>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fee Compliance</p>
                                      <p className="font-bold text-brand-green">85% Cleared</p>
                                  </div>
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-brand-green w-[85%]"></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Navigation Tabs */}
                      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                          {['TIMETABLE', 'FEES', 'SYLLABUS', 'EVENTS', 'STUDENTS'].map(tab => (
                              <button 
                                key={tab}
                                onClick={() => setAcademicTab(tab as any)}
                                className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${academicTab === tab ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                              >
                                  {tab === 'FEES' ? 'Fee Structure' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                              </button>
                          ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Sidebar: Stream Manager */}
                          <div className="lg:col-span-1 space-y-6">
                              <div className="bg-white rounded-[12px] border border-gray-100 p-4 shadow-sm">
                                  <div className="flex justify-between items-center mb-4">
                                      <h4 className="font-display font-bold text-gray-800">Class Streams</h4>
                                      <button onClick={() => setShowStreamModal(true)} className="p-1.5 bg-gray-100 hover:bg-brand-blue hover:text-white rounded transition-colors">
                                          <Plus size={16}/>
                                      </button>
                                  </div>
                                  <div className="space-y-2">
                                      {gradeStreams.map(stream => (
                                          <div key={stream.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: stream.color}}></div>
                                                  <div>
                                                      <p className="font-bold text-sm text-gray-800">{stream.name}</p>
                                                      <p className="text-[10px] text-gray-500">{stream.classTeacherName}</p>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                      {gradeStreams.length === 0 && <p className="text-xs text-gray-400 italic">No streams defined.</p>}
                                  </div>
                              </div>
                          </div>

                          {/* Main Content Area */}
                          <div className="lg:col-span-3">
                              {academicTab === 'TIMETABLE' && (
                                  <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden h-[600px]">
                                      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                          <h3 className="font-bold text-gray-800">Master Timetable</h3>
                                          <button className="text-xs font-bold text-brand-blue hover:underline">Edit Master</button>
                                      </div>
                                      <div className="p-4 h-full">
                                          <TimetableModule mode="ADMIN" targetClass={selectedGrade} />
                                      </div>
                                  </div>
                              )}

                              {academicTab === 'FEES' && (
                                  <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="font-bold text-gray-800">Term Fee Breakdown</h3>
                                          <button onClick={() => { setActiveTab('FINANCE'); setFinanceView('FEES'); }} className="text-xs font-bold bg-brand-blue/10 text-brand-blue px-3 py-1.5 rounded hover:bg-brand-blue/20">
                                              Edit Configuration
                                          </button>
                                      </div>
                                      {gradeFeeStructure ? (
                                          <div className="space-y-4">
                                              {gradeFeeStructure.items.map((item, idx) => (
                                                  <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-100">
                                                      <span className="font-medium text-gray-700">{item.name}</span>
                                                      <span className="font-mono font-bold text-gray-900">KES {item.amount.toLocaleString()}</span>
                                                  </div>
                                              ))}
                                              <div className="flex justify-between p-4 bg-brand-blue/5 rounded border border-brand-blue/10 mt-4">
                                                  <span className="font-bold text-brand-blue uppercase">Total Term Fees</span>
                                                  <span className="font-display font-extrabold text-xl text-brand-blue">KES {gradeFeeStructure.total.toLocaleString()}</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="text-center py-12 text-gray-400">
                                              <DollarSign size={32} className="mx-auto mb-2 opacity-20"/>
                                              <p>No fee structure configured for this grade.</p>
                                          </div>
                                      )}
                                  </div>
                              )}

                              {academicTab === 'SYLLABUS' && (
                                  <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="font-bold text-gray-800">Curriculum Tracking</h3>
                                          <button className="text-xs font-bold bg-brand-green text-white px-3 py-1.5 rounded hover:bg-brand-green/90 flex items-center gap-1">
                                              <UploadCloud size={14}/> Upload Syllabus
                                          </button>
                                      </div>
                                      <div className="space-y-3">
                                          {gradeSyllabus.length > 0 ? gradeSyllabus.map(topic => (
                                              <div key={topic.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                          <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider bg-brand-blue/5 px-2 py-0.5 rounded">{topic.subject}</span>
                                                          <h4 className="font-bold text-gray-800 mt-1">{topic.title}</h4>
                                                      </div>
                                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                          topic.status === 'COMPLETED' ? 'bg-brand-green/10 text-brand-green' :
                                                          topic.status === 'IN_PROGRESS' ? 'bg-brand-yellow/10 text-brand-yellow-600' :
                                                          'bg-gray-100 text-gray-500'
                                                      }`}>
                                                          {topic.status.replace('_', ' ')}
                                                      </span>
                                                  </div>
                                                  <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                                                  {topic.status !== 'COMPLETED' && (
                                                      <div className="flex justify-end">
                                                          <button 
                                                              onClick={() => updateSyllabusStatus(topic.id, 'COMPLETED')}
                                                              className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                                                          >
                                                              <Check size={12}/> Mark Complete
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          )) : (
                                              <div className="text-center py-12 text-gray-400">
                                                  <Book size={32} className="mx-auto mb-2 opacity-20"/>
                                                  <p>No syllabus topics uploaded yet.</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {academicTab === 'EVENTS' && (
                                  <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="font-bold text-gray-800">Grade Events</h3>
                                          <button onClick={openAddEventModal} className="text-xs font-bold bg-brand-blue text-white px-3 py-1.5 rounded hover:bg-brand-blue/90">
                                              Add Event
                                          </button>
                                      </div>
                                      <div className="space-y-3">
                                          {gradeEvents.map(ev => (
                                              <div key={ev.id} onClick={() => handleEditEvent(ev)} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                  <div className="flex flex-col items-center justify-center w-16 bg-brand-grey/50 rounded-lg p-2 text-center">
                                                      <span className="text-xs font-bold text-gray-500 uppercase">{format(new Date(ev.startDate), 'MMM')}</span>
                                                      <span className="text-xl font-bold text-gray-800">{format(new Date(ev.startDate), 'dd')}</span>
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-gray-800">{ev.title}</h4>
                                                      <p className="text-xs text-gray-500 mt-1">{ev.type} • {ev.audience === 'WHOLE_SCHOOL' ? 'All Grades' : 'Grade Specific'}</p>
                                                  </div>
                                              </div>
                                          ))}
                                          {gradeEvents.length === 0 && <p className="text-center text-gray-400 py-8 italic">No upcoming events.</p>}
                                      </div>
                                  </div>
                              )}

                              {academicTab === 'STUDENTS' && (
                                  <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden shadow-sm">
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-sm text-left">
                                              <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                                  <tr>
                                                      <th className="px-6 py-4">Student</th>
                                                      <th className="px-6 py-4">Adm No</th>
                                                      <th className="px-6 py-4">Stream</th>
                                                      <th className="px-6 py-4">Fee Balance</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-50">
                                                  {gradeStudents.map(s => {
                                                      const stream = gradeStreams.find(st => st.name === s.stream); // Mock stream match
                                                      const streamColor = stream?.color || '#cbd5e1';
                                                      
                                                      return (
                                                          <tr key={s.id} className="hover:bg-gray-50">
                                                              <td className="px-6 py-4 font-bold text-gray-800 border-l-4" style={{borderLeftColor: streamColor}}>
                                                                  {s.name}
                                                              </td>
                                                              <td className="px-6 py-4 text-gray-600 font-mono text-xs">{s.admissionNumber}</td>
                                                              <td className="px-6 py-4">
                                                                  <span className="px-2 py-1 rounded text-xs font-bold" style={{backgroundColor: `${streamColor}20`, color: streamColor}}>
                                                                      {s.stream || 'Unassigned'}
                                                                  </span>
                                                              </td>
                                                              <td className={`px-6 py-4 font-mono font-bold ${s.balance > 0 ? 'text-brand-yellow' : 'text-brand-green'}`}>
                                                                  KES {s.balance.toLocaleString()}
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
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* === FINANCE MODULE === */}
      {activeTab === 'FINANCE' && (
          <div className="space-y-6 animate-slide-up">
              {/* Sub Navigation */}
              <div className="flex gap-4 border-b border-gray-200 pb-1">
                  {['OVERVIEW', 'LEDGER', 'FEES'].map(view => (
                      <button 
                        key={view}
                        onClick={() => setFinanceView(view as any)}
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${financeView === view ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                          {view === 'FEES' ? 'Fee Structures' : view === 'LEDGER' ? 'Transaction Ledger' : 'Dashboard'}
                      </button>
                  ))}
              </div>

              {/* OVERVIEW */}
              {financeView === 'OVERVIEW' && (
                  <div className="space-y-6 animate-fade-in">
                      {/* KPI Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className={`${cardBase} bg-gradient-to-br from-brand-blue to-blue-900 border-none text-white`}>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                      <p className="text-[10px] opacity-70">Current Term</p>
                                  </div>
                                  <div className="p-2 bg-white/10 rounded-lg"><Wallet size={20}/></div>
                              </div>
                              <p className="text-3xl font-bold font-sans">KES {totalCollected.toLocaleString()}</p>
                          </div>
                          
                          <div className={cardBase}>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Outstanding Balance</p>
                                      <p className="text-[10px] text-gray-400">Uncollected Fees</p>
                                  </div>
                                  <div className="p-2 bg-brand-yellow/10 text-brand-yellow rounded-lg"><AlertCircle size={20}/></div>
                              </div>
                              <p className="text-3xl font-bold font-sans text-brand-yellow">KES {outstandingTotal.toLocaleString()}</p>
                          </div>

                          <div className={cardBase}>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">MPesa Intake</p>
                                      <p className="text-[10px] text-gray-400">Total Volume</p>
                                  </div>
                                  <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg"><Smartphone size={20}/></div>
                              </div>
                              <p className="text-3xl font-bold font-sans text-brand-green">KES {mpesaVolume.toLocaleString()}</p>
                          </div>
                      </div>

                      {/* Recent Activity */}
                      <div className={cardBase}>
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-display font-bold text-lg text-gray-800">Recent Activity Feed</h3>
                              <button onClick={() => setFinanceView('LEDGER')} className="text-xs font-bold text-brand-blue hover:underline">View Full Ledger</button>
                          </div>
                          <div className="space-y-0 divide-y divide-gray-50">
                              {transactions.slice(0, 5).map(t => (
                                  <div key={t.id} className="py-3 flex justify-between items-center hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-full ${t.method === 'MPESA' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                              {t.method === 'MPESA' ? <Smartphone size={16}/> : <CreditCard size={16}/>}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-800">{t.studentName}</p>
                                              <p className="text-[10px] text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')} • {t.type}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-mono font-bold text-brand-green text-sm">+{t.amount.toLocaleString()}</p>
                                          <p className="text-[10px] text-gray-400 uppercase">{t.status}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* LEDGER */}
              {financeView === 'LEDGER' && (
                  <div className="space-y-4 animate-fade-in">
                      {/* Controls */}
                      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-[12px] border border-gray-100 shadow-sm">
                          <div className="flex gap-2 flex-1">
                              <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                  <input 
                                      type="text" 
                                      placeholder="Search Student or Ref..." 
                                      value={financeSearch}
                                      onChange={(e) => setFinanceSearch(e.target.value)}
                                      className={`${inputClass} pl-10 h-10 text-sm`}
                                  />
                              </div>
                              <select 
                                  value={financeFilter} 
                                  onChange={(e) => setFinanceFilter(e.target.value as any)}
                                  className={`${inputClass} w-32 h-10 text-sm`}
                              >
                                  <option value="ALL">All Status</option>
                                  <option value="PAID">Paid</option>
                                  <option value="PENDING">Pending</option>
                              </select>
                          </div>
                          <div className="flex gap-2">
                              <input type="date" value={financeStartDate} onChange={(e) => setFinanceStartDate(e.target.value)} className={`${inputClass} w-auto h-10 text-sm`}/>
                              <span className="self-center text-gray-400">-</span>
                              <input type="date" value={financeEndDate} onChange={(e) => setFinanceEndDate(e.target.value)} className={`${inputClass} w-auto h-10 text-sm`}/>
                              <button onClick={() => setShowPaymentModal(true)} className="px-4 h-10 bg-brand-blue text-white rounded-lg font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
                                  <Plus size={16}/> Record Payment
                              </button>
                              <button onClick={handleExportFinance} className="px-4 h-10 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2">
                                  <Download size={16}/> Export
                              </button>
                          </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                  <tr>
                                      <th className="px-6 py-4">Date</th>
                                      <th className="px-6 py-4">Ref No.</th>
                                      <th className="px-6 py-4">Student</th>
                                      <th className="px-6 py-4 text-right">Amount</th>
                                      <th className="px-6 py-4 text-center">Method</th>
                                      <th className="px-6 py-4 text-center">Status</th>
                                      <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {filteredTransactions.map(t => (
                                      <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                          <td className="px-6 py-4 text-gray-600 font-mono text-xs">{t.date}</td>
                                          <td className="px-6 py-4 text-gray-800 font-bold text-xs">{t.reference || '-'}</td>
                                          <td className="px-6 py-4 font-bold text-gray-700">{t.studentName}</td>
                                          <td className="px-6 py-4 text-right font-mono font-bold text-brand-green">{t.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-center">
                                              <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">{t.method}</span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${t.status === 'PAID' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
                                                  {t.status === 'PAID' ? <Check size={10}/> : <Clock size={10}/>} {t.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => handlePrintReceipt(t.id)} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors" title="Print Receipt">
                                                      <Printer size={16}/>
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                                  {filteredTransactions.length === 0 && (
                                      <tr><td colSpan={7} className="text-center py-8 text-gray-400 italic">No transactions found.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* FEE STRUCTURES */}
              {financeView === 'FEES' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center">
                          <h3 className="font-display font-bold text-lg text-gray-800">Grade Fee Configurations</h3>
                          <button 
                              onClick={() => setIsFeeBuilderOpen(true)}
                              className="px-4 py-2 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow-lg hover:bg-brand-blue/90 flex items-center gap-2"
                          >
                              <Plus size={16}/> Create Structure
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {feeStructures.map(fs => (
                              <div key={fs.id} className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                      <DollarSign size={64} className="text-brand-blue"/>
                                  </div>
                                  <div className="relative z-10">
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <h4 className="font-display font-bold text-xl text-gray-800">{fs.grade}</h4>
                                              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{fs.term} • {fs.academicYear}</p>
                                          </div>
                                          <span className="px-2 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase rounded border border-brand-green/20">Published</span>
                                      </div>
                                      
                                      <div className="space-y-2 mb-6">
                                          {fs.items.map((item, idx) => (
                                              <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-1 last:border-0">
                                                  <span className="text-gray-600">{item.name}</span>
                                                  <span className="font-mono font-bold text-gray-800">{item.amount.toLocaleString()}</span>
                                              </div>
                                          ))}
                                      </div>

                                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                          <span className="text-xs font-bold text-gray-400 uppercase">Total Fees</span>
                                          <span className="text-2xl font-bold font-display text-brand-blue">KES {fs.total.toLocaleString()}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {feeStructures.length === 0 && (
                              <div className="col-span-full py-12 text-center bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                                  <p className="text-gray-400 italic">No fee structures defined yet.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      )}

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

      {/* === HELP DESK MODULE === */}
      {activeTab === 'HELPDESK' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] animate-slide-up">
              
              {/* Left Pane: Inbox List (Col 4) */}
              <div className="lg:col-span-4 flex flex-col bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                          <input 
                              type="text" 
                              placeholder="Search tickets..." 
                              value={ticketSearchTerm}
                              onChange={(e) => setTicketSearchTerm(e.target.value)}
                              className={`${inputClass} pl-10 h-10 text-sm`}
                          />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                              <button 
                                  key={status}
                                  onClick={() => setTicketFilterStatus(status as any)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                                      ticketFilterStatus === status 
                                          ? 'bg-brand-blue text-white border-brand-blue' 
                                          : 'bg-white text-gray-500 border-gray-200 hover:border-brand-blue/30'
                                  }`}
                              >
                                  {status.replace('_', ' ')}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                          <div 
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-brand-grey/50 ${selectedTicketId === ticket.id ? 'bg-brand-blue/5 border-l-4 border-l-brand-blue' : 'border-l-4 border-l-transparent'}`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                          ticket.status === 'OPEN' ? 'bg-brand-yellow' : 
                                          ticket.status === 'IN_PROGRESS' ? 'bg-brand-sky' : 
                                          'bg-brand-green'
                                      }`}></div>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          ticket.priority === 'CRITICAL' ? 'bg-brand-red/10 text-brand-red' : 
                                          ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                          'bg-gray-100 text-gray-500'
                                      }`}>
                                          {ticket.priority}
                                      </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                              </div>
                              <h4 className={`text-sm font-bold mb-1 line-clamp-1 ${selectedTicketId === ticket.id ? 'text-brand-blue' : 'text-gray-800'}`}>
                                  {ticket.subject}
                              </h4>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                      {ticket.requestorRole === 'PARENT' ? <User size={12}/> : <Briefcase size={12}/>}
                                      {ticket.requestorName}
                                  </span>
                                  <span className="bg-gray-100 px-1.5 rounded text-[10px] uppercase font-bold">{ticket.category}</span>
                              </div>
                          </div>
                      )) : (
                          <div className="p-8 text-center text-gray-400 text-sm">No tickets found.</div>
                      )}
                  </div>
              </div>

              {/* Right Pane: Ticket Detail (Col 8) */}
              <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
                  {selectedTicket ? (
                      <>
                          {/* Detail Header */}
                          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-xs text-gray-400">#{selectedTicket.id}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedTicket.source === 'PARENT' ? 'bg-brand-sky/10 text-brand-sky' : 'bg-purple-100 text-purple-600'}`}>
                                          {selectedTicket.source} TICKET
                                      </span>
                                  </div>
                                  <h3 className="font-display font-bold text-xl text-gray-800">{selectedTicket.subject}</h3>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span className="flex items-center gap-1"><UserCircle size={14}/> {selectedTicket.requestorName}</span>
                                      {selectedTicket.location && <span className="flex items-center gap-1"><MapPin size={14}/> {selectedTicket.location}</span>}
                                      {selectedTicket.studentName && <span className="flex items-center gap-1"><GraduationCap size={14}/> {selectedTicket.studentName}</span>}
                                  </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-2">
                                      <select 
                                          value={selectedTicket.status}
                                          onChange={(e) => handleChangeTicketStatus(e.target.value as any)}
                                          className="h-8 pl-2 pr-6 rounded text-xs font-bold bg-white border border-gray-200 focus:border-brand-blue outline-none"
                                      >
                                          <option value="OPEN">Open</option>
                                          <option value="IN_PROGRESS">In Progress</option>
                                          <option value="RESOLVED">Resolved</option>
                                      </select>
                                      <select 
                                          value={selectedTicket.priority}
                                          onChange={(e) => handleChangeTicketPriority(e.target.value as any)}
                                          className={`h-8 pl-2 pr-6 rounded text-xs font-bold border outline-none ${
                                              selectedTicket.priority === 'CRITICAL' ? 'bg-brand-red/10 text-brand-red border-brand-red/20' : 
                                              selectedTicket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                              'bg-white border-gray-200 text-gray-600'
                                          }`}
                                      >
                                          <option value="NORMAL">Normal</option>
                                          <option value="HIGH">High</option>
                                          <option value="CRITICAL">Critical</option>
                                      </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned To:</span>
                                      <select 
                                          value={selectedTicket.assignedToId || ''}
                                          onChange={(e) => handleAssignTicket(e.target.value)}
                                          className="h-6 text-xs bg-transparent border-b border-gray-300 focus:border-brand-blue outline-none w-32"
                                      >
                                          <option value="">Unassigned</option>
                                          {staffRecords.map(staff => (
                                              <option key={staff.userId || staff.id} value={staff.userId || staff.id}>{staff.fullName}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          {/* Chat Thread */}
                          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
                              {selectedTicket.messages.map((msg, idx) => {
                                  const isStaff = msg.role === 'ADMIN' || msg.role === 'TEACHER' || msg.role === 'PRINCIPAL';
                                  const isMe = msg.senderId === user?.id; // Assuming user.id available
                                  
                                  return (
                                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isStaff ? 'bg-brand-blue text-white' : 'bg-brand-grey text-gray-600'}`}>
                                              {msg.senderName[0]}
                                          </div>
                                          <div className={`max-w-[80%]`}>
                                              <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                                  <span className="text-xs font-bold text-gray-700">{msg.senderName}</span>
                                                  <span className="text-[10px] text-gray-400">{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
                                              </div>
                                              <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                                                  isMe ? 'bg-brand-blue text-white rounded-tr-none' : 
                                                  isStaff ? 'bg-brand-blue/5 text-gray-800 rounded-tl-none border border-brand-blue/10' :
                                                  'bg-gray-100 text-gray-800 rounded-tl-none'
                                              }`}>
                                                  {msg.message}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          {/* Reply Box */}
                          <div className="p-4 border-t border-gray-100 bg-gray-50">
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={ticketReply}
                                      onChange={(e) => setTicketReply(e.target.value)}
                                      placeholder="Type your reply..."
                                      className="flex-1 h-10 px-4 rounded-lg border border-gray-200 focus:border-brand-blue outline-none text-sm"
                                      onKeyPress={(e) => e.key === 'Enter' && handleResolveTicket()}
                                  />
                                  <button 
                                      onClick={handleResolveTicket}
                                      disabled={!ticketReply.trim() || isSendingReply}
                                      className="h-10 px-4 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-blue/90 disabled:opacity-50 flex items-center gap-2"
                                  >
                                      {isSendingReply ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                      Reply
                                  </button>
                              </div>
                          </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                          <MessageCircle size={48} className="mb-4 opacity-20"/>
                          <p>Select a ticket to view details</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* === SMS MODULE === */}
      {activeTab === 'SMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] animate-slide-up">
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
                    {/* ... (SMS Form Logic) ... */}
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
                                    <button key={type} onClick={() => setSmsAudienceType(type as any)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${smsAudienceType === type ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
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
                            <textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} className="w-full h-32 p-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white resize-none" placeholder="Type your message here..."></textarea>
                            <div className="flex justify-between items-center mt-2"><span className={`text-xs font-bold ${smsIsOverLimit ? 'text-brand-red' : 'text-gray-400'}`}>{smsCharCount} chars ({smsSegments} SMS)</span><span className="text-xs font-bold text-gray-500">Est. Cost: <span className="text-brand-blue">KES {smsTotalCost.toFixed(2)}</span></span></div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3"><button onClick={handleClearDraft} className="px-6 h-12 border border-gray-200 text-gray-600 rounded-[12px] font-bold hover:bg-gray-50">Clear</button><button onClick={() => setShowSmsConfirm(true)} disabled={!smsMessage || (smsAudienceType === 'GRADE' && !smsTargetGrade) || (smsAudienceType === 'INDIVIDUAL' && targetedRecipients.length === 0)} className="px-8 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Send size={18}/> Review & Send</button></div>
                    </div>
                </div>
            </div>
            {/* History Column */}
            <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-display font-bold text-gray-800 flex items-center gap-2"><History size={18} className="text-gray-500"/> Recent Blasts</h3></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">{[{ id: 1, date: 'Today, 10:30 AM', target: 'Grade 4 Parents', status: 'Delivered', msg: 'Reminder: Science Trip tomorrow...' }, { id: 2, date: 'Yesterday, 4:00 PM', target: 'Whole School', status: 'Delivered', msg: 'School closes at 3PM on Friday...' }, { id: 3, date: 'Oct 24, 9:00 AM', target: 'Staff', status: 'Failed', msg: 'Meeting rescheduled to 10AM.' }].map(log => (<div key={log.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"><div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase">{log.date}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.status === 'Delivered' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>{log.status}</span></div><p className="text-xs font-bold text-brand-blue mb-1">{log.target}</p><p className="text-xs text-gray-600 line-clamp-2">"{log.msg}"</p></div>))}</div>
            </div>
            {showSmsConfirm && <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100"><h3 className="font-display font-bold text-xl text-brand-blue mb-4">Confirm Broadcast</h3><div className="space-y-3 mb-6 text-sm text-gray-600"><p>You are about to send a message to <span className="font-bold text-gray-800">{recipientCount} recipients</span>.</p><p>Estimated Cost: <span className="font-bold text-gray-800">KES {smsTotalCost.toFixed(2)}</span></p><div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs italic text-gray-500">"{smsMessage}"</div></div><div className="flex gap-3"><button onClick={() => setShowSmsConfirm(false)} className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50">Cancel</button><button onClick={handleSendSms} disabled={isSendingSms} className="flex-1 h-10 bg-brand-blue text-white rounded-lg font-bold shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2">{isSendingSms ? <Loader2 className="animate-spin" size={16}/> : 'Confirm Send'}</button></div></div></div>}
        </div>
      )}
      
      {activeTab === 'USERS' && <UserManagement />}
      {activeTab === 'TIMETABLE' && <TimetableModule mode="ADMIN" />}
      {activeTab === 'ADMISSIONS' && (
          <div className="h-[calc(100vh-200px)] flex flex-col animate-slide-up">
              {/* Pipeline Board */}
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
                                              {/* Mini action for Enrollment if appropriate stage */}
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
                          <button onClick={() => setShowAddRouteModal(true)} className="px-4 py-2 bg-brand-blue text-white rounded-lg font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
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
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Event Type</label>
                              <select 
                                  value={eventType} 
                                  onChange={(e) => setEventType(e.target.value as EventType)} 
                                  className={inputClass}
                              >
                                  <option value="GENERAL">General</option>
                                  <option value="ACADEMIC">Academic</option>
                                  <option value="HOLIDAY">Holiday</option>
                                  <option value="TRIP">Trip</option>
                                  <option value="STAFF">Staff Only</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Audience</label>
                              <select 
                                  value={eventAudience} 
                                  onChange={(e) => setEventAudience(e.target.value as EventAudience)} 
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
                                  {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                          </div>
                      )}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                          <textarea 
                              value={eventDesc} 
                              onChange={(e) => setEventDesc(e.target.value)} 
                              className="w-full h-24 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none resize-none"
                              placeholder="Add details..."
                          />
                      </div>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={eventRequiresConsent} onChange={(e) => setEventRequiresConsent(e.target.checked)} className="w-4 h-4 text-brand-blue"/>
                              <span className="text-sm text-gray-700">Requires Consent</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={eventRequiresPayment} onChange={(e) => setEventRequiresPayment(e.target.checked)} className="w-4 h-4 text-brand-blue"/>
                              <span className="text-sm text-gray-700">Requires Payment</span>
                          </label>
                      </div>
                      {eventRequiresPayment && (
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost (KES)</label>
                              <input 
                                  type="number" 
                                  value={eventCost} 
                                  onChange={(e) => setEventCost(parseInt(e.target.value))} 
                                  className={inputClass}
                              />
                          </div>
                      )}
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
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                          <input 
                              type="text" 
                              value={staffForm.fullName || ''}
                              onChange={(e) => setStaffForm({...staffForm, fullName: e.target.value})}
                              className={inputClass}
                              placeholder="e.g. Jane Doe"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role</label>
                              <select 
                                  value={staffForm.role || 'TEACHER'} 
                                  onChange={(e) => setStaffForm({...staffForm, role: e.target.value as StaffRole})}
                                  className={inputClass}
                              >
                                  <option value="TEACHER">Teacher</option>
                                  <option value="ADMIN">Admin</option>
                                  <option value="SUPPORT">Support Staff</option>
                                  <option value="PRINCIPAL">Principal</option>
                                  <option value="TRANSPORT">Transport</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department</label>
                              <input 
                                  type="text" 
                                  value={staffForm.department || ''}
                                  onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                                  className={inputClass}
                                  placeholder="e.g. Science"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                              <input 
                                  type="email" 
                                  value={staffForm.email || ''}
                                  onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                                  className={inputClass}
                                  placeholder="email@school.com"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
                              <input 
                                  type="tel" 
                                  value={staffForm.phone || ''}
                                  onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                                  className={inputClass}
                                  placeholder="07XX XXX XXX"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                              <input 
                                  type="date" 
                                  value={staffForm.startDate || ''}
                                  onChange={(e) => setStaffForm({...staffForm, startDate: e.target.value})}
                                  className={inputClass}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Salary Band</label>
                              <select 
                                  value={staffForm.salaryBand || ''} 
                                  onChange={(e) => setStaffForm({...staffForm, salaryBand: e.target.value})}
                                  className={inputClass}
                              >
                                  <option value="">Select Band</option>
                                  <option value="TS-1">TS-1 (Entry)</option>
                                  <option value="TS-2">TS-2 (Mid)</option>
                                  <option value="TS-3">TS-3 (Senior)</option>
                                  <option value="SS-1">SS-1 (Support)</option>
                              </select>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qualifications</label>
                          <div className="flex gap-2 mb-2">
                              <input 
                                  type="text" 
                                  value={qualInput}
                                  onChange={(e) => setQualInput(e.target.value)}
                                  className={inputClass}
                                  placeholder="Add degree/cert..."
                              />
                              <button onClick={handleAddQualification} className="px-4 bg-brand-grey text-gray-600 rounded-lg hover:bg-brand-blue hover:text-white transition-colors font-bold"><Plus size={18}/></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {staffForm.qualifications?.map((q, idx) => (
                                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                      {q} <button onClick={() => removeQualification(idx)}><X size={12} className="hover:text-red-500"/></button>
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-[12px]">
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

      {/* FEE STRUCTURE MODAL */}
      {isFeeBuilderOpen && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[12px] w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 flex flex-col max-h-[90vh]">
                  {/* ... (Fee Builder Content) ... */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[12px]">
                      <h3 className="text-xl font-display font-bold text-brand-blue">Fee Structure Builder</h3>
                      <button onClick={() => setIsFeeBuilderOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Grade</label>
                              <select 
                                  value={feeForm.grade} 
                                  onChange={(e) => setFeeForm({...feeForm, grade: e.target.value})}
                                  className={inputClass}
                              >
                                  {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Term</label>
                              <select 
                                  value={feeForm.term} 
                                  onChange={(e) => setFeeForm({...feeForm, term: e.target.value})}
                                  className={inputClass}
                              >
                                  <option>Term 1</option>
                                  <option>Term 2</option>
                                  <option>Term 3</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-3">
                              <label className="block text-xs font-bold text-gray-500 uppercase">Fee Items</label>
                              <button onClick={handleAddFeeItem} className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"><Plus size={12}/> Add Item</button>
                          </div>
                          <div className="space-y-3">
                              {feeForm.items?.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                      <input 
                                          type="text" 
                                          placeholder="Item Name (e.g. Tuition)" 
                                          value={item.name} 
                                          onChange={(e) => handleUpdateFeeItem(idx, 'name', e.target.value)}
                                          className={`${inputClass} flex-1`}
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Amount" 
                                          value={item.amount} 
                                          onChange={(e) => handleUpdateFeeItem(idx, 'amount', parseInt(e.target.value))}
                                          className={`${inputClass} w-32`}
                                      />
                                      <button onClick={() => handleRemoveFeeItem(idx)} className="text-gray-300 hover:text-brand-red"><Trash2 size={18}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-4 bg-brand-blue/5 rounded-[12px] flex justify-between items-center">
                          <span className="font-bold text-brand-blue">Total Fees</span>
                          <span className="text-2xl font-display font-bold text-brand-blue">KES {feeForm.total?.toLocaleString() || 0}</span>
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-[12px]">
                      <button 
                          onClick={handleSaveFeeStructure}
                          className="w-full h-12 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2"
                      >
                          <Save size={18}/> Publish Structure
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* STREAM ADD MODAL */}
      {showStreamModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[12px] w-full max-w-sm shadow-2xl relative animate-slide-up border border-gray-100">
                  <button onClick={() => setShowStreamModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  <div className="p-6 border-b border-gray-100">
                      <h3 className="font-display font-bold text-lg text-brand-blue">Add Stream for {selectedGrade}</h3>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stream Name</label>
                          <input type="text" value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)} className={inputClass} placeholder="e.g. East, West, Red"/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Class Color</label>
                          <div className="flex gap-2">
                              {['#1E3A8A', '#059669', '#FCD34D', '#38BDF8', '#EF4444', '#8B5CF6'].map(color => (
                                  <button 
                                    key={color}
                                    onClick={() => setNewStreamColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${newStreamColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                    style={{backgroundColor: color}}
                                  />
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Class Teacher</label>
                          <select value={newStreamTeacher} onChange={(e) => setNewStreamTeacher(e.target.value)} className={inputClass}>
                              <option value="">Select Teacher</option>
                              {staffRecords.filter(s => s.role === 'TEACHER').map(teacher => (
                                  <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                              ))}
                          </select>
                      </div>
                      <button onClick={handleAddStream} className="w-full h-12 bg-brand-blue text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2 mt-2">
                          Create Stream
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MANUAL PAYMENT MODAL */}
      {showPaymentModal && (
          <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
                  <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  <div className="p-6 border-b border-gray-100">
                      <h3 className="font-display font-bold text-xl text-brand-blue">Record Payment</h3>
                      <p className="text-sm text-gray-500">Log an external transaction (Cash/Bank).</p>
                  </div>
                  <div className="p-6 space-y-4">
                      {/* Search Student Dropdown */}
                      <div className="relative">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student</label>
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                              <input 
                                  type="text" 
                                  value={paymentStudentSearch}
                                  onChange={(e) => setPaymentStudentSearch(e.target.value)}
                                  className={`${inputClass} pl-10`}
                                  placeholder="Search Name or Adm No..."
                              />
                          </div>
                          {paymentStudentSearch.length > 1 && !selectedStudentForPay && (
                              <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-b-lg z-20 max-h-40 overflow-y-auto">
                                  {searchedStudentsForPayment.length > 0 ? searchedStudentsForPayment.map(s => (
                                      <div 
                                          key={s.id} 
                                          onClick={() => { setSelectedStudentForPay(s); setPaymentStudentSearch(s.name); }}
                                          className="p-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-0"
                                      >
                                          {s.name} <span className="text-gray-400 text-xs">({s.admissionNumber})</span>
                                      </div>
                                  )) : (
                                      <div className="p-3 text-xs text-gray-400 text-center">No student found.</div>
                                  )}
                              </div>
                          )}
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount (KES)</label>
                          <input 
                              type="number" 
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className={inputClass}
                              placeholder="0.00"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Method</label>
                              <select 
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className={inputClass}
                              >
                                  <option value="CASH">Cash</option>
                                  <option value="BANK">Direct Bank Transfer</option>
                                  <option value="CHEQUE">Cheque</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reference No</label>
                              <input 
                                  type="text" 
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                  className={inputClass}
                                  placeholder="Ref / Receipt #"
                              />
                          </div>
                      </div>

                      <div className="border-2 border-dashed border-gray-200 rounded-[12px] p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-all">
                          <UploadCloud size={24} className="text-gray-400 mb-2"/>
                          <span className="text-xs font-bold text-gray-600">Upload Proof (Optional)</span>
                      </div>

                      <button 
                          onClick={handleManualPayment}
                          disabled={isProcessingPayment || !selectedStudentForPay || !paymentAmount}
                          className="w-full h-12 bg-brand-green text-white font-bold rounded-[12px] shadow-lg hover:bg-brand-green/90 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isProcessingPayment ? <Loader2 className="animate-spin" size={20}/> : 'Record Transaction'}
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
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Route Name</label>
                          <input 
                              type="text" 
                              value={routeName}
                              onChange={(e) => setRouteName(e.target.value)}
                              className={inputClass}
                              placeholder="e.g. Westlands Morning"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Driver Name</label>
                              <input 
                                  type="text" 
                                  value={routeDriver}
                                  onChange={(e) => setRouteDriver(e.target.value)}
                                  className={inputClass}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle No.</label>
                              <input 
                                  type="text" 
                                  value={routeVehicle}
                                  onChange={(e) => setRouteVehicle(e.target.value)}
                                  className={inputClass}
                                  placeholder="KBA 123X"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Schedule Time</label>
                          <input 
                              type="time" 
                              value={routeTime}
                              onChange={(e) => setRouteTime(e.target.value)}
                              className={inputClass}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stops (Comma Separated)</label>
                          <textarea 
                              value={routeStops.join(', ')}
                              onChange={(e) => setRouteStops(e.target.value.split(',').map(s => s.trim()))}
                              className="w-full h-24 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none"
                              placeholder="Stop 1, Stop 2, Stop 3..."
                          />
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-[12px]">
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
