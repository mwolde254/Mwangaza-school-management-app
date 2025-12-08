
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { TimetableSlot, DayOfWeek, UserProfile } from '../types';
import { Clock, GripVertical, Trash2, AlertTriangle, ChevronRight, ChevronLeft, Plus } from 'lucide-react';

interface TimetableModuleProps {
  mode: 'ADMIN' | 'TEACHER' | 'PARENT';
  currentUser?: UserProfile | null;
  targetClass?: string; // For parents viewing a specific child's class
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { start: '08:00', end: '08:40' },
  { start: '08:40', end: '09:20' },
  { start: '09:20', end: '10:00' },
  { start: '10:00', end: '10:30', isBreak: true }, // Break
  { start: '10:30', end: '11:10' },
  { start: '11:10', end: '11:50' },
  { start: '11:50', end: '12:30' },
  { start: '12:30', end: '14:00', isBreak: true }, // Lunch
  { start: '14:00', end: '14:40' },
  { start: '14:40', end: '15:20' },
];

const SUBJECTS_POOL = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'Art & Craft', 'Music', 'PE'];

const TimetableModule: React.FC<TimetableModuleProps> = ({ mode, currentUser, targetClass }) => {
  const { timetable, addTimetableSlot, deleteTimetableSlot, checkTimetableConflict, users, students } = useStudentData();
  
  // State
  const [selectedClass, setSelectedClass] = useState<string>(targetClass || 'Grade 4');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS[new Date().getDay() - 1] || 'Monday');
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  // Derived Data
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
  const teachers = users.filter(u => u.role === 'TEACHER');

  const filteredSlots = useMemo(() => {
    return timetable.filter(slot => {
        if (mode === 'TEACHER' && currentUser) {
            // Teachers see their own classes OR breaks (which are usually school-wide, but simplistic here)
            return slot.teacherId === currentUser.id || slot.type === 'BREAK';
        }
        // Admin & Parent see specific class
        return slot.classId === selectedClass;
    });
  }, [timetable, selectedClass, mode, currentUser]);

  // Actions
  const handleDragStart = (subject: string) => {
    setDraggedSubject(subject);
    setDragError(null);
  };

  const handleDrop = async (day: DayOfWeek, timeStart: string, timeEnd: string, type: 'LESSON' | 'BREAK') => {
    if (!draggedSubject && type !== 'BREAK') return;
    
    // Admin Logic: Determine Teacher (Mock: Assign random or first teacher for subject)
    // In a real app, you'd select the teacher AFTER dropping or drag a "Teacher Card"
    const assignedTeacher = teachers[0]; // Simplification for MVP
    
    const newSlot: Omit<TimetableSlot, 'id'> = {
        classId: selectedClass,
        day,
        startTime: timeStart,
        endTime: timeEnd,
        subject: draggedSubject || 'BREAK',
        type: type,
        // Only assign teacher if it's a lesson
        ...(type === 'LESSON' && { 
            teacherId: assignedTeacher.id, 
            teacherName: assignedTeacher.name,
            room: `${selectedClass} Room`
        })
    };

    if (type === 'LESSON' && checkTimetableConflict(newSlot)) {
        setDragError(`Conflict: ${assignedTeacher.name} is busy at ${timeStart} on ${day}!`);
        setTimeout(() => setDragError(null), 3000);
        return;
    }

    await addTimetableSlot(newSlot);
    setDraggedSubject(null);
  };

  const isCurrentSlot = (day: DayOfWeek, startTime: string, endTime: string) => {
    const now = new Date();
    const currentDay = DAYS[now.getDay() - 1];
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startVal = sh * 60 + sm;
    const endVal = eh * 60 + em;

    return currentDay === day && currentTimeVal >= startVal && currentTimeVal < endVal;
  };

  // --- SUB-COMPONENTS ---

  const SlotCard = ({ slot, onDelete }: { slot: TimetableSlot, onDelete?: () => void }) => (
    <div className={`
      relative p-2 rounded-lg border text-sm h-full flex flex-col justify-center
      ${slot.type === 'BREAK' 
        ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow-600' 
        : 'bg-white border-gray-200 border-l-4 border-l-brand-blue shadow-sm'
      }
    `}>
        <span className="font-display font-bold text-gray-800">{slot.subject}</span>
        {slot.type === 'LESSON' && (
            <div className="text-[10px] text-gray-500 mt-1">
                {slot.teacherName?.split(' ')[1] || 'Teacher'} | {slot.room}
            </div>
        )}
        {mode === 'ADMIN' && onDelete && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-1 right-1 text-gray-300 hover:text-brand-red"
            >
                <Trash2 size={12}/>
            </button>
        )}
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in">
        {/* Error Overlay */}
        {dragError && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-brand-red text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce">
                <AlertTriangle size={18}/> {dragError}
            </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-display font-bold text-brand-blue">
                    {mode === 'TEACHER' ? 'My Weekly Schedule' : `Timetable: ${selectedClass}`}
                </h2>
                {mode === 'ADMIN' && (
                    <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-sky/50 outline-none"
                    >
                        {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                )}
            </div>
            
            {/* Mobile Day Switcher */}
            <div className="md:hidden flex bg-gray-100 p-1 rounded-lg">
                {DAYS.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`w-10 h-8 text-[10px] font-bold rounded flex items-center justify-center transition-all ${selectedDay === day ? 'bg-white shadow text-brand-blue' : 'text-gray-400'}`}
                    >
                        {day.substring(0, 3)}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full">
            
            {/* ADMIN SIDEBAR (Builder Tools) */}
            {mode === 'ADMIN' && (
                <div className="w-full lg:w-48 flex-shrink-0 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Subjects</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                            {SUBJECTS_POOL.map(subj => (
                                <div 
                                    key={subj}
                                    draggable
                                    onDragStart={() => handleDragStart(subj)}
                                    className="p-3 bg-brand-grey border border-gray-200 rounded-lg text-sm font-bold text-gray-700 cursor-grab active:cursor-grabbing hover:border-brand-sky hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <GripVertical size={14} className="text-gray-400"/> {subj}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-brand-yellow/10 p-4 rounded-xl border border-brand-yellow/20">
                        <div 
                            draggable
                            onDragStart={() => handleDragStart('BREAK')}
                            className="p-3 bg-white border border-brand-yellow/50 rounded-lg text-sm font-bold text-brand-yellow-600 cursor-grab flex items-center justify-center"
                        >
                            Break / Lunch
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN GRID AREA */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Desktop Grid Header */}
                <div className="hidden md:grid grid-cols-6 border-b border-gray-100 bg-gray-50">
                    <div className="p-4 text-xs font-bold text-gray-400 uppercase text-center border-r border-gray-100">Time</div>
                    {DAYS.map(day => (
                        <div key={day} className="p-4 text-xs font-bold text-gray-600 uppercase text-center border-r border-gray-100 last:border-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {TIME_SLOTS.map((time, idx) => (
                        <div key={idx} className="flex flex-col md:grid md:grid-cols-6 border-b border-gray-50 min-h-[80px]">
                            
                            {/* Time Column */}
                            <div className="hidden md:flex items-center justify-center p-2 text-xs font-bold text-gray-400 border-r border-gray-100 bg-gray-50/30">
                                {time.start} <br/> {time.end}
                            </div>

                            {/* Days Columns */}
                            {DAYS.map(day => {
                                // Filter Logic for Mobile: Only show selected day
                                // Logic for Desktop: Show all
                                const isMobileVisible = day === selectedDay;
                                const existingSlot = filteredSlots.find(s => s.day === day && s.startTime === time.start);
                                const isNow = isCurrentSlot(day, time.start, time.end);

                                return (
                                    <div 
                                        key={day} 
                                        className={`
                                            ${isMobileVisible ? 'flex' : 'hidden'} md:flex 
                                            relative p-2 border-r border-gray-50 last:border-0 transition-colors
                                            ${isNow ? 'bg-brand-sky/5' : ''}
                                            ${mode === 'ADMIN' ? 'hover:bg-gray-50' : ''}
                                        `}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(day, time.start, time.end, time.isBreak ? 'BREAK' : 'LESSON')}
                                    >   
                                        {/* Mobile Time Label */}
                                        <div className="md:hidden w-16 text-xs font-bold text-gray-400 flex flex-col justify-center mr-4 border-r border-gray-100 pr-2">
                                            <span>{time.start}</span>
                                            <span className="font-normal opacity-50">{time.end}</span>
                                        </div>

                                        {/* Slot Content */}
                                        <div className="flex-1 min-h-[60px]">
                                            {existingSlot ? (
                                                <SlotCard slot={existingSlot} onDelete={() => deleteTimetableSlot(existingSlot.id)} />
                                            ) : (
                                                mode === 'ADMIN' && (
                                                    <div className="h-full w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-300 opacity-0 hover:opacity-100">
                                                        <Plus size={16}/>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TimetableModule;
