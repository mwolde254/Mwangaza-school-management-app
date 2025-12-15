
import React, { useState, useMemo, useEffect } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { Wallet, Star, AlertCircle, Loader2, Calendar, BookOpen, Bell, ArrowRight, CheckCircle2, X, Check, Users, MapPin, FileText, Table, HelpCircle, Phone, Mail, ChevronDown, ChevronUp, MessageSquare, Send, Bus, Clock } from 'lucide-react';
import { db } from '../services/db';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import TimetableModule from '../components/TimetableModule';
import { TicketCategory, UserRole } from '../types';

const ParentPortal: React.FC = () => {
  const { students, transactions, attendance, competencies, events, consents, submitConsent, supportTickets, addSupportTicket, transportRoutes, transportVehicles } = useStudentData();
  const { user } = useAuth();
  
  const [mode, setMode] = useState<'DASHBOARD' | 'SUPPORT'>('DASHBOARD');

  // Dynamically resolve linked children
  const myChildren = useMemo(() => {
    if (!user) return [];
    if (user.linkedStudentIds && user.linkedStudentIds.length > 0) {
      return students.filter(s => user.linkedStudentIds?.includes(s.id));
    }
    return [];
  }, [students, user]);

  const [activeChildId, setActiveChildId] = useState<string>('');
  
  // Auto-select first child on load
  useEffect(() => {
    if (myChildren.length > 0) {
      if (!activeChildId || !myChildren.find(c => c.id === activeChildId)) {
        setActiveChildId(myChildren[0].id);
      }
    }
  }, [myChildren, activeChildId]);

  // Payment Modal State
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentContext, setPaymentContext] = useState<{
    type: 'TUITION' | 'TRIP' | 'EVENT' | 'UNIFORM' | 'LUNCH' | 'TRANSPORT';
    title: string;
    amount: number;
    eventId?: string;
  } | null>(null);

  // Support Form State
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('FEES');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketStudentId, setTicketStudentId] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  
  const activeChild = myChildren.find(c => c.id === activeChildId) || myChildren[0];

  // EVENTS LOGIC
  const relevantEvents = useMemo(() => {
    if (!activeChild) return [];
    return events.filter(e => {
        if (e.audience === 'WHOLE_SCHOOL') return true;
        if (e.audience === 'GRADE' && e.targetGrade === activeChild.grade) return true;
        return false;
    }).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, activeChild]);

  const upcomingEvents = relevantEvents.filter(e => new Date(e.startDate) >= new Date()).slice(0, 3);

  const checkConsentStatus = (eventId: string) => {
      return consents.some(c => c.eventId === eventId && c.studentId === activeChildId && c.status === 'SIGNED');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Payment Triggers
  const handlePayFees = () => {
    setPaymentContext({
      type: 'TUITION',
      title: 'School Fees Payment',
      amount: activeChild.balance
    });
    setShowPaymentGateway(true);
  };

  const handlePayTrip = (event: any) => {
    setPaymentContext({
      type: 'TRIP',
      title: `Pay for ${event.title}`,
      amount: event.cost || 0,
      eventId: event.id
    });
    setShowPaymentGateway(true);
  };

  const handleSignConsent = async (eventId: string) => {
     if (confirm("By signing, you give consent for your child to participate in this activity.")) {
        await submitConsent({
            eventId,
            studentId: activeChildId,
            parentName: user?.name || 'Parent',
            signedDate: new Date().toISOString(),
            status: 'SIGNED'
        });
        showToast("Consent form signed successfully!");
     }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !user) return;
    setIsSubmittingTicket(true);
    
    // Resolve student name if selected
    const relStudent = students.find(s => s.id === ticketStudentId);

    try {
        await addSupportTicket({
            source: 'PARENT',
            requestorId: user.id,
            requestorName: user.name,
            requestorRole: UserRole.PARENT,
            studentId: ticketStudentId || undefined,
            studentName: relStudent?.name,
            category: ticketCategory,
            subject: ticketSubject,
            status: 'OPEN',
            priority: 'NORMAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: `msg_${Date.now()}`,
                    senderId: user.id,
                    senderName: user.name,
                    role: UserRole.PARENT,
                    message: ticketMessage,
                    timestamp: new Date().toISOString()
                }
            ]
        });
        showToast("Query submitted successfully. We will respond shortly.");
        setTicketSubject('');
        setTicketMessage('');
        setTicketCategory('FEES');
    } catch (err) {
        showToast("Failed to submit ticket.");
    } finally {
        setIsSubmittingTicket(false);
    }
  };

  // --- EMPTY STATE ---
  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in bg-white rounded-[12px] border border-gray-100 shadow-sm mx-auto max-w-2xl mt-8">
         <div className="w-24 h-24 bg-brand-grey rounded-full flex items-center justify-center mb-6 text-gray-400">
            <Users size={40}/>
         </div>
         <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">No Students Linked</h2>
         <p className="text-gray-500 max-w-md mb-8">
           Your account is not currently linked to any student profiles. Please contact the school administration to have your children added to your account.
         </p>
         <button onClick={() => showToast("Support ticket created.")} className="px-6 py-3 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all">
            Contact Administration
         </button>
         {toast && (
            <div className="fixed top-20 right-8 z-50 px-6 py-4 bg-brand-blue text-white rounded-xl shadow-xl flex items-center gap-3 animate-slide-up">
               <Check size={20}/> <span className="font-bold text-sm">{toast}</span>
            </div>
         )}
      </div>
    );
  }

  // --- DATA FILTERING ---
  const childTransactions = transactions.filter(t => t.studentId === activeChildId);
  const childCompetencies = competencies.filter(c => c.studentId === activeChildId);
  const childAttendance = attendance.filter(a => a.studentId === activeChildId);
  
  // Transport Logic
  const activeRoute = transportRoutes.find(r => r.id === activeChild.transportRouteId);
  const activeVehicle = activeRoute ? transportVehicles.find(v => v.routeId === activeRoute.id) : null;

  // My Tickets
  const myTickets = supportTickets.filter(t => t.requestorId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Derived Attendance Stats
  const totalDays = childAttendance.length || 1;
  const presentDays = childAttendance.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = Math.round((presentDays / totalDays) * 100);

  // Mock Announcements/Homework
  const notices = [
    { id: 1, type: 'HOMEWORK', title: 'Mathematics: Fractions Worksheet', due: 'Tomorrow', subject: 'Mathematics' },
    { id: 2, type: 'ALERT', title: 'School fees deadline approaching', due: 'Urgent', subject: 'Admin' },
  ];

  const btnBase = "rounded-xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-brand-sky/30 disabled:opacity-50 active:scale-[0.98]";
  const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";

  // FAQs Data
  const faqs = [
      { q: "How do I pay via M-Pesa?", a: "Go to M-Pesa > Lipa na M-Pesa > Paybill. Enter Business No: 522522, Account No: [Student ADM]. Enter amount and PIN." },
      { q: "Where can I find the Fee Structure?", a: "Fee structures are emailed at the beginning of each term. You can also request a copy from the Finance Office." },
      { q: "How do I reset my password?", a: "Go to Settings > Profile > Change Password. If you forgot it, use the 'Forgot Password' link on the login screen." },
      { q: "When does the next term begin?", a: "Term dates are listed in the 'Upcoming Events' section of your dashboard." }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12 relative">
      {toast && (
        <div className="fixed top-20 right-8 z-50 px-6 py-4 bg-brand-blue text-white rounded-xl shadow-xl flex items-center gap-3 animate-slide-up">
           <Check size={20}/> <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-blue">Jambo, {user?.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 text-sm">Here is the latest for your children.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            <button 
                onClick={() => setMode(mode === 'DASHBOARD' ? 'SUPPORT' : 'DASHBOARD')}
                className={`px-4 py-2 rounded-[12px] font-bold text-sm flex items-center gap-2 transition-all ${mode === 'SUPPORT' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
                <HelpCircle size={18}/> {mode === 'SUPPORT' ? 'Close Support' : 'Help & Support'}
            </button>

            {/* Child Selector Pills */}
            <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 inline-flex">
            {myChildren.map(child => (
                <button
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand-sky/50 flex items-center gap-2 ${activeChildId === child.id ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:text-brand-blue hover:bg-gray-50'}`}
                >
                <img src={child.avatarUrl} className="w-5 h-5 rounded-full border border-white/20" alt="" />
                {child.name.split(' ')[0]}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* === DASHBOARD MODE === */}
      {mode === 'DASHBOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">
            
            {/* 1. FINANCE WIDGET (Prominent - Col Span 8) */}
            <div className="md:col-span-8 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden group hover:shadow-md transition-all">
            {/* Decorative Background Blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl group-hover:bg-brand-yellow/20 transition-all"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 text-brand-blue/80">
                    <Wallet size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Fee Status • Term 3</span>
                    </div>
                    
                    <div className="mb-6">
                    {activeChild.balance > 0 ? (
                        <>
                        <p className="text-5xl font-display font-extrabold text-gray-800 tracking-tight">
                            <span className="text-xl text-gray-400 font-sans align-top mr-1">KES</span>
                            {activeChild.balance.toLocaleString()}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold mt-2">
                            <AlertCircle size={12}/> Outstanding Balance
                        </div>
                        </>
                    ) : (
                        <>
                        <p className="text-5xl font-display font-extrabold text-brand-green tracking-tight">Cleared</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-xs font-bold mt-2">
                            <CheckCircle2 size={12}/> Fees Fully Paid
                        </div>
                        </>
                    )}
                    </div>

                    <div className="flex gap-3">
                    {activeChild.balance > 0 && (
                        <button 
                        onClick={handlePayFees}
                        className="px-8 h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-brand-sky/30 active:scale-[0.98]"
                        >
                        Settle Now via MPesa
                        </button>
                    )}
                    <button 
                        onClick={() => showToast("Financial history downloaded.")}
                        className="px-6 h-12 bg-brand-grey text-gray-600 rounded-[12px] font-bold hover:bg-gray-200 transition-all focus:ring-2 focus:ring-brand-sky/30"
                    >
                        History
                    </button>
                    </div>
                </div>

                {/* Mini Transaction List */}
                <div className="hidden md:block w-64 border-l border-gray-100 pl-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Recent Payments</h4>
                    <div className="space-y-3">
                    {childTransactions.slice(0, 3).map(t => (
                        <div key={t.id} className="text-sm">
                        <div className="flex justify-between font-bold text-gray-700">
                            <span>{t.type}</span>
                            <span className="text-brand-green">+{t.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-400">{t.date} via {t.method}</div>
                        </div>
                    ))}
                    {childTransactions.length === 0 && <p className="text-xs text-gray-400 italic">No recent history.</p>}
                    </div>
                </div>
            </div>
            </div>

            {/* 2. TRANSPORT INTELLIGENCE WIDGET (Col Span 4) */}
            <div className="md:col-span-4 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all overflow-hidden relative">
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-brand-blue/80">
                        <Bus size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">My Child's Transport</span>
                    </div>
                </div>

                {activeRoute ? (
                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="mb-4">
                            <h4 className="text-lg font-bold text-gray-800">{activeRoute.name}</h4>
                            <p className="text-xs text-gray-500">Scheduled: {activeRoute.scheduleTime}</p>
                        </div>

                        {activeVehicle && activeVehicle.status !== 'IDLE' ? (
                            <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 mb-4 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${activeVehicle.status === 'DELAYED' ? 'bg-brand-red text-white' : 'bg-brand-green text-white'}`}>
                                        {activeVehicle.status === 'ON_ROUTE' ? 'Arriving Soon' : 'Delayed'}
                                    </span>
                                    <span className="text-2xl font-bold text-brand-blue">{activeVehicle.etaToNextStop}</span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p className="flex items-center gap-2"><MapPin size={12}/> Next Stop: {activeVehicle.nextStop}</p>
                                    <p className="flex items-center gap-2"><Users size={12}/> Driver: {activeRoute.driverName}</p>
                                </div>
                                {/* Simple Visual Progress */}
                                <div className="mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-blue w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                <Clock size={32} className="text-gray-300 mb-2"/>
                                <p className="text-sm font-bold text-gray-500">Bus is currently idle.</p>
                                <p className="text-xs text-gray-400">Next trip starts tomorrow morning.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                        <Bus size={32} className="mb-2 opacity-20"/>
                        <p className="text-xs italic">No transport assigned.</p>
                    </div>
                )}
            </div>

            {/* 3. TIMETABLE WIDGET (Col Span 12) */}
            <div className="md:col-span-12">
                <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                        <Table size={18} className="text-brand-blue"/>
                        <span className="text-sm font-bold text-gray-800">Class Timetable: {activeChild.grade}</span>
                    </div>
                    <div className="p-4">
                        <TimetableModule mode="PARENT" targetClass={activeChild.grade} />
                    </div>
                </div>
            </div>

            {/* 4. CBC ACADEMICS (Col Span 6) */}
            <div className="md:col-span-6 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-brand-blue/80">
                    <Star size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">CBC Competencies</span>
                </div>
                <button onClick={() => showToast("Full report card opened.")} className="text-xs font-bold text-brand-sky hover:underline">View All Report</button>
            </div>

            <div className="space-y-4">
                {childCompetencies.length > 0 ? childCompetencies.slice(0, 3).map(comp => (
                    <div key={comp.id} className="p-4 border border-gray-50 bg-gray-50/50 rounded-[12px] flex justify-between items-center group hover:bg-white hover:border-brand-sky/20 hover:shadow-sm transition-all">
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{comp.subject}</h4>
                        <p className="text-xs text-gray-500 mt-1">{comp.strand}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        comp.rating === 'Exceeding' ? 'bg-brand-green/10 text-brand-green' : 
                        comp.rating === 'Meeting Expectation' ? 'bg-brand-sky/10 text-brand-sky' :
                        'bg-brand-yellow/10 text-brand-yellow'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            comp.rating === 'Exceeding' ? 'bg-brand-green' : 
                            comp.rating === 'Meeting Expectation' ? 'bg-brand-sky' :
                            'bg-brand-yellow'
                        }`}></div>
                        {comp.rating}
                    </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-[12px]">No competencies recorded yet.</div>
                )}
            </div>
            </div>

            {/* 5. COMMUNICATION & HOMEWORK (Col Span 6) */}
            <div className="md:col-span-6 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-brand-blue/80">
                    <Bell size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Notice Board</span>
                </div>
            </div>

            <div className="space-y-3">
                {notices.map(notice => (
                    <div 
                    key={notice.id} 
                    onClick={() => showToast(`Opened: ${notice.title}`)}
                    className="flex gap-4 p-4 rounded-[12px] hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer group"
                    >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notice.type === 'HOMEWORK' ? 'bg-brand-blue/10 text-brand-blue' :
                        notice.type === 'ALERT' ? 'bg-brand-red/10 text-brand-red' :
                        'bg-brand-yellow/10 text-brand-yellow'
                    }`}>
                        {notice.type === 'HOMEWORK' && <BookOpen size={18}/>}
                        {notice.type === 'EVENT' && <Calendar size={18}/>}
                        {notice.type === 'ALERT' && <AlertCircle size={18}/>}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 text-sm group-hover:text-brand-blue transition-colors">{notice.title}</h4>
                            <span className="text-[10px] font-bold text-brand-red px-2 py-0.5 bg-brand-red/5 rounded-full">{notice.due}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{notice.subject}</p>
                    </div>
                    <div className="flex items-center text-gray-300 group-hover:text-brand-blue transition-colors">
                        <ArrowRight size={16} />
                    </div>
                    </div>
                ))}
            </div>
            </div>

        </div>
      )}

      {/* === SUPPORT MODE === */}
      {mode === 'SUPPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            
            {/* COL 1: CONTACT & FORM */}
            <div className="space-y-6">
                {/* Official Directory */}
                <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Phone size={20}/> Official Contacts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">General Inquiries</p>
                            <p className="font-bold text-gray-800">School Secretary</p>
                            <a href="tel:0700123456" className="text-sm font-bold text-brand-sky hover:underline mt-1 block">+254 700 123 456</a>
                            <a href="mailto:info@mwangaza.co.ke" className="text-xs text-gray-500 mt-1 block">info@mwangaza.co.ke</a>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Finance & Accounts</p>
                            <p className="font-bold text-gray-800">Bursar's Office</p>
                            <a href="tel:0700123457" className="text-sm font-bold text-brand-sky hover:underline mt-1 block">+254 700 123 457</a>
                            <a href="mailto:accounts@mwangaza.co.ke" className="text-xs text-gray-500 mt-1 block">accounts@mwangaza.co.ke</a>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Transport</p>
                            <p className="font-bold text-gray-800">Transport Manager</p>
                            <a href="tel:0700123458" className="text-sm font-bold text-brand-sky hover:underline mt-1 block">+254 700 123 458</a>
                        </div>
                    </div>
                </div>

                {/* Submit Ticket Form */}
                <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-1 flex items-center gap-2"><MessageSquare size={20}/> Submit a Query</h3>
                    <p className="text-xs text-gray-500 mb-6">Create a support ticket and track its progress.</p>
                    
                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                                <select 
                                    value={ticketCategory}
                                    onChange={(e) => setTicketCategory(e.target.value as any)}
                                    className={inputClass}
                                >
                                    <option value="FEES">Fees & Finance</option>
                                    <option value="ACADEMIC">Academics</option>
                                    <option value="TRANSPORT">Transport</option>
                                    <option value="DISCIPLINARY">Disciplinary</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Related Child</label>
                                <select 
                                    value={ticketStudentId}
                                    onChange={(e) => setTicketStudentId(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">-- General / None --</option>
                                    {myChildren.map(child => (
                                        <option key={child.id} value={child.id}>{child.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
                            <input 
                                type="text"
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                                required
                                className={inputClass}
                                placeholder="Brief summary of issue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message</label>
                            <textarea 
                                value={ticketMessage}
                                onChange={(e) => setTicketMessage(e.target.value)}
                                required
                                className="w-full p-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white min-h-[120px]"
                                placeholder="Describe your inquiry in detail..."
                            ></textarea>
                        </div>
                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={isSubmittingTicket}
                                className={`w-full h-12 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2`}
                            >
                                {isSubmittingTicket ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* COL 2: HISTORY & FAQs */}
            <div className="space-y-6">
                {/* Ticket History */}
                <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4">My Recent Queries</h3>
                    <div className="space-y-3">
                        {myTickets.length > 0 ? myTickets.map(ticket => (
                            <div key={ticket.id} className="border border-gray-100 rounded-lg overflow-hidden transition-all hover:shadow-sm">
                                <div 
                                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                    className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{ticket.subject}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-500">{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</span>
                                            <span className="text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-500 font-bold uppercase">{ticket.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            ticket.status === 'RESOLVED' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                        {expandedTicketId === ticket.id ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                                    </div>
                                </div>
                                
                                {expandedTicketId === ticket.id && (
                                    <div className="p-4 bg-white border-t border-gray-100 text-sm animate-fade-in">
                                        {ticket.messages.map((msg) => (
                                            <div key={msg.id} className={`mb-3 p-3 rounded-lg ${msg.role === 'PARENT' ? 'bg-gray-50' : 'bg-brand-blue/5 border border-brand-blue/10 ml-4'}`}>
                                                <div className="flex justify-between mb-1">
                                                    <span className={`text-xs font-bold ${msg.role === 'PARENT' ? 'text-gray-600' : 'text-brand-blue'}`}>
                                                        {msg.senderName} ({msg.role === 'ADMIN' ? 'Admin' : 'Parent'})
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                                                </div>
                                                <p className="text-gray-700">{msg.message}</p>
                                            </div>
                                        ))}
                                        
                                        {ticket.status !== 'RESOLVED' && (
                                            <div className="flex items-center gap-2 text-gray-400 text-xs italic bg-gray-50 p-2 rounded mt-3">
                                                <Loader2 size={12} className="animate-spin"/> Awaiting response...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <p className="text-center py-8 text-gray-400 text-sm italic">No past queries found.</p>
                        )}
                    </div>
                </div>

                {/* FAQ Accordion */}
                <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={20}/> Frequently Asked Questions</h3>
                    <div className="space-y-2">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="group border border-gray-100 rounded-lg bg-gray-50/50 open:bg-white open:shadow-sm transition-all">
                                <summary className="flex justify-between items-center p-4 cursor-pointer font-bold text-sm text-gray-700 hover:text-brand-blue list-none">
                                    <span>{faq.q}</span>
                                    <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform"/>
                                </summary>
                                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* CENTRAL PAYMENT GATEWAY MODAL */}
      {showPaymentGateway && paymentContext && activeChild && (
        <PaymentGatewayModal
          isOpen={showPaymentGateway}
          onClose={() => setShowPaymentGateway(false)}
          student={activeChild}
          paymentContext={paymentContext}
          userPhone={user?.phoneNumber}
          onSuccess={() => {
             // Optional: Refresh data or show specific success toast
             showToast("Payment recorded successfully!");
          }}
        />
      )}
    </div>
  );
};

export default ParentPortal;
