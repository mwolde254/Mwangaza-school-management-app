import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, AttendanceStatus } from '../types';
import { 
  ArrowLeft, Edit3, Download, Award, Calendar, Wallet, 
  Phone, Mail, MapPin, Check, AlertCircle, Clock, 
  BookOpen, Star, FileText, Plus, User, Loader2, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
}

type ProfileTab = 'ACADEMICS' | 'ATTENDANCE' | 'FINANCE' | 'CONTACT';

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, onBack }) => {
  const { students, transactions, attendance, competencies, assessments, studentNotes, addStudentNote, addTransaction } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('ACADEMICS');
  
  // Modals & Feedback
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  
  // Form States
  const [newNote, setNewNote] = useState('');
  const [manualPayAmount, setManualPayAmount] = useState('');
  const [manualPayMethod, setManualPayMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const student = students.find(s => s.id === studentId);
  
  // --- ROLE BASED ACCESS LOGIC ---
  const role = user?.role || UserRole.PARENT;
  const canEdit = [UserRole.ADMIN, UserRole.PRINCIPAL].includes(role);
  const canWriteAcademics = [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER].includes(role);
  const canViewFinance = [UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.PARENT].includes(role);
  
  // Data Filtering
  const studentTransactions = transactions.filter(t => t.studentId === studentId);
  const studentAttendance = attendance.filter(a => a.studentId === studentId);
  const studentCompetencies = competencies.filter(c => c.studentId === studentId);
  const studentAssessments = assessments.filter(a => a.studentId === studentId);
  const studentBehaviorNotes = studentNotes.filter(n => n.studentId === studentId);

  // Stats Calculations
  const presentDays = studentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const totalDays = Math.max(studentAttendance.length, 1);
  const attendancePercentage = Math.round((presentDays / totalDays) * 100);

  // Competency Progress
  const emergingCount = studentCompetencies.filter(c => c.rating === 'Emerging').length;
  const developingCount = studentCompetencies.filter(c => c.rating === 'Developing').length;
  const meetingCount = studentCompetencies.filter(c => c.rating === 'Meeting Expectation').length;
  const exceedingCount = studentCompetencies.filter(c => c.rating === 'Exceeding').length;

  const competencyData = [
    { name: 'Exceeding', value: exceedingCount, color: '#059669' },
    { name: 'Meeting', value: meetingCount, color: '#38BDF8' },
    { name: 'Developing', value: developingCount, color: '#FCD34D' },
    { name: 'Emerging', value: emergingCount, color: '#F3F4F6' }, // Grey for emerging to look like 'empty' space or low tier
  ];

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddNote = async () => {
     if(!newNote.trim()) return;
     await addStudentNote({
        studentId,
        authorName: user?.name || 'Staff',
        date: new Date().toISOString().split('T')[0],
        type: 'BEHAVIOR',
        content: newNote,
        severity: 'LOW'
     });
     setNewNote('');
     setShowNoteModal(false);
     showToast("Note added successfully.");
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!manualPayAmount) return;
    setIsProcessing(true);
    await addTransaction({
        studentId,
        studentName: student?.name || 'Unknown',
        amount: parseInt(manualPayAmount),
        type: 'TUITION',
        date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        method: manualPayMethod as any
    });
    setIsProcessing(false);
    setShowManualPayModal(false);
    setManualPayAmount('');
    showToast("Payment recorded successfully.");
  };

  const handleDownloadReport = () => {
    showToast("Generating PDF Report... Download will start shortly.", "info");
  };

  const handleEditProfile = () => {
    // In a real app this would submit updates
    setShowEditProfileModal(false);
    showToast("Profile updated successfully.");
  };

  if (!student) return <div className="p-8">Student not found</div>;

  const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100";
  const btnBase = "rounded-[12px] font-bold transition-all focus:outline-none focus:ring-4 disabled:opacity-50 active:scale-[0.98]";
  const modalInputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 relative">
      
      {toast && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${toast.type === 'success' ? 'bg-brand-green text-white' : 'bg-brand-blue text-white'}`}>
           <Check size={20}/> <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* 1. HEADER CARD (Pinned) */}
      <div className={`${cardBase} p-6 relative overflow-hidden`}>
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
         
         <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-blue mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to List
         </button>

         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
               <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-brand-grey">
                  <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover"/>
               </div>
               <div>
                  <h1 className="text-3xl font-sans font-semibold text-brand-blue">{student.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                     <span className="bg-brand-grey px-2 py-0.5 rounded text-gray-600 border border-gray-200">{student.admissionNumber}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1"><BookOpen size={14}/> {student.grade}</span>
                  </div>
               </div>
            </div>

            <div className="flex gap-3">
               {canEdit && (
                  <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className={`px-4 py-2 border border-brand-blue text-brand-blue hover:bg-brand-blue/5 ${btnBase} flex items-center gap-2 text-sm`}
                  >
                     <Edit3 size={16}/> Edit Profile
                  </button>
               )}
               {canWriteAcademics && (
                  <button 
                    onClick={() => showToast("Please use the Teacher Portal to add competency records.", "info")}
                    className={`px-4 py-2 bg-brand-green text-white shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 ${btnBase} flex items-center gap-2 text-sm`}
                  >
                     <Award size={16}/> Record Competency
                  </button>
               )}
               <button 
                 onClick={handleDownloadReport}
                 className={`p-2 border border-gray-200 text-gray-500 hover:bg-gray-50 ${btnBase}`} 
                 title="Download Report Card"
               >
                  <Download size={20}/>
               </button>
            </div>
         </div>

         {/* 2. NAVIGATION TABS */}
         <div className="flex gap-8 mt-10 border-b border-gray-100">
            <TabButton label="Academic Performance" isActive={activeTab === 'ACADEMICS'} onClick={() => setActiveTab('ACADEMICS')} />
            <TabButton label="Attendance & Conduct" isActive={activeTab === 'ATTENDANCE'} onClick={() => setActiveTab('ATTENDANCE')} />
            {canViewFinance && <TabButton label="Finance & Fees" isActive={activeTab === 'FINANCE'} onClick={() => setActiveTab('FINANCE')} />}
            <TabButton label="Contact Info" isActive={activeTab === 'CONTACT'} onClick={() => setActiveTab('CONTACT')} />
         </div>
      </div>

      {/* 3. TAB CONTENT */}
      
      {/* --- A. ACADEMICS --- */}
      {activeTab === 'ACADEMICS' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Competency Meter */}
            <div className={`${cardBase} p-6 lg:col-span-1`}>
               <h3 className="font-display font-bold text-lg text-gray-800 mb-6">CBC Competency Meter</h3>
               <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={competencyData}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {competencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-display font-bold text-gray-800">{exceedingCount + meetingCount}</span>
                     <span className="text-[10px] uppercase font-bold text-gray-400">Mastered</span>
                  </div>
               </div>
               <div className="mt-6 space-y-3">
                  {competencyData.map(d => (
                     <div key={d.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                           <span className="font-medium text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-bold text-gray-800">{d.value}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Assessment History */}
            <div className={`${cardBase} p-6 lg:col-span-2`}>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg text-gray-800">Recent Assessments</h3>
                  {canWriteAcademics && (
                     <button 
                        onClick={() => showToast("Please use the Teacher Portal to add grades.", "info")}
                        className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                     >
                        <Plus size={14}/> Add Grade
                     </button>
                  )}
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                     <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                        <tr>
                           <th className="px-4 py-3 text-left rounded-l-lg">Subject</th>
                           <th className="px-4 py-3 text-center">Score</th>
                           <th className="px-4 py-3 text-left">Comments</th>
                           <th className="px-4 py-3 text-center rounded-r-lg">Grade</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {studentAssessments.map(a => (
                           <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 font-bold text-gray-700">{a.subject}</td>
                              <td className="px-4 py-4 text-center">
                                 <span className="font-mono font-bold text-brand-blue">{a.score}/{a.total}</span>
                              </td>
                              <td className="px-4 py-4 text-gray-500 truncate max-w-xs">{a.comments}</td>
                              <td className="px-4 py-4 text-center">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    a.score >= 80 ? 'bg-brand-green/10 text-brand-green' : 
                                    a.score >= 60 ? 'bg-brand-sky/10 text-brand-sky' : 
                                    'bg-brand-yellow/10 text-brand-yellow'
                                 }`}>
                                    {a.score >= 80 ? 'EE' : a.score >= 60 ? 'ME' : 'DE'}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {studentAssessments.length === 0 && <p className="text-center py-8 text-gray-400 italic">No assessments recorded.</p>}
               </div>
            </div>
         </div>
      )}

      {/* --- B. ATTENDANCE & CONDUCT --- */}
      {activeTab === 'ATTENDANCE' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Attendance Summary */}
            <div className={`${cardBase} p-6 lg:col-span-1`}>
               <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Attendance Overview</h3>
               <div className="flex items-center justify-center mb-8">
                  <div className="relative w-40 h-40">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="#F3F4F6" strokeWidth="12" fill="none" />
                        <circle cx="80" cy="80" r="70" stroke="#059669" strokeWidth="12" fill="none" strokeDasharray="439.8" strokeDashoffset={439.8 * (1 - attendancePercentage/100)} strokeLinecap="round" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-display font-bold text-brand-blue">{attendancePercentage}%</span>
                        <span className="text-xs font-bold text-gray-400 uppercase">Present</span>
                     </div>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-brand-green/5 rounded-lg border border-brand-green/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-green text-white rounded-md"><Check size={14}/></div>
                        <span className="font-bold text-gray-700 text-sm">Present Days</span>
                     </div>
                     <span className="font-bold text-xl text-brand-green">{presentDays}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-brand-red/5 rounded-lg border border-brand-red/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-red text-white rounded-md"><AlertCircle size={14}/></div>
                        <span className="font-bold text-gray-700 text-sm">Absent Days</span>
                     </div>
                     <span className="font-bold text-xl text-brand-red">{totalDays - presentDays}</span>
                  </div>
               </div>
            </div>

            {/* Conduct Notes */}
            <div className={`${cardBase} p-6 lg:col-span-2 flex flex-col`}>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg text-gray-800">Behavior & Conduct Notes</h3>
                  {canWriteAcademics && (
                     <button 
                        onClick={() => setShowNoteModal(true)}
                        className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                     >
                        <Plus size={14}/> Add Note
                     </button>
                  )}
               </div>

               <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  {studentBehaviorNotes.length > 0 ? studentBehaviorNotes.map(note => (
                     <div key={note.id} className="p-4 bg-gray-50 rounded-[12px] border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                 note.type === 'BEHAVIOR' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-200 text-gray-600'
                              }`}>
                                 {note.type}
                              </span>
                              <span className="text-xs font-bold text-gray-700">{note.authorName}</span>
                           </div>
                           <span className="text-xs text-gray-400">{note.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{note.content}</p>
                     </div>
                  )) : (
                     <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <Star size={32} className="mb-2 opacity-20"/>
                        <p className="italic">No behavior notes recorded.</p>
                     </div>
                  )}
               </div>
               
               {/* Quick Add Modal Overlay */}
               {showNoteModal && (
                  <div className="mt-4 p-4 bg-white border border-brand-blue rounded-[12px] shadow-lg animate-fade-in">
                     <h4 className="text-sm font-bold text-brand-blue mb-2">New Behavior Note</h4>
                     <textarea 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full h-24 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-sky/20 outline-none mb-3"
                        placeholder="Describe the incident or observation..."
                     />
                     <div className="flex justify-end gap-2">
                        <button onClick={() => setShowNoteModal(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleAddNote} className="px-3 py-1.5 text-xs font-bold bg-brand-blue text-white rounded shadow hover:bg-brand-blue/90">Save Note</button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* --- C. FINANCE --- */}
      {activeTab === 'FINANCE' && canViewFinance && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Balance Card */}
            <div className={`${cardBase} p-8 lg:col-span-3 bg-gradient-to-r from-white to-gray-50`}>
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Wallet size={20}/>
                        <span className="text-xs font-bold uppercase tracking-wider">Current Balance</span>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-gray-400 text-2xl font-sans">KES</span>
                        <span className={`text-5xl font-display font-extrabold tracking-tight ${student.balance > 0 ? 'text-gray-800' : 'text-brand-green'}`}>
                           {student.balance.toLocaleString()}
                        </span>
                     </div>
                     {student.balance > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold mt-4">
                           <AlertCircle size={12}/> Outstanding Balance
                        </div>
                     )}
                  </div>

                  <div className="flex gap-4">
                     {role === UserRole.PARENT && student.balance > 0 && (
                        <button className={`px-8 h-14 bg-brand-blue text-white shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 ${btnBase} flex items-center gap-2 text-lg`}>
                           Settle Now via MPesa
                        </button>
                     )}
                     {canEdit && (
                        <button 
                           onClick={() => setShowManualPayModal(true)}
                           className={`px-6 h-14 border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5 ${btnBase} flex items-center gap-2 font-bold`}
                        >
                           Record Manual Payment
                        </button>
                     )}
                  </div>
               </div>
            </div>

            {/* Transaction History */}
            <div className={`${cardBase} p-6 lg:col-span-3`}>
               <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Transaction History</h3>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                     <thead className="text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                        <tr>
                           <th className="px-4 py-3 text-left">Date</th>
                           <th className="px-4 py-3 text-left">Description</th>
                           <th className="px-4 py-3 text-center">Method</th>
                           <th className="px-4 py-3 text-right">Amount</th>
                           <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {studentTransactions.map(t => (
                           <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 text-gray-500">{t.date}</td>
                              <td className="px-4 py-4 font-bold text-gray-700">{t.type} Payment</td>
                              <td className="px-4 py-4 text-center">
                                 <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">{t.method}</span>
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-bold text-brand-green">
                                 +{t.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <span className="text-brand-green font-bold text-xs flex items-center justify-center gap-1">
                                    <Check size={12}/> PAID
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {studentTransactions.length === 0 && <p className="text-center py-8 text-gray-400 italic">No transactions found.</p>}
               </div>
            </div>
         </div>
      )}

      {/* --- D. CONTACT INFO --- */}
      {activeTab === 'CONTACT' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            <div className={`${cardBase} p-6`}>
               <h3 className="font-display font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                  <User size={20} className="text-brand-blue"/> Primary Guardian
               </h3>
               <div className="space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                     <p className="text-lg font-bold text-gray-800">{student.parentName}</p>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                           <Phone size={16} className="text-brand-green"/>
                           {student.contactPhone || 'Not recorded'}
                        </div>
                     </div>
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                           <Mail size={16} className="text-brand-sky"/>
                           {student.contactEmail || 'Not recorded'}
                        </div>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Residential Address</label>
                     <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <MapPin size={16} className="text-brand-red"/>
                        P.O. Box 1234, Nairobi
                     </div>
                  </div>
               </div>
            </div>

            <div className={`${cardBase} p-6 bg-brand-red/5 border-brand-red/10`}>
               <h3 className="font-display font-bold text-lg text-brand-red mb-6 flex items-center gap-2">
                  <AlertCircle size={20}/> Emergency Contact
               </h3>
               <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-brand-red/10">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-1">Contact 1</p>
                     <p className="font-bold text-gray-800">Uncle: James Kamau</p>
                     <p className="font-mono text-sm text-gray-600 mt-1">0722 000 000</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-brand-red/10">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-1">Doctor</p>
                     <p className="font-bold text-gray-800">Dr. Amina</p>
                     <p className="font-mono text-sm text-gray-600 mt-1">Gertrudes Hospital (020 720 000)</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Edit Profile Modal */}
      {showEditProfileModal && (
         <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
               <button onClick={() => setShowEditProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
               <h3 className="text-xl font-display font-bold mb-4 text-brand-blue">Edit Student Profile</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                     <input type="text" defaultValue={student.name} className={modalInputClass} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Grade</label>
                     <select defaultValue={student.grade} className={modalInputClass}>
                        <option>Grade 1</option>
                        <option>Grade 2</option>
                        <option>Grade 3</option>
                        <option>Grade 4</option>
                        <option>Grade 5</option>
                     </select>
                  </div>
                  <div className="pt-4">
                     <button onClick={handleEditProfile} className="w-full h-12 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-blue/90">Save Changes</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 2. Manual Payment Modal */}
      {showManualPayModal && (
         <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
               <button onClick={() => setShowManualPayModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
               <h3 className="text-xl font-display font-bold mb-4 text-brand-blue">Record Manual Payment</h3>
               <form onSubmit={handleManualPayment} className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount (KES)</label>
                     <input 
                        type="number" 
                        value={manualPayAmount} 
                        onChange={(e) => setManualPayAmount(e.target.value)} 
                        className={modalInputClass} 
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Method</label>
                     <select 
                        value={manualPayMethod} 
                        onChange={(e) => setManualPayMethod(e.target.value)} 
                        className={modalInputClass}
                     >
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                     </select>
                  </div>
                  <div className="pt-4">
                     <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="w-full h-12 bg-brand-blue text-white rounded-lg font-bold hover:bg-brand-blue/90 flex items-center justify-center gap-2"
                     >
                        {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Record Transaction'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
   <button 
      onClick={onClick}
      className={`pb-4 px-2 font-bold text-sm transition-all relative ${isActive ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
   >
      {label}
      <span className={`absolute bottom-0 left-0 w-full h-1 bg-brand-blue rounded-t-full transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></span>
   </button>
);

export default StudentProfileView;