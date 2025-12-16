
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../../context/StudentDataContext';
import { ArrowLeft, Users, BookOpen, Plus, DollarSign, UploadCloud, Check, Book, GraduationCap, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import TimetableModule from '../TimetableModule';

const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";
const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";

const AdminAcademics = () => {
  const { students, streams, syllabus, feeStructures, events, addStream, updateSyllabusStatus, staffRecords } = useStudentData();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [academicTab, setAcademicTab] = useState<'TIMETABLE' | 'FEES' | 'SYLLABUS' | 'EVENTS' | 'STUDENTS'>('TIMETABLE');
  
  // Grade Memos
  const gradeStudents = useMemo(() => students.filter(s => s.grade === selectedGrade), [students, selectedGrade]);
  const gradeStreams = useMemo(() => streams.filter(s => s.grade === selectedGrade), [streams, selectedGrade]);
  const gradeSyllabus = useMemo(() => syllabus.filter(s => s.grade === selectedGrade), [syllabus, selectedGrade]);
  const gradeFeeStructure = useMemo(() => feeStructures.find(fs => fs.grade === selectedGrade), [feeStructures, selectedGrade]);
  const gradeEvents = useMemo(() => events.filter(e => e.targetGrade === selectedGrade || e.audience === 'WHOLE_SCHOOL'), [events, selectedGrade]);

  return (
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
                                <button className="p-1.5 bg-gray-100 hover:bg-brand-blue hover:text-white rounded transition-colors">
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
                                    <button className="text-xs font-bold bg-brand-blue text-white px-3 py-1.5 rounded hover:bg-brand-blue/90">
                                        Add Event
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {gradeEvents.map(ev => (
                                        <div key={ev.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                                                const stream = gradeStreams.find(st => st.name === s.stream);
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
  );
};

export default AdminAcademics;
