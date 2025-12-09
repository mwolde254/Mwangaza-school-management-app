import React, { useState, useMemo, useEffect } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { Wallet, Star, AlertCircle, Loader2, Calendar, BookOpen, Bell, ArrowRight, CheckCircle2, X, Check, Users, MapPin, FileText, Table, HelpCircle, Phone, Mail, ChevronDown, ChevronUp, MessageSquare, Send, Bus, Clock, Trophy } from 'lucide-react';
import { db } from '../services/db';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import TimetableModule from '../components/TimetableModule';
import { TicketCategory } from '../types';

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
    if (!ticketSubject || !ticketMessage) return;
    setIsSubmittingTicket(true);
    
    // Resolve student name if selected
    const relStudent = students.find(s => s.id === ticketStudentId);

    try {
        await addSupportTicket({
            parentId: user?.id || 'unknown',
            parentName: user?.name || 'Parent',
            studentId: ticketStudentId || undefined,
            studentName: relStudent?.name,
            category: ticketCategory,
            subject: ticketSubject,
            message: ticketMessage,
            status: 'OPEN',
            date: new Date().toISOString()
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
  const myTickets = supportTickets.filter(t => t.parentId === user?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Derived Attendance Stats
  const totalDays = childAttendance.length || 1;
  const presentDays = childAttendance.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = Math.round((presentDays / totalDays) * 100);

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
            
            {/* 1. STUDENT SCORE WIDGET */}
            <div className="md:col-span-4 bg-gradient-to-br from-brand-blue to-blue-900 rounded-[12px] shadow-lg p-6 relative overflow-hidden text-white flex flex-col justify-between h-full min-h-[220px]">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Points</p>
                            <span className="text-4xl font-display font-extrabold">{activeChild.totalPoints || 0}</span>
                        </div>
                        <div className="p-3 bg-white/10 rounded-full">
                            <Trophy size={24} className="text-brand-yellow"/>
                        </div>
                    </div>
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-brand-yellow w-3/4"></div>
                    </div>
                    <p className="text-xs text-blue-100">Top 10% in class! Keep it up.</p>
                </div>
                
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 mt-4">
                    <Star size={14}/> View Achievements
                </button>
            </div>

            {/* 2. FEES WIDGET */}
            <div className="md:col-span-4 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-brand-green/10 text-brand-green rounded-xl">
                            <Wallet size={24}/>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${activeChild.balance > 0 ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-green/10 text-brand-green'}`}>
                            {activeChild.balance > 0 ? 'Balance Due' : 'Cleared'}
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-4 mb-1">Outstanding Fees</p>
                    <p className="text-3xl font-display font-bold text-gray-800">KES {activeChild.balance.toLocaleString()}</p>
                </div>
                {activeChild.balance > 0 && (
                    <button 
                        onClick={handlePayFees}
                        className="w-full py-3 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
                    >
                        Pay Now <ArrowRight size={14}/>
                    </button>
                )}
            </div>

            {/* 3. ATTENDANCE WIDGET */}
            <div className="md:col-span-4 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full min-h-[220px]">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Attendance</p>
                        <p className="text-3xl font-display font-bold text-gray-800">{attendanceRate}%</p>
                        <p className="text-xs text-gray-500 mt-1">Present {presentDays} of {totalDays} days</p>
                    </div>
                    <div className="h-16 w-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ value: attendanceRate, color: '#059669' }, { value: 100 - attendanceRate, color: '#F3F4F6' }]}
                                    innerRadius={20}
                                    outerRadius={30}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <Cell fill="#059669" />
                                    <Cell fill="#F3F4F6" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-green"></div> Present</span>
                        <span className="font-bold">{presentDays}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-red"></div> Absent</span>
                        <span className="font-bold">{totalDays - presentDays}</span>
                    </div>
                </div>
            </div>

            {/* 4. UPCOMING EVENTS & CONSENT */}
            <div className="md:col-span-8 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Calendar size={20} className="text-brand-blue"/> Upcoming Events
                    </h3>
                </div>
                <div className="space-y-4">
                    {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                        const hasConsent = checkConsentStatus(event.id);
                        return (
                            <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-gray-200 w-16 h-16 shrink-0">
                                        <span className="text-xs font-bold text-brand-red uppercase">{format(new Date(event.startDate), 'MMM')}</span>
                                        <span className="text-xl font-display font-bold text-gray-800">{format(new Date(event.startDate), 'dd')}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{event.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{event.description || 'No details provided.'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {event.requiresPayment && (
                                                <span className="text-[10px] font-bold bg-brand-yellow/10 text-brand-yellow-700 px-2 py-0.5 rounded">
                                                    Cost: KES {event.cost}
                                                </span>
                                            )}
                                            {event.requiresConsent && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hasConsent ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                                                    {hasConsent ? 'Consent Signed' : 'Consent Needed'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end md:self-center">
                                    {event.requiresConsent && !hasConsent && (
                                        <button 
                                            onClick={() => handleSignConsent(event.id)}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:border-brand-green hover:text-brand-green transition-colors"
                                        >
                                            Sign Consent
                                        </button>
                                    )}
                                    {event.requiresPayment && (
                                        <button 
                                            onClick={() => handlePayTrip(event)}
                                            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20"
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-gray-400 text-sm italic">
                            No upcoming events scheduled.
                        </div>
                    )}
                </div>
            </div>

            {/* 5. TIMETABLE PREVIEW */}
            <div className="md:col-span-4 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Clock size={20} className="text-brand-blue"/> Today's Classes
                    </h3>
                </div>
                <div className="flex-1 overflow-hidden">
                    <TimetableModule mode="PARENT" targetClass={activeChild.grade} />
                </div>
            </div>

            {/* 6. TRANSPORT STATUS */}
            {activeRoute && (
                <div className="md:col-span-12 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Bus size={20} className="text-brand-yellow"/> Transport Status
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeVehicle?.status === 'ON_ROUTE' ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-100 text-gray-500'}`}>
                            {activeVehicle?.status.replace('_', ' ') || 'OFFLINE'}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 space-y-2 w-full">
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500">Route</span>
                                <span className="text-xs font-bold text-gray-800">{activeRoute.name}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500">Driver</span>
                                <span className="text-xs font-bold text-gray-800">{activeRoute.driverName}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500">Vehicle</span>
                                <span className="text-xs font-bold text-gray-800">{activeRoute.vehicleNumber}</span>
                            </div>
                        </div>
                        {activeVehicle && (
                            <div className="flex-1 w-full bg-brand-blue/5 rounded-xl p-4 flex items-center justify-center gap-4 border border-brand-blue/10">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Next Stop</p>
                                    <p className="text-lg font-bold text-brand-blue">{activeVehicle.nextStop}</p>
                                </div>
                                <div className="h-10 w-px bg-gray-200"></div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">ETA</p>
                                    <p className="text-lg font-bold text-brand-green font-mono">{activeVehicle.etaToNextStop}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      )}

      {/* === SUPPORT MODE === */}
      {mode === 'SUPPORT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
              {/* Ticket History */}
              <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
                  <h3 className="font-display font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                      <MessageSquare size={20} className="text-brand-blue"/> My Tickets
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                      {myTickets.length > 0 ? myTickets.map(ticket => (
                          <div key={ticket.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.status === 'OPEN' ? 'bg-brand-yellow/10 text-brand-yellow-700' : 'bg-brand-green/10 text-brand-green'}`}>
                                      {ticket.status}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{format(new Date(ticket.date), 'dd MMM yyyy')}</span>
                              </div>
                              <h4 className="font-bold text-sm text-gray-800 mb-1">{ticket.subject}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{ticket.message}</p>
                              
                              <button 
                                onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                className="text-xs font-bold text-brand-blue mt-3 hover:underline flex items-center gap-1"
                              >
                                {expandedTicketId === ticket.id ? 'Hide Details' : 'View Details'}
                              </button>

                              {expandedTicketId === ticket.id && ticket.adminResponse && (
                                  <div className="mt-3 bg-brand-blue/5 p-3 rounded-lg border border-brand-blue/10 animate-fade-in">
                                      <p className="text-[10px] font-bold text-brand-blue uppercase mb-1">Admin Response</p>
                                      <p className="text-xs text-gray-700">{ticket.adminResponse}</p>
                                  </div>
                              )}
                          </div>
                      )) : (
                          <div className="text-center py-12 text-gray-400 italic">
                              No support tickets found.
                          </div>
                      )}
                  </div>
              </div>

              {/* New Ticket Form & FAQs */}
              <div className="space-y-6">
                  {/* Create Ticket */}
                  <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6">
                      <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Create New Ticket</h3>
                      <form onSubmit={handleSubmitTicket} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Related Student</label>
                              <select 
                                value={ticketStudentId}
                                onChange={(e) => setTicketStudentId(e.target.value)}
                                className={inputClass}
                              >
                                  <option value="">General Query</option>
                                  {myChildren.map(child => (
                                      <option key={child.id} value={child.id}>{child.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                              <select 
                                value={ticketCategory}
                                onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
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
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
                              <input 
                                type="text"
                                value={ticketSubject}
                                onChange={(e) => setTicketSubject(e.target.value)}
                                className={inputClass}
                                placeholder="Brief summary of issue"
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message</label>
                              <textarea 
                                value={ticketMessage}
                                onChange={(e) => setTicketMessage(e.target.value)}
                                className="w-full h-32 p-3 rounded-[12px] border border-gray-200 text-sm focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none resize-none font-medium text-gray-700"
                                placeholder="Describe your issue in detail..."
                                required
                              />
                          </div>
                          <button 
                            type="submit" 
                            disabled={isSubmittingTicket}
                            className={`w-full h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg hover:bg-brand-blue/90 flex items-center justify-center gap-2 ${btnBase}`}
                          >
                              {isSubmittingTicket ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Submit Ticket</>}
                          </button>
                      </form>
                  </div>

                  {/* Quick FAQs */}
                  <div className="bg-brand-sky/5 rounded-[12px] border border-brand-sky/10 p-6">
                      <h3 className="font-display font-bold text-lg text-brand-blue mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-4">
                          {faqs.map((faq, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                  <p className="text-xs font-bold text-gray-800 mb-1">{faq.q}</p>
                                  <p className="text-xs text-gray-500">{faq.a}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && paymentContext && (
        <PaymentGatewayModal 
            isOpen={showPaymentGateway}
            onClose={() => setShowPaymentGateway(false)}
            student={activeChild}
            paymentContext={paymentContext}
            onSuccess={() => {
                showToast("Payment processed successfully!");
                setShowPaymentGateway(false);
            }}
            userPhone={user?.phoneNumber}
        />
      )}

    </div>
  );
};

export default ParentPortal;