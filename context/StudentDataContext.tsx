
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Student, AttendanceRecord, FinanceTransaction, LeaveRequest, Competency, Assessment, StudentNote, UserProfile, SchoolEvent, EventConsent, TimetableSlot, SupportTicket, AdmissionApplication, AdmissionStage } from '../types';
import { db, AppNotification } from '../services/db';

interface DataContextType {
  students: Student[];
  transactions: FinanceTransaction[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  competencies: Competency[];
  assessments: Assessment[];
  notifications: AppNotification[];
  studentNotes: StudentNote[];
  users: UserProfile[];
  events: SchoolEvent[];
  consents: EventConsent[];
  timetable: TimetableSlot[];
  supportTickets: SupportTicket[];
  applications: AdmissionApplication[];
  loading: boolean;
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  addTransaction: (tx: Omit<FinanceTransaction, 'id'>) => Promise<void>;
  updateLeaveRequest: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  submitAttendance: (records: AttendanceRecord[]) => Promise<void>;
  addAssessment: (assessment: Omit<Assessment, 'id'>) => Promise<void>;
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>;
  addStudentNote: (note: Omit<StudentNote, 'id'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  addEvent: (event: Omit<SchoolEvent, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  submitConsent: (consent: Omit<EventConsent, 'id'>) => Promise<void>;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id'>) => Promise<void>;
  resolveLeaveRequest: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string, addToCalendar?: boolean) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  checkTimetableConflict: (slot: Omit<TimetableSlot, 'id'>) => boolean;
  addSupportTicket: (ticket: Omit<SupportTicket, 'id'>) => Promise<void>;
  resolveSupportTicket: (id: string, response: string, responderName: string) => Promise<void>;
  submitApplication: (app: Omit<AdmissionApplication, 'id'>) => Promise<void>;
  updateApplicationStage: (id: string, stage: AdmissionStage) => Promise<void>;
  enrollApplicant: (applicationId: string) => Promise<void>;
  refresh: () => void;
}

const StudentDataContext = createContext<DataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [consents, setConsents] = useState<EventConsent[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await db.collection('students').get() as Student[];
      const t = await db.collection('finance').get() as FinanceTransaction[];
      const l = await db.collection('leave_requests').get() as LeaveRequest[];
      const a = await db.collection('attendance').get() as AttendanceRecord[];
      const c = await db.collection('competencies').get() as Competency[];
      const as = await db.collection('assessments').get() as Assessment[];
      const n = await db.collection('notifications').get() as AppNotification[];
      const sn = await db.collection('student_notes').get() as StudentNote[];
      const u = await db.collection('users').get() as UserProfile[];
      const e = await db.collection('events').get() as SchoolEvent[];
      const co = await db.collection('consents').get() as EventConsent[];
      const tt = await db.collection('timetable').get() as TimetableSlot[];
      const st = await db.collection('support_tickets').get() as SupportTicket[];
      const app = await db.collection('admissions_applications').get() as AdmissionApplication[];
      
      setStudents(s);
      setTransactions(t);
      setLeaveRequests(l);
      setAttendance(a);
      setCompetencies(c);
      setAssessments(as);
      setNotifications(n);
      setStudentNotes(sn);
      setUsers(u);
      setEvents(e);
      setConsents(co);
      setTimetable(tt);
      setSupportTickets(st);
      setApplications(app);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeStudents = db.onSnapshot('students', (data) => setStudents(data));
    const unsubscribeFinance = db.onSnapshot('finance', (data) => setTransactions(data));
    const unsubscribeLeave = db.onSnapshot('leave_requests', (data) => setLeaveRequests(data));
    const unsubscribeAssessments = db.onSnapshot('assessments', (data) => setAssessments(data));
    const unsubscribeNotifications = db.onSnapshot('notifications', (data) => setNotifications(data));
    const unsubscribeNotes = db.onSnapshot('student_notes', (data) => setStudentNotes(data));
    const unsubscribeUsers = db.onSnapshot('users', (data) => setUsers(data));
    const unsubscribeEvents = db.onSnapshot('events', (data) => setEvents(data));
    const unsubscribeConsents = db.onSnapshot('consents', (data) => setConsents(data));
    const unsubscribeTimetable = db.onSnapshot('timetable', (data) => setTimetable(data));
    const unsubscribeTickets = db.onSnapshot('support_tickets', (data) => setSupportTickets(data));
    const unsubscribeApplications = db.onSnapshot('admissions_applications', (data) => setApplications(data));
    
    return () => {
      unsubscribeStudents();
      unsubscribeFinance();
      unsubscribeLeave();
      unsubscribeAssessments();
      unsubscribeNotifications();
      unsubscribeNotes();
      unsubscribeUsers();
      unsubscribeEvents();
      unsubscribeConsents();
      unsubscribeTimetable();
      unsubscribeTickets();
      unsubscribeApplications();
    };
  }, []);

  const addStudent = async (student: Omit<Student, 'id'>) => {
    await db.collection('students').add(student);
  };

  const addTransaction = async (tx: Omit<FinanceTransaction, 'id'>) => {
    await db.collection('finance').add(tx);
    const student = students.find(s => s.id === tx.studentId);
    if (student) {
      const newBalance = student.balance - tx.amount;
      await db.collection('students').update(student.id, { balance: newBalance });
    }
  };

  const updateLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    // Deprecated in favor of resolveLeaveRequest, kept for compatibility if needed
    await db.collection('leave_requests').update(id, { status });
  };

  const submitAttendance = async (records: AttendanceRecord[]) => {
    await db.collection('attendance').batchSet(records);
  };

  const addAssessment = async (assessment: Omit<Assessment, 'id'>) => {
    await db.collection('assessments').add(assessment);
  };

  const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
    await db.collection('assessments').update(id, updates);
  }

  const addStudentNote = async (note: Omit<StudentNote, 'id'>) => {
    await db.collection('student_notes').add(note);
  }

  const markNotificationRead = async (id: string) => {
    await db.collection('notifications').update(id, { read: true });
  }

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    await db.collection('users').update(id, updates);
  }

  const addEvent = async (event: Omit<SchoolEvent, 'id'>) => {
    await db.collection('events').add(event);
  }
  
  const deleteEvent = async (id: string) => {
    await db.collection('events').delete(id);
  }

  const submitConsent = async (consent: Omit<EventConsent, 'id'>) => {
    await db.collection('consents').add(consent);
  }

  const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await db.collection('leave_requests').add(request);
  };

  const resolveLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string, addToCalendar?: boolean) => {
    const request = leaveRequests.find(r => r.id === id);
    if (!request) return;

    // 1. Update Leave Status
    await db.collection('leave_requests').update(id, { status, rejectionReason: reason });

    // 2. Notify User
    await db.collection('notifications').add({
      userId: request.staffId,
      title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: status === 'APPROVED' 
        ? `Your leave request for ${request.days} days has been approved.` 
        : `Your leave request was rejected. Reason: ${reason}`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
      read: false,
      date: new Date().toISOString()
    });

    // 3. Logic for Approval
    if (status === 'APPROVED') {
        if (addToCalendar) {
            await addEvent({
                title: `${request.staffName} - Leave`,
                startDate: request.startDate,
                endDate: request.endDate,
                type: 'STAFF',
                audience: 'STAFF',
                description: `Staff on leave: ${request.reason}`,
                requiresConsent: false,
                requiresPayment: false
            });
        }
    }
  };

  const checkTimetableConflict = (slot: Omit<TimetableSlot, 'id'>): boolean => {
    if (slot.type === 'BREAK') return false;
    return timetable.some(t => 
      t.day === slot.day &&
      t.startTime === slot.startTime &&
      t.teacherId === slot.teacherId &&
      t.classId !== slot.classId // Conflict if same teacher is in a DIFFERENT class at same time
    );
  };

  const addTimetableSlot = async (slot: Omit<TimetableSlot, 'id'>) => {
    // Basic overwrite logic: Remove existing slot at that time/day/class first
    const existing = timetable.find(t => 
        t.classId === slot.classId && 
        t.day === slot.day && 
        t.startTime === slot.startTime
    );
    if (existing) {
        await db.collection('timetable').delete(existing.id);
    }
    await db.collection('timetable').add(slot);
  };

  const deleteTimetableSlot = async (id: string) => {
    await db.collection('timetable').delete(id);
  };

  const addSupportTicket = async (ticket: Omit<SupportTicket, 'id'>) => {
    await db.collection('support_tickets').add(ticket);
  };

  const resolveSupportTicket = async (id: string, response: string, responderName: string) => {
    const ticket = supportTickets.find(t => t.id === id);
    if(!ticket) return;

    await db.collection('support_tickets').update(id, {
        status: 'RESOLVED',
        adminResponse: response,
        resolvedAt: new Date().toISOString(),
        resolvedBy: responderName
    });

    // Notify Parent
    await db.collection('notifications').add({
        userId: ticket.parentId,
        title: `Help Desk Reply: ${ticket.subject}`,
        message: `Your query regarding "${ticket.subject}" has been answered.`,
        type: 'INFO',
        read: false,
        date: new Date().toISOString()
    });
  };

  // --- ADMISSIONS LOGIC ---

  const submitApplication = async (app: Omit<AdmissionApplication, 'id'>) => {
    await db.collection('admissions_applications').add(app);
  };

  const updateApplicationStage = async (id: string, stage: AdmissionStage) => {
    await db.collection('admissions_applications').update(id, { stage });
  };

  const enrollApplicant = async (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    // 1. Create Student
    const newStudent: Omit<Student, 'id'> = {
        name: app.childName,
        grade: app.targetGrade,
        admissionNumber: `ADM-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
        parentName: app.parentName,
        contactPhone: app.parentPhone,
        contactEmail: app.parentEmail,
        balance: 30000, // Initial Tuition
        avatarUrl: `https://ui-avatars.com/api/?name=${app.childName}&background=random`
    };
    await addStudent(newStudent);

    // 2. Update Status to Enrolled
    await updateApplicationStage(applicationId, 'ENROLLED');

    // 3. (Optional) Create Parent Account if doesn't exist - mocked here
    await db.collection('notifications').add({
        userId: 'all',
        title: 'New Student Enrolled',
        message: `${app.childName} has been enrolled in ${app.targetGrade}.`,
        type: 'SUCCESS',
        read: false,
        date: new Date().toISOString()
    });
  };

  return (
    <StudentDataContext.Provider value={{ 
      students, 
      transactions, 
      leaveRequests, 
      attendance, 
      competencies,
      assessments,
      notifications,
      studentNotes,
      users,
      events,
      consents,
      timetable,
      supportTickets,
      applications,
      loading, 
      addStudent, 
      addTransaction, 
      updateLeaveRequest,
      submitAttendance,
      addAssessment,
      updateAssessment,
      addStudentNote,
      markNotificationRead,
      updateUser,
      addEvent,
      deleteEvent,
      submitConsent,
      submitLeaveRequest,
      resolveLeaveRequest,
      addTimetableSlot,
      deleteTimetableSlot,
      checkTimetableConflict,
      addSupportTicket,
      resolveSupportTicket,
      submitApplication,
      updateApplicationStage,
      enrollApplicant,
      refresh: fetchData
    }}>
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};
