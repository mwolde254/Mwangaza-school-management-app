import React, { useState } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, AttendanceStatus, Student } from '../types';
import { Search, Filter, Plus, User, ArrowRight, BookOpen, AlertCircle, CheckCircle2, Wallet, Calendar, CreditCard, ChevronRight, X, Loader2, Check } from 'lucide-react';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

interface StudentListViewProps {
  onSelectStudent: (studentId: string) => void;
}

const StudentListView: React.FC<StudentListViewProps> = ({ onSelectStudent }) => {
  const { students, attendance, addStudent } = useStudentData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState<Student | null>(null);

  // Add Student State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    grade: '',
    admissionNumber: '',
    parentName: '',
    contactPhone: '',
    contactEmail: ''
  });

  // Role-based filtering
  const visibleStudents = students.filter(student => {
    // Parent restriction
    if (user?.role === UserRole.PARENT) {
      return user.linkedStudentIds?.includes(student.id);
    }
    // Admin/Principal/Teacher see all
    return true;
  });

  // Search and Grade filtering
  const filteredStudents = visibleStudents.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || student.grade === gradeFilter;
    
    return matchesSearch && matchesGrade;
  });

  const uniqueGrades = Array.from(new Set(visibleStudents.map(s => s.grade))).sort();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.PRINCIPAL;
  const isParent = user?.role === UserRole.PARENT;

  // Helper for attendance stats
  const getAttendanceStats = (studentId: string) => {
    const records = attendance.filter(a => a.studentId === studentId);
    if (!records.length) return { rate: 100, present: 0, total: 0 };
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const rate = Math.round((present / records.length) * 100);
    return { rate, present, total: records.length };
  };

  const handlePayClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Prevent card click
    setSelectedPaymentStudent(student);
    setShowPaymentModal(true);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addStudent({
        ...newStudent,
        balance: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${newStudent.name}&background=random`
      });
      setShowAddStudentModal(false);
      setNewStudent({ name: '', grade: '', admissionNumber: '', parentName: '', contactPhone: '', contactEmail: '' });
    } catch (error) {
      console.error("Failed to add student");
    } finally {
      setIsAdding(false);
    }
  };

  const inputClass = "h-12 px-4 rounded-[12px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white";
  const modalInputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700";

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12 relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-blue">
            {isParent ? 'My Children' : 'Student Directory'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isParent 
              ? 'Overview of your children\'s performance and status.' 
              : 'Manage student records, academics, and finances.'}
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setShowAddStudentModal(true)}
            className="h-12 px-6 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Add Student</span>
          </button>
        )}
      </div>

      {/* Filters (Hidden for Parents if they only have a few kids) */}
      {(!isParent || visibleStudents.length > 5) && (
        <div className="bg-white p-4 rounded-[12px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or admission number..." 
              className={`${inputClass} w-full pl-12`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={gradeFilter} 
              onChange={(e) => setGradeFilter(e.target.value)}
              className={`${inputClass} w-full pl-12 appearance-none`}
            >
              <option value="ALL">All Grades</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Student Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredStudents.map(student => {
            const stats = getAttendanceStats(student.id);
            
            // --- PARENT CARD DESIGN ---
            if (isParent) {
              return (
                <div 
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-brand-sky/30 transition-all cursor-pointer flex flex-col"
                >
                  <div className="p-6 pb-4 flex items-center gap-4 border-b border-gray-50">
                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden bg-brand-grey shrink-0">
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-brand-blue group-hover:text-brand-sky transition-colors">{student.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{student.grade}</span>
                        <span className="text-xs text-gray-400 font-mono">{student.admissionNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4 bg-white">
                    {/* Fees Stats */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Wallet size={12}/> Fees Due
                      </p>
                      <p className={`text-xl font-bold font-display ${student.balance > 0 ? 'text-brand-yellow' : 'text-brand-green'}`}>
                        <span className="text-sm font-sans text-gray-400 font-normal mr-1">KES</span>
                        {student.balance.toLocaleString()}
                      </p>
                    </div>

                    {/* Attendance Stats */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12}/> Attendance
                      </p>
                      <p className={`text-xl font-bold font-display ${stats.rate >= 90 ? 'text-brand-green' : stats.rate >= 75 ? 'text-brand-yellow' : 'text-brand-red'}`}>
                        {stats.rate}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    {student.balance > 0 ? (
                      <>
                        <button 
                          onClick={(e) => handlePayClick(e, student)}
                          className="flex-1 h-10 bg-brand-blue text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-blue/10 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard size={16}/> Pay Fees
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:text-brand-blue hover:bg-white hover:border-brand-blue/30 transition-all">
                          <ChevronRight size={20}/>
                        </button>
                      </>
                    ) : (
                      <button className="flex-1 h-10 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:text-brand-blue hover:border-brand-blue/30 transition-all flex items-center justify-center gap-2 group-hover:bg-brand-blue/5">
                        View Profile <ArrowRight size={16}/>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // --- ADMIN / TEACHER CARD DESIGN ---
            return (
              <div 
                key={student.id} 
                onClick={() => onSelectStudent(student.id)}
                className="group bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-sky/30 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Hover Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full bg-brand-grey border-2 border-white shadow-sm overflow-hidden">
                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    student.balance > 0 
                      ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20' 
                      : 'bg-brand-green/10 text-brand-green border-brand-green/20'
                  }`}>
                    {student.balance > 0 ? 'Balance Due' : 'Cleared'}
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-lg text-gray-800 group-hover:text-brand-blue transition-colors mb-1">{student.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mb-3">{student.admissionNumber}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                     <BookOpen size={14} className="text-brand-sky" />
                     <span>{student.grade}</span>
                  </div>
                  {!isParent && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <User size={14} className="text-gray-400" />
                       <span className="truncate">{student.parentName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">View Profile</span>
                   <div className="w-8 h-8 rounded-full bg-brand-grey flex items-center justify-center text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[12px] border border-gray-100">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-300" />
           </div>
           <h3 className="font-display font-bold text-gray-800 text-lg">No students found</h3>
           <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Payment Modal for Quick Pay Action */}
      {showPaymentModal && selectedPaymentStudent && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          student={selectedPaymentStudent}
          paymentContext={{
            type: 'TUITION',
            title: 'School Fees Payment',
            amount: selectedPaymentStudent.balance
          }}
          userPhone={user?.phoneNumber}
          onSuccess={() => {
             // Just close, context updates automatically
          }}
        />
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowAddStudentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
              
              <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Register New Student</h3>
              <p className="text-sm text-gray-500 mb-6">Create a new student profile in the system.</p>

              <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                       <input 
                          type="text" 
                          required 
                          value={newStudent.name} 
                          onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} 
                          className={modalInputClass}
                          placeholder="e.g. Amani Mwangi"
                        />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Admission Number</label>
                       <input 
                          type="text" 
                          required 
                          value={newStudent.admissionNumber} 
                          onChange={(e) => setNewStudent({...newStudent, admissionNumber: e.target.value})} 
                          className={modalInputClass}
                          placeholder="ADM-XXXX"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Grade Level</label>
                    <select 
                       value={newStudent.grade} 
                       onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})} 
                       className={modalInputClass}
                       required
                    >
                       <option value="">Select Grade</option>
                       <option value="Grade 1">Grade 1</option>
                       <option value="Grade 2">Grade 2</option>
                       <option value="Grade 3">Grade 3</option>
                       <option value="Grade 4">Grade 4</option>
                       <option value="Grade 5">Grade 5</option>
                       <option value="Grade 6">Grade 6</option>
                    </select>
                 </div>

                 <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-800 mb-3">Guardian Information</h4>
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Parent/Guardian Name</label>
                          <input 
                             type="text" 
                             required 
                             value={newStudent.parentName} 
                             onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})} 
                             className={modalInputClass}
                           />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                             <input 
                                type="tel" 
                                required 
                                value={newStudent.contactPhone} 
                                onChange={(e) => setNewStudent({...newStudent, contactPhone: e.target.value})} 
                                className={modalInputClass}
                                placeholder="07XX XXX XXX"
                              />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                             <input 
                                type="email" 
                                value={newStudent.contactEmail} 
                                onChange={(e) => setNewStudent({...newStudent, contactEmail: e.target.value})} 
                                className={modalInputClass}
                                placeholder="parent@email.com"
                              />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6">
                    <button 
                      type="submit" 
                      disabled={isAdding}
                      className="w-full h-12 bg-brand-blue text-white rounded-[12px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2"
                    >
                       {isAdding ? <Loader2 className="animate-spin" size={20}/> : 'Create Student Profile'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default StudentListView;