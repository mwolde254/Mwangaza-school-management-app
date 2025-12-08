
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceStatus, AttendanceRecord, Competency, LeaveType } from '../types';
import { format, isSameDay, addDays, differenceInBusinessDays, parseISO } from 'date-fns';
import { Check, Clock, X, Save, Edit3, Award, Plus, AlertCircle, ChevronDown, ArrowLeft, Send, BookOpen, Users, ArrowRight, Calendar, Loader2, Briefcase, Stethoscope, Palmtree, Heart, Table } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import TimetableModule from '../components/TimetableModule';

const TeacherPortal: React.FC = () => {
  const { students, submitAttendance, assessments, addAssessment, updateAssessment, attendance, competencies, addStudent, events, leaveRequests, submitLeaveRequest, users } = useStudentData(); 
  const { user } = useAuth();
  const [mode, setMode] = useState<'DASHBOARD' | 'ATTENDANCE' | 'ASSESSMENT' | 'COMPETENCY' | 'LEAVE' | 'TIMETABLE'>('DASHBOARD');
  const [selectedClass, setSelectedClass] = useState('Grade 4 - Mathematics');
  
  // -- DASHBOARD METRICS CALCULATION --
  
  // Attendance Summary
  const totalStudents = students.length;
  const presentCount = Math.floor(totalStudents * 0.8); 
  const lateCount = Math.floor(totalStudents * 0.1);
  const absentCount = totalStudents - presentCount - lateCount;

  // CBC Summary
  const emergingCompetencies = competencies.filter(c => c.rating === 'Emerging');
  const recentCompetenciesCount = competencies.length; 
  const cbcProgress = 65; 

  // Assessment Summary
  const avgScore = Math.round(assessments.reduce((acc, curr) => acc + curr.score, 0) / (assessments.length || 1));
  const ungradedCount = 5; 

  // Homework Mock Data
  const homeworkData = [
    { status: 'Submitted', count: 24, fill: '#059669' },
    { status: 'Late', count: 4, fill: '#FCD34D' },
    { status: 'Missing', count: 2, fill: '#EF4444' },
  ];
  
  // Schedule Logic
  const today = new Date();
  const todaysEvents = events.filter(e => isSameDay(new Date(e.startDate), today));
  const tomorrowsEvents = events.filter(e => isSameDay(new Date(e.startDate), addDays(today, 1)));

  // -- ACTION STATE MANAGEMENT --
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus, minutes: number }>>(() => {
    const initial: any = {};
    students.forEach(s => initial[s.id] = { status: AttendanceStatus.PRESENT, minutes: 0 });
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // -- LEAVE STATE --
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveCover, setLeaveCover] = useState('');

  const myLeaveRequests = leaveRequests.filter(req => req.staffId === user?.id).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  
  // Balances (Mocked logic if user balances are missing)
  const balances = user?.leaveBalances || { annual: { total: 21, used: 0 }, sick: { total: 14, used: 0 }, compassionate: { total: 7, used: 0 } };

  const getLeaveIcon = (type: LeaveType) => {
    switch(type) {
      case 'MEDICAL': return <Stethoscope size={16} className="text-brand-red"/>;
      case 'ANNUAL': return <Palmtree size={16} className="text-brand-green"/>;
      case 'COMPASSIONATE': return <Heart size={16} className="text-brand-yellow"/>;
      case 'OFFICIAL': return <Briefcase size={16} className="text-brand-blue"/>;
      default: return <Calendar size={16} className="text-gray-400"/>;
    }
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => {
        const current = prev[studentId] || { status: AttendanceStatus.PRESENT, minutes: 0 };
        return {
            ...prev,
            [studentId]: { 
                status, 
                minutes: status === AttendanceStatus.LATE ? (current.minutes || 15) : 0 
            }
        };
    });
  };

  const updateMinutes = (studentId: string, minutes: number) => {
    setAttendanceState(prev => {
        const current = prev[studentId] || { status: AttendanceStatus.LATE, minutes: 0 };
        return {
            ...prev,
            [studentId]: { ...current, minutes }
        };
    });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitAttendance = async () => {
    setSaving(true);
    try {
        const records: AttendanceRecord[] = students.map(student => {
            const data = attendanceState[student.id] || { status: AttendanceStatus.PRESENT, minutes: 0 };
            return {
                id: Math.random().toString(36),
                studentId: student.id,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: data.status,
                minutesLate: data.status === AttendanceStatus.LATE ? data.minutes : undefined
            };
        });

        await submitAttendance(records);
        showNotification("Attendance submitted successfully!", "success");
        setTimeout(() => setMode('DASHBOARD'), 1500);
    } catch (e) {
        showNotification("Failed to submit attendance.", "error");
    } finally {
        setSaving(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Basic date validation
    if (new Date(leaveStart) > new Date(leaveEnd)) {
        showNotification("End date cannot be before start date.", "error");
        return;
    }

    setSaving(true);
    try {
        const days = differenceInBusinessDays(parseISO(leaveEnd), parseISO(leaveStart)) + 1; // Simplified day calc
        await submitLeaveRequest({
            staffId: user.id,
            staffName: user.name,
            type: leaveType,
            startDate: new Date(leaveStart).toISOString(),
            endDate: new Date(leaveEnd).toISOString(),
            days: days > 0 ? days : 1,
            reason: leaveReason,
            coverTeacherId: leaveCover,
            status: 'PENDING',
            requestDate: new Date().toISOString()
        });
        showNotification("Leave request submitted for approval.", "success");
        setShowLeaveModal(false);
        setLeaveStart(''); setLeaveEnd(''); setLeaveReason(''); setLeaveCover('');
    } catch (e) {
        showNotification("Failed to submit request.", "error");
    } finally {
        setSaving(false);
    }
  };

  const getStatusCount = (status: AttendanceStatus) => {
      return students.filter(s => {
          const sState = attendanceState[s.id] || { status: AttendanceStatus.PRESENT };
          return sState.status === status;
      }).length;
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mathScore, setMathScore] = useState(0);
  const [englishScore, setEnglishScore] = useState(0);
  const [competencyStrand, setCompetencyStrand] = useState('');
  const [competencyRating, setCompetencyRating] = useState('Meeting Expectation');

  const openAssessment = (studentId: string) => {
    setSelectedStudentId(studentId);
    const studentAssessments = assessments.filter(a => a.studentId === studentId);
    const math = studentAssessments.find(a => a.subject === 'Mathematics');
    const english = studentAssessments.find(a => a.subject === 'English');
    setMathScore(math ? math.score : 0);
    setEnglishScore(english ? english.score : 0);
    setShowModal(true);
  };

  const openCompetency = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCompetencyStrand('Numbers & Operations');
    setCompetencyRating('Meeting Expectation');
    setShowModal(true);
  };

  const handleSaveAssessment = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setShowModal(false);
    showNotification("Assessment marks updated!", "success");
  };

  const handleSaveCompetency = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setShowModal(false);
    showNotification("Competency recorded!", "success");
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const btnBase = "rounded-xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-brand-sky/30 disabled:opacity-50 active:scale-[0.98]";
  const cardBase = "bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";
  const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";

  // Balance Ring Component
  const BalanceRing = ({ label, total, used, color }: { label: string, total: number, used: number, color: string }) => {
      const percentage = Math.min(100, Math.round(((total - used) / total) * 100));
      const radius = 28;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return (
          <div className="flex flex-col items-center bg-gray-50 rounded-[12px] p-4 border border-gray-100 relative overflow-hidden">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 z-10">{label}</h4>
              <div className="relative w-20 h-20 flex items-center justify-center z-10">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
                      <circle 
                        cx="40" cy="40" r={radius} 
                        stroke={color} strokeWidth="6" fill="none" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-display font-bold text-gray-800">{total - used}</span>
                      <span className="text-[10px] text-gray-400">Left</span>
                  </div>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-400 z-10">{used} days taken</p>
          </div>
      );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative animate-fade-in pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${notification.type === 'success' ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
           {notification.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
           <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* HEADER & SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-blue">
            {mode === 'DASHBOARD' ? `Welcome, ${user?.name || 'Teacher'}` : mode === 'ATTENDANCE' ? 'Take Attendance' : mode === 'ASSESSMENT' ? 'Record Assessment' : mode === 'LEAVE' ? 'My Leave' : mode === 'TIMETABLE' ? 'My Schedule' : 'Add Competency'}
          </h1>
          <p className="text-gray-500 text-sm">{mode === 'DASHBOARD' ? 'Here is your class overview for today.' : mode === 'LEAVE' ? 'Manage your time off.' : mode === 'TIMETABLE' ? 'View your weekly lessons.' : 'Manage student records efficiently.'}</p>
        </div>
        
        {mode !== 'LEAVE' && mode !== 'TIMETABLE' && (
            <div className="relative group">
            <label className="absolute -top-2 left-3 bg-brand-grey px-1 text-[10px] font-bold text-gray-500 uppercase">Currently Teaching</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 h-12 min-w-[240px] shadow-sm cursor-pointer hover:border-brand-sky/50 transition-colors">
                <span className="flex-1 font-semibold text-gray-700">{selectedClass}</span>
                <ChevronDown size={16} className="text-gray-400" />
            </div>
            </div>
        )}
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 sticky top-0 z-40">
        {mode !== 'DASHBOARD' && (
          <button onClick={() => setMode('DASHBOARD')} className={`w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 ${btnBase}`}>
            <ArrowLeft size={20} />
          </button>
        )}
        
        <button 
          onClick={() => setMode('ATTENDANCE')}
          className={`flex-1 md:flex-none px-6 h-12 flex items-center justify-center gap-2 ${mode === 'ATTENDANCE' ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue' : 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90'} ${btnBase}`}
        >
          <Check size={18} /> Take Attendance
        </button>
        
        <button 
          onClick={() => setMode('ASSESSMENT')}
          className={`flex-1 md:flex-none px-6 h-12 flex items-center justify-center gap-2 ${mode === 'ASSESSMENT' ? 'bg-brand-green/10 text-brand-green border border-brand-green' : 'bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90'} ${btnBase}`}
        >
          <Edit3 size={18} /> Record Assessment
        </button>
        
        <button 
          onClick={() => setMode('COMPETENCY')}
          className={`flex-1 md:flex-none px-6 h-12 flex items-center justify-center gap-2 ${mode === 'COMPETENCY' ? 'bg-brand-sky/10 text-brand-sky border border-brand-sky' : 'bg-brand-sky text-white shadow-lg shadow-brand-sky/20 hover:bg-brand-sky/90'} ${btnBase}`}
        >
          <Award size={18} /> Add Competency
        </button>

        <button 
          onClick={() => setMode('TIMETABLE')}
          className={`flex-1 md:flex-none px-6 h-12 flex items-center justify-center gap-2 ${mode === 'TIMETABLE' ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'} ${btnBase}`}
        >
          <Table size={18} /> My Schedule
        </button>
        
        <button 
          onClick={() => setMode('LEAVE')}
          className={`flex-1 md:flex-none px-6 h-12 flex items-center justify-center gap-2 ${mode === 'LEAVE' ? 'bg-brand-yellow/10 text-brand-yellow-600 border border-brand-yellow' : 'border border-gray-200 text-gray-600 hover:bg-brand-yellow/5'} ${btnBase}`}
        >
          <Briefcase size={18} /> My Leave
        </button>
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {mode === 'DASHBOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          
          {/* COL 1: CLASS STATUS PANEL */}
          <div className="space-y-6">
             {/* Schedule & Duties Widget */}
             <div className={cardBase}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-display font-bold text-lg text-gray-800">Schedule & Duties</h3>
                 <span className="text-xs font-bold bg-brand-grey text-gray-500 px-2 py-1 rounded">{format(today, 'EEE, dd MMM')}</span>
               </div>
               
               <div className="space-y-4">
                  {/* Today */}
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase mb-2">Today</p>
                     <div className="space-y-2">
                        {todaysEvents.length > 0 ? todaysEvents.map(e => (
                           <div key={e.id} className="flex gap-3 p-2 border-l-2 border-brand-blue bg-brand-blue/5 rounded-r-lg">
                              <span className="text-xs font-bold text-gray-600">{format(new Date(e.startDate), 'HH:mm')}</span>
                              <div>
                                 <p className="text-sm font-bold text-gray-800">{e.title}</p>
                                 <p className="text-[10px] text-gray-500 capitalize">{e.type.toLowerCase()}</p>
                              </div>
                           </div>
                        )) : (
                           <div className="text-xs text-gray-400 italic">No specific events scheduled.</div>
                        )}
                        {/* Default Class (Mock) */}
                        <div className="flex gap-3 p-2 border-l-2 border-brand-green bg-brand-green/5 rounded-r-lg">
                           <span className="text-xs font-bold text-gray-600">08:00</span>
                           <div>
                              <p className="text-sm font-bold text-gray-800">Mathematics - Grade 4</p>
                              <p className="text-[10px] text-gray-500">Regular Session</p>
                           </div>
                        </div>
                     </div>
                  </div>

                   {/* Tomorrow */}
                  <div className="pt-2 border-t border-gray-100">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tomorrow</p>
                      <div className="space-y-2">
                        {tomorrowsEvents.length > 0 ? tomorrowsEvents.map(e => (
                           <div key={e.id} className="flex gap-3 p-2 border-l-2 border-gray-300 bg-gray-50 rounded-r-lg">
                              <span className="text-xs font-bold text-gray-600">{format(new Date(e.startDate), 'HH:mm')}</span>
                              <div>
                                 <p className="text-sm font-bold text-gray-800">{e.title}</p>
                              </div>
                           </div>
                        )) : (
                           <div className="text-xs text-gray-400 italic">No specific events scheduled.</div>
                        )}
                     </div>
                  </div>
               </div>
             </div>

             {/* Attendance Widget */}
             <div className={cardBase}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-display font-bold text-lg text-gray-800">Today's Attendance</h3>
                 <button onClick={() => setMode('ATTENDANCE')} className="text-xs font-bold text-brand-sky hover:underline">View Full Register</button>
               </div>
               
               <div className="flex items-end gap-2 mb-4">
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${(presentCount/totalStudents)*100}%` }} className="bg-brand-green h-full"></div>
                      <div style={{ width: `${(lateCount/totalStudents)*100}%` }} className="bg-brand-yellow h-full"></div>
                      <div style={{ width: `${(absentCount/totalStudents)*100}%` }} className="bg-brand-red h-full"></div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="block text-2xl font-display font-bold text-brand-green">{presentCount}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Present</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-display font-bold text-brand-yellow">{lateCount}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Late</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-display font-bold text-brand-red">{absentCount}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Absent</span>
                  </div>
               </div>
             </div>
          </div>

          {/* COL 2: CBC WORKFLOW PANEL */}
          <div className="space-y-6">
             {/* CBC Widget */}
             <div className={cardBase}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg text-gray-800">Competency Recording</h3>
                  <span className="text-xs font-bold bg-brand-grey text-gray-500 px-2 py-1 rounded">Term 3, Week 4</span>
                </div>

                <div className="flex items-center gap-6 mb-6">
                   <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#F3F4F6" strokeWidth="8" fill="none" />
                        <circle cx="48" cy="48" r="40" stroke="#059669" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - cbcProgress/100)} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-brand-blue text-lg">
                        {cbcProgress}%
                      </div>
                   </div>
                   <div>
                      <p className="text-sm text-gray-600 mb-1">Curriculum coverage on track.</p>
                      <p className="text-2xl font-display font-bold text-gray-800">{recentCompetenciesCount} <span className="text-sm font-normal text-gray-400">entries this week</span></p>
                   </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Needs Review / Emerging</h4>
                   {emergingCompetencies.length > 0 ? emergingCompetencies.slice(0, 3).map((comp, idx) => (
                     <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                           {/* Finding student name from ID would require lookup, simplified for mock */}
                           <div className="w-8 h-8 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow font-bold text-xs">?</div>
                           <div>
                             <p className="text-xs font-bold text-gray-700">{comp.subject}</p>
                             <p className="text-[10px] text-gray-500">{comp.strand}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-1 bg-brand-yellow text-brand-blue text-[10px] font-bold rounded-full">Emerging</span>
                           <button onClick={() => setMode('COMPETENCY')} className="w-6 h-6 rounded flex items-center justify-center bg-brand-blue text-white hover:bg-brand-blue/90">
                             <ArrowRight size={12}/>
                           </button>
                        </div>
                     </div>
                   )) : (
                     <p className="text-xs text-gray-400 italic">No emerging competencies flagged.</p>
                   )}
                </div>
             </div>

             {/* Assessment Summary Widget */}
             <div className={cardBase}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-lg text-gray-800">Assessment Status</h3>
                  <button onClick={() => setMode('ASSESSMENT')} className="text-xs font-bold text-brand-sky hover:underline">Grade Submissions</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
                      <p className="text-3xl font-display font-bold text-brand-yellow mb-1">{ungradedCount}</p>
                      <p className="text-xs font-bold text-gray-500 uppercase leading-tight">Outstanding<br/>Assessments</p>
                   </div>
                   <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                      <p className="text-3xl font-display font-bold text-brand-green mb-1">{avgScore}%</p>
                      <p className="text-xs font-bold text-gray-500 uppercase leading-tight">Class<br/>Average</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}

      {/* --- ATTENDANCE VIEW --- */}
      {mode === 'ATTENDANCE' && (
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden animate-slide-up flex flex-col h-[calc(100vh-200px)] relative"> 
          {/* Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
               <h3 className="font-display font-bold text-lg text-brand-blue">{selectedClass}</h3>
               <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                 <Calendar size={12}/> {format(new Date(), 'EEEE, MMMM do')}
               </p>
            </div>
            <div className="text-right">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Students</div>
               <div className="font-sans font-bold text-xl text-gray-800">{students.length}</div>
            </div>
          </div>
          
          {/* High Density Scrollable List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2 space-y-2">
            {students
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(student => {
              const state = attendanceState[student.id] || { status: AttendanceStatus.PRESENT, minutes: 0 };
              
              return (
                <div key={student.id} className="p-3 flex items-center justify-between bg-white border border-gray-100 rounded-[8px] hover:border-brand-sky/30 transition-all">
                  
                  {/* Student Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-grey overflow-hidden border border-gray-200 shrink-0">
                         <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-sans font-semibold text-gray-800 text-sm leading-tight">{student.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{student.admissionNumber}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Late Input (Conditional) */}
                    {state.status === AttendanceStatus.LATE && (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={state.minutes || ''} 
                          onChange={(e) => updateMinutes(student.id, parseInt(e.target.value))}
                          className="w-14 h-8 rounded-md border border-brand-yellow bg-brand-yellow/5 px-2 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-brand-yellow outline-none text-center"
                          autoFocus
                        />
                      </div>
                    )}
                    
                    {/* Segmented Control */}
                    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => setStudentStatus(student.id, AttendanceStatus.PRESENT)}
                            className={`w-10 h-8 rounded-[6px] flex items-center justify-center font-bold text-xs transition-all ${state.status === AttendanceStatus.PRESENT ? 'bg-brand-green text-white shadow-sm ring-2 ring-brand-green/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                            title="Present"
                        >
                            P
                        </button>
                        <button
                            onClick={() => setStudentStatus(student.id, AttendanceStatus.LATE)}
                            className={`w-10 h-8 rounded-[6px] flex items-center justify-center font-bold text-xs transition-all ${state.status === AttendanceStatus.LATE ? 'bg-brand-yellow text-brand-blue shadow-sm ring-2 ring-brand-yellow/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                            title="Late"
                        >
                            L
                        </button>
                        <button
                            onClick={() => setStudentStatus(student.id, AttendanceStatus.ABSENT)}
                            className={`w-10 h-8 rounded-[6px] flex items-center justify-center font-bold text-xs transition-all ${state.status === AttendanceStatus.ABSENT ? 'bg-brand-red text-white shadow-sm ring-2 ring-brand-red/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                            title="Absent"
                        >
                            A
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Footer Action */}
          <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
             <div className="flex justify-between items-center text-xs text-gray-400 font-medium mb-3 px-1">
                <span>Summary:</span>
                <div className="flex gap-3">
                   <span className="text-brand-green"><span className="font-bold">{getStatusCount(AttendanceStatus.PRESENT)}</span> Present</span>
                   <span className="text-brand-yellow"><span className="font-bold">{getStatusCount(AttendanceStatus.LATE)}</span> Late</span>
                   <span className="text-brand-red"><span className="font-bold">{getStatusCount(AttendanceStatus.ABSENT)}</span> Absent</span>
                </div>
             </div>
            <button 
              onClick={handleSubmitAttendance}
              disabled={saving}
              className={`w-full h-12 bg-brand-blue text-white flex items-center justify-center gap-2 ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90`}
            >
              {saving ? <Loader2 className="animate-spin" size={20}/> : <><Check size={20}/> Submit Attendance Register</>}
            </button>
          </div>
        </div>
      )}

      {/* --- TIMETABLE VIEW --- */}
      {mode === 'TIMETABLE' && (
        <TimetableModule mode="TEACHER" currentUser={user} />
      )}

      {/* --- ASSESSMENT & COMPETENCY VIEW (Unified Grid) --- */}
      {(mode === 'ASSESSMENT' || mode === 'COMPETENCY') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-xl text-brand-blue">{mode === 'ASSESSMENT' ? 'Manage Assessments' : 'Student Competencies'}</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(student => {
                 const studentAssessments = assessments.filter(a => a.studentId === student.id);
                 return (
                  <div key={student.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow flex items-center justify-between group bg-white">
                    <div className="flex items-center gap-3">
                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-bold text-gray-700">{student.name}</p>
                          <p className="text-xs text-gray-400">
                            {mode === 'ASSESSMENT' 
                              ? (studentAssessments.length > 0 ? `${studentAssessments.length} subjects graded` : 'No grades yet')
                              : 'Select to add competency'
                            }
                          </p>
                        </div>
                    </div>
                    <button 
                      onClick={() => mode === 'ASSESSMENT' ? openAssessment(student.id) : openCompetency(student.id)}
                      className={`text-xs font-bold px-3 py-2 rounded focus:outline-none focus:ring-2 ${mode === 'ASSESSMENT' ? 'text-brand-sky bg-brand-sky/10 hover:bg-brand-sky/20 focus:ring-brand-sky/50' : 'text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 focus:ring-brand-blue/50'}`}
                    >
                      {mode === 'ASSESSMENT' ? 'Manage Marks' : 'Add Entry'}
                    </button>
                  </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* --- LEAVE MANAGEMENT VIEW --- */}
      {mode === 'LEAVE' && (
        <div className="animate-slide-up space-y-6">
            {/* Balance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BalanceRing label="Annual Leave" total={balances.annual.total} used={balances.annual.used} color="#059669" />
                <BalanceRing label="Sick Leave" total={balances.sick.total} used={balances.sick.used} color="#FCD34D" />
                <BalanceRing label="Compassionate" total={balances.compassionate.total} used={balances.compassionate.used} color="#38BDF8" />
            </div>

            {/* Request Button */}
            <div className="flex justify-end">
                <button 
                    onClick={() => setShowLeaveModal(true)}
                    className={`h-12 px-6 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center gap-2`}
                >
                    <Plus size={20}/> New Request
                </button>
            </div>

            {/* Request History */}
            <div className={cardBase + " p-0 overflow-hidden"}>
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-display font-bold text-lg text-gray-800">My Request History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Request Date</th>
                                <th className="px-6 py-3 text-left">Type</th>
                                <th className="px-6 py-3 text-left">Duration</th>
                                <th className="px-6 py-3 text-left">Dates</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {myLeaveRequests.length > 0 ? myLeaveRequests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600 font-medium">{format(new Date(req.requestDate), 'dd MMM yyyy')}</td>
                                    <td className="px-6 py-4 text-gray-800 font-bold capitalize flex items-center gap-2">
                                        {getLeaveIcon(req.type)}
                                        {req.type.toLowerCase()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{req.days} Days</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {format(new Date(req.startDate), 'dd MMM')} - {format(new Date(req.endDate), 'dd MMM')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            req.status === 'APPROVED' ? 'bg-brand-green/10 text-brand-green' :
                                            req.status === 'REJECTED' ? 'bg-brand-red/10 text-brand-red' :
                                            'bg-brand-yellow/10 text-brand-yellow-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                        {req.rejectionReason && (
                                            <p className="text-[10px] text-brand-red mt-1 max-w-[120px] mx-auto leading-tight">{req.rejectionReason}</p>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">No leave requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
             <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full p-1"><X size={20}/></button>
             
             <h3 className="text-xl font-display font-bold mb-1">{mode === 'ASSESSMENT' ? 'Update Assessment' : 'New Competency'}</h3>
             <p className="text-sm text-gray-500 mb-6">For student <span className="font-bold text-brand-blue">{selectedStudent.name}</span></p>
             
             {mode === 'ASSESSMENT' ? (
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mathematics (Score / 100)</label>
                   <input 
                     type="number" 
                     value={mathScore}
                     onChange={(e) => setMathScore(parseInt(e.target.value) || 0)}
                     className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700"
                     placeholder="0-100" 
                     max={100}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">English (Score / 100)</label>
                   <input 
                     type="number" 
                     value={englishScore}
                     onChange={(e) => setEnglishScore(parseInt(e.target.value) || 0)}
                     className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700"
                     placeholder="0-100" 
                     max={100}
                   />
                 </div>
               </div>
             ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Competency Strand</label>
                    <select 
                      value={competencyStrand}
                      onChange={(e) => setCompetencyStrand(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white"
                    >
                      <option value="Numbers & Operations">Numbers & Operations</option>
                      <option value="Geometry">Geometry</option>
                      <option value="Measurement">Measurement</option>
                      <option value="Data Handling">Data Handling</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Proficiency Level</label>
                    <div className="space-y-2">
                       {['Emerging', 'Developing', 'Meeting Expectation', 'Exceeding'].map(lvl => (
                         <div 
                           key={lvl}
                           onClick={() => setCompetencyRating(lvl)}
                           className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${competencyRating === lvl ? 'bg-brand-blue/5 border-brand-blue ring-1 ring-brand-blue' : 'bg-white border-gray-200 hover:border-brand-sky/50'}`}
                         >
                           <span className={`text-sm font-bold ${competencyRating === lvl ? 'text-brand-blue' : 'text-gray-600'}`}>{lvl}</span>
                           {competencyRating === lvl && <Check size={16} className="text-brand-blue"/>}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
             )}

             <div className="pt-6">
                <button 
                  onClick={mode === 'ASSESSMENT' ? handleSaveAssessment : handleSaveCompetency}
                  disabled={saving}
                  className={`w-full h-12 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2`}
                >
                   {saving ? <Loader2 className="animate-spin" size={20}/> : 'Save Record'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* LEAVE REQUEST MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowLeaveModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Request Leave</h3>
              <p className="text-sm text-gray-500 mb-6">Submit a new leave request for approval.</p>

              <form onSubmit={handleSubmitLeave} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Leave Type</label>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className={inputClass}>
                       <option value="ANNUAL">Annual Leave</option>
                       <option value="MEDICAL">Medical / Sick Leave</option>
                       <option value="COMPASSIONATE">Compassionate Leave</option>
                       <option value="OFFICIAL">Official Duty</option>
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                       <input type="date" required value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
                       <input type="date" required value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className={inputClass} />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                    <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none h-24" placeholder="Please provide details..."></textarea>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cover Teacher (Optional)</label>
                    <select value={leaveCover} onChange={(e) => setLeaveCover(e.target.value)} className={inputClass}>
                       <option value="">-- Select Colleague --</option>
                       {users.filter(u => u.role === 'TEACHER' && u.id !== user?.id).map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                       ))}
                    </select>
                 </div>

                 <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className={`w-full h-12 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2`}
                    >
                       {saving ? <Loader2 className="animate-spin" size={20}/> : 'Submit Request'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
