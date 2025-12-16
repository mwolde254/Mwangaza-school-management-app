
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Student, AttendanceRecord, FinanceTransaction, LeaveRequest, Competency, Assessment, StudentNote, UserProfile, UserRole, SchoolEvent, EventConsent, TimetableSlot, SupportTicket, AdmissionApplication, AdmissionStage, SmsTemplate, TransportRoute, TransportVehicle, TransportLog, StaffRecord, SystemConfig, SystemHealth, FeeStructure, ClassStream, SyllabusTopic, TicketMessage } from '../types';
import { db, AppNotification, OfflineDB, SyncItem } from '../services/db';

interface RegisterStudentPayload {
    name: string;
    dob: string;
    gender: 'Male' | 'Female';
    admissionNumber: string;
    grade: string;
    stream: string;
    enrollmentDate: string;
}

interface RegisterGuardianPayload {
    mode: 'EXISTING' | 'NEW';
    existingParentId?: string;
    newParentDetails?: {
        name: string;
        email: string;
        phone: string;
    }
}

interface DataContextType {
  // Data
  students: Student[];
  transactions: FinanceTransaction[];
  feeStructures: FeeStructure[];
  streams: ClassStream[];
  syllabus: SyllabusTopic[];
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
  smsTemplates: SmsTemplate[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  transportLogs: TransportLog[];
  staffRecords: StaffRecord[];
  systemConfig: SystemConfig | null;
  systemHealth: SystemHealth | null;
  
  // Status
  loading: boolean;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  pendingChanges: number;

  // Actions
  addStudent: (student: Omit<Student, 'id'>) => Promise<string>;
  registerStudent: (studentDetails: RegisterStudentPayload, guardianDetails: RegisterGuardianPayload | null) => Promise<void>;
  bulkCreateStudents: (students: Omit<Student, 'id'>[]) => Promise<void>;
  addTransaction: (tx: Omit<FinanceTransaction, 'id'>) => Promise<void>;
  addFeeStructure: (structure: Omit<FeeStructure, 'id'>) => Promise<void>;
  addStream: (stream: Omit<ClassStream, 'id'>) => Promise<void>;
  addSyllabusTopic: (topic: Omit<SyllabusTopic, 'id'>) => Promise<void>;
  updateSyllabusStatus: (id: string, status: SyllabusTopic['status']) => Promise<void>;
  updateLeaveRequest: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  submitAttendance: (records: AttendanceRecord[]) => Promise<void>;
  addAssessment: (assessment: Omit<Assessment, 'id'>) => Promise<void>;
  batchAddAssessments: (assessments: Omit<Assessment, 'id'>[]) => Promise<void>;
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>;
  addStudentNote: (note: Omit<StudentNote, 'id'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  addEvent: (event: Omit<SchoolEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<SchoolEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  submitConsent: (consent: Omit<EventConsent, 'id'>) => Promise<void>;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id'>) => Promise<void>;
  resolveLeaveRequest: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string, addToCalendar?: boolean) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  checkTimetableConflict: (slot: Omit<TimetableSlot, 'id'>) => boolean;
  addSupportTicket: (ticket: Omit<SupportTicket, 'id'>) => Promise<void>;
  replyToTicket: (ticketId: string, message: Omit<TicketMessage, 'id' | 'timestamp'>) => Promise<void>;
  updateTicket: (ticketId: string, updates: Partial<SupportTicket>) => Promise<void>;
  resolveSupportTicket: (id: string, response: string, responderName: string) => Promise<void>; // Legacy wrapper
  submitApplication: (app: Omit<AdmissionApplication, 'id'>) => Promise<void>;
  updateApplicationStage: (id: string, stage: AdmissionStage) => Promise<void>;
  enrollApplicant: (applicationId: string) => Promise<void>;
  addSmsTemplate: (template: Omit<SmsTemplate, 'id'>) => Promise<void>;
  updateSmsTemplate: (id: string, updates: Partial<SmsTemplate>) => Promise<void>;
  deleteSmsTemplate: (id: string) => Promise<void>;
  addTransportRoute: (route: Omit<TransportRoute, 'id'>) => Promise<void>;
  addStaffRecord: (staff: Omit<StaffRecord, 'id'>) => Promise<void>;
  updateStaffRecord: (id: string, updates: Partial<StaffRecord>) => Promise<void>;
  refresh: () => void;
}

const StudentDataContext = createContext<DataContextType | undefined>(undefined);

// --- MOCK DATA FOR NEW ACADEMICS FEATURES ---
const MOCK_STREAMS: ClassStream[] = [
    { id: 'strm1', grade: 'Grade 4', name: 'East', color: '#38BDF8', classTeacherId: 'u2', classTeacherName: 'Tr. Sarah Johnson' },
    { id: 'strm2', grade: 'Grade 4', name: 'West', color: '#FCD34D', classTeacherId: 'u4', classTeacherName: 'Mr. John Maina' },
    { id: 'strm3', grade: 'Grade 5', name: 'North', color: '#059669', classTeacherId: 'u2', classTeacherName: 'Tr. Sarah Johnson' },
];

const MOCK_SYLLABUS: SyllabusTopic[] = [
    { id: 'syl1', grade: 'Grade 4', subject: 'Mathematics', term: 'Term 3', title: 'Fractions & Decimals', status: 'COMPLETED', description: 'Introduction to proper and improper fractions.' },
    { id: 'syl2', grade: 'Grade 4', subject: 'Mathematics', term: 'Term 3', title: 'Measurement: Area', status: 'IN_PROGRESS', description: 'Calculating area of rectangles and squares.' },
    { id: 'syl3', grade: 'Grade 4', subject: 'English', term: 'Term 3', title: 'Grammar: Adverbs', status: 'PENDING', description: 'Identifying and using adverbs correctly.' },
    { id: 'syl4', grade: 'Grade 4', subject: 'Science', term: 'Term 3', title: 'Plants: Photosynthesis', status: 'COMPLETED', description: 'Basic process of food making in plants.' },
];

// Replaces the basic mock tickets from db.ts with advanced ones
const ADVANCED_MOCK_TICKETS: SupportTicket[] = [
  { 
    id: 'tk1', 
    source: 'PARENT',
    requestorId: 'u3', 
    requestorName: 'David Kamau', 
    requestorRole: UserRole.PARENT,
    studentId: 'st1', 
    studentName: 'Zuri Kamau', 
    category: 'FEES', 
    subject: 'Clarification on Trip Cost', 
    status: 'RESOLVED',
    priority: 'NORMAL', 
    createdAt: '2023-10-20T10:00:00Z', 
    updatedAt: '2023-10-20T14:00:00Z',
    messages: [
        { id: 'm1', senderId: 'u3', senderName: 'David Kamau', role: 'PARENT', message: 'Hi, does the science trip cost cover lunch as well?', timestamp: '2023-10-20T10:00:00Z' },
        { id: 'm2', senderId: 'u1', senderName: 'Bursar', role: 'ADMIN', message: 'Yes, Mr. Kamau. Lunch and transport are included.', timestamp: '2023-10-20T14:00:00Z' }
    ]
  },
  { 
    id: 'tk2', 
    source: 'PARENT',
    requestorId: 'u3', 
    requestorName: 'David Kamau', 
    requestorRole: UserRole.PARENT,
    studentId: 'st1', 
    studentName: 'Zuri Kamau',
    category: 'ACADEMIC', 
    subject: 'Report Card access', 
    status: 'OPEN', 
    priority: 'HIGH',
    createdAt: '2023-10-25T08:30:00Z',
    updatedAt: '2023-10-25T08:30:00Z',
    messages: [
        { id: 'm3', senderId: 'u3', senderName: 'David Kamau', role: 'PARENT', message: 'I cannot download the Term 2 report card. It gives a 404 error.', timestamp: '2023-10-25T08:30:00Z' }
    ]
  },
  {
    id: 'tk3',
    source: 'STAFF',
    requestorId: 'u2',
    requestorName: 'Tr. Sarah Johnson',
    requestorRole: UserRole.TEACHER,
    category: 'IT_SUPPORT',
    subject: 'Projector in Grade 4 East',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    location: 'Grade 4 East Classroom',
    assignedToId: 'u5',
    assignedToName: 'System Admin',
    createdAt: '2023-10-24T09:00:00Z',
    updatedAt: '2023-10-24T11:00:00Z',
    messages: [
        { id: 'm4', senderId: 'u2', senderName: 'Sarah Johnson', role: 'TEACHER', message: 'The projector bulb seems to be flickering and dim.', timestamp: '2023-10-24T09:00:00Z' },
        { id: 'm5', senderId: 'u5', senderName: 'System Admin', role: 'ADMIN', message: 'Noted. I have ordered a replacement bulb.', timestamp: '2023-10-24T11:00:00Z' }
    ]
  }
];

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [streams, setStreams] = useState<ClassStream[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusTopic[]>([]);
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
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>([]);
  const [transportLogs, setTransportLogs] = useState<TransportLog[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  
  // Status
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<number>(0);

  // --- CONNECTIVITY & SYNC LOGIC ---

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check for pending items
    setPendingChanges(OfflineDB.getQueue().length);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Sync Interval
  useEffect(() => {
    let syncInterval: any;
    
    const syncData = async () => {
      if (!isOnline || isSyncing) return;
      
      const queue = OfflineDB.getQueue();
      if (queue.length === 0) {
        setPendingChanges(0);
        return;
      }

      setIsSyncing(true);
      setPendingChanges(queue.length);

      // Process one by one to ensure order
      for (const item of queue) {
        try {
          if (item.type === 'CREATE') {
            const { id, ...cleanPayload } = item.payload; 
            await db.collection(item.collection).add(cleanPayload);
          } else if (item.type === 'UPDATE' && item.docId) {
            await db.collection(item.collection).update(item.docId, item.payload);
          } else if (item.type === 'DELETE' && item.docId) {
            await db.collection(item.collection).delete(item.docId);
          }
          
          OfflineDB.removeFromQueue(item.id);
        } catch (error) {
          console.error("Sync failed for item", item, error);
          break; 
        }
      }
      
      setPendingChanges(OfflineDB.getQueue().length);
      setIsSyncing(false);
    };

    if (isOnline) {
      syncData(); // Trigger immediately on online
      syncInterval = setInterval(syncData, 10000); // And periodically
    }

    return () => clearInterval(syncInterval);
  }, [isOnline, isSyncing]);

  // Helper to handle offline/online writes
  const performWrite = async (collection: string, type: 'CREATE' | 'UPDATE' | 'DELETE', payload: any, docId?: string) => {
    if (!isOnline) {
      const offlineItem = OfflineDB.addToQueue({
        collection,
        type,
        payload: { ...payload, id: docId || `temp_${Date.now()}` }, 
        docId
      });
      setPendingChanges(prev => prev + 1);
      return offlineItem; 
    } else {
      if (type === 'CREATE') return await db.collection(collection).add(payload);
      if (type === 'UPDATE' && docId) return await db.collection(collection).update(docId, payload);
      if (type === 'DELETE' && docId) return await db.collection(collection).delete(docId);
    }
  };

  const fetchData = async () => {
     // Config Fetch
     const sysData = await db.collection('config').getConfig() as any;
     if (sysData) {
       setSystemConfig(sysData.config);
       setSystemHealth(sysData.health);
     }
     setLoading(false);
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubscribes = [
      db.onSnapshot('students', setStudents),
      db.onSnapshot('finance', setTransactions),
      db.onSnapshot('leave_requests', setLeaveRequests),
      db.onSnapshot('assessments', setAssessments),
      db.onSnapshot('notifications', setNotifications),
      db.onSnapshot('student_notes', setStudentNotes),
      db.onSnapshot('users', setUsers),
      db.onSnapshot('events', setEvents),
      db.onSnapshot('consents', setConsents),
      db.onSnapshot('timetable', setTimetable),
      db.onSnapshot('support_tickets', (data) => {
          // If fresh DB, inject advanced mock data
          if (data.length === 0 || (data.length > 0 && !data[0].messages)) {
              setSupportTickets(ADVANCED_MOCK_TICKETS);
          } else {
              setSupportTickets(data);
          }
      }),
      db.onSnapshot('admissions_applications', setApplications),
      db.onSnapshot('communication_templates', setSmsTemplates),
      db.onSnapshot('transport_routes', setTransportRoutes),
      db.onSnapshot('transport_vehicles', setTransportVehicles),
      db.onSnapshot('transport_logs', setTransportLogs),
      db.onSnapshot('staff', setStaffRecords),
      db.onSnapshot('attendance', setAttendance),
      db.onSnapshot('competencies', setCompetencies),
      db.onSnapshot('fee_structures', setFeeStructures),
      db.onSnapshot('streams', setStreams),
      db.onSnapshot('syllabus', setSyllabus)
    ];
    
    // Transport Sim
    const simInterval = setInterval(() => {
        setTransportVehicles(prev => prev.map(v => {
            const newX = Math.max(10, Math.min(90, v.currentLocation.x + (Math.random() - 0.5) * 5));
            const newY = Math.max(10, Math.min(90, v.currentLocation.y + (Math.random() - 0.5) * 5));
            return { ...v, currentLocation: { x: newX, y: newY }, speed: Math.max(0, Math.min(80, v.speed + (Math.random() - 0.5) * 10)) };
        }));
    }, 5000);

    fetchData();

    return () => {
      unsubscribes.forEach(u => u());
      clearInterval(simInterval);
    };
  }, []);

  // --- ACTIONS (Wrapped with performWrite) ---

  const addStudent = async (student: Omit<Student, 'id'>) => {
    const result = await performWrite('students', 'CREATE', student);
    return result?.id || 'temp_id'; // Return ID for linking
  };

  const registerStudent = async (studentDetails: RegisterStudentPayload, guardianDetails: RegisterGuardianPayload | null) => {
    // 1. Create Student Object
    const studentData: Omit<Student, 'id'> = {
        name: studentDetails.name,
        dob: studentDetails.dob,
        gender: studentDetails.gender,
        admissionNumber: studentDetails.admissionNumber,
        grade: studentDetails.grade,
        stream: studentDetails.stream,
        enrollmentDate: studentDetails.enrollmentDate,
        balance: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${studentDetails.name}&background=random`,
        parentName: guardianDetails?.mode === 'EXISTING' 
            ? users.find(u => u.id === guardianDetails.existingParentId)?.name || 'Unknown'
            : guardianDetails?.newParentDetails?.name || 'Unlinked',
        contactEmail: guardianDetails?.newParentDetails?.email,
        contactPhone: guardianDetails?.newParentDetails?.phone
    };

    const newStudent = await performWrite('students', 'CREATE', studentData);
    const newStudentId = newStudent?.id || 'temp_id';

    // 2. Handle Guardian Linking
    if (guardianDetails) {
        if (guardianDetails.mode === 'EXISTING' && guardianDetails.existingParentId) {
            const parent = users.find(u => u.id === guardianDetails.existingParentId);
            if (parent) {
                const updatedChildren = [...(parent.linkedStudentIds || []), newStudentId];
                await performWrite('users', 'UPDATE', { linkedStudentIds: updatedChildren }, parent.id);
            }
        } else if (guardianDetails.mode === 'NEW' && guardianDetails.newParentDetails) {
            await performWrite('users', 'CREATE', {
                name: guardianDetails.newParentDetails.name,
                email: guardianDetails.newParentDetails.email,
                role: UserRole.PARENT,
                status: 'ACTIVE',
                phoneNumber: guardianDetails.newParentDetails.phone,
                linkedStudentIds: [newStudentId],
                avatarUrl: `https://ui-avatars.com/api/?name=${guardianDetails.newParentDetails.name}&background=random`
            });
            // Trigger invite notification logic here
        }
    }
  };

  const bulkCreateStudents = async (studentsList: Omit<Student, 'id'>[]) => {
      // In a real app, use batch writes
      for (const student of studentsList) {
          await performWrite('students', 'CREATE', student);
      }
  };

  const addTransaction = async (tx: Omit<FinanceTransaction, 'id'>) => {
    await performWrite('finance', 'CREATE', tx);
    const student = students.find(s => s.id === tx.studentId);
    if (student) {
      // Assuming payment reduces balance
      await performWrite('students', 'UPDATE', { balance: student.balance - tx.amount }, student.id);
    }
  };

  const addFeeStructure = async (structure: Omit<FeeStructure, 'id'>) => {
      await performWrite('fee_structures', 'CREATE', structure);
  };

  const addStream = async (stream: Omit<ClassStream, 'id'>) => {
      await performWrite('streams', 'CREATE', stream);
  };

  const addSyllabusTopic = async (topic: Omit<SyllabusTopic, 'id'>) => {
      await performWrite('syllabus', 'CREATE', topic);
  };

  const updateSyllabusStatus = async (id: string, status: SyllabusTopic['status']) => {
      await performWrite('syllabus', 'UPDATE', { status }, id);
  };

  const updateLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await performWrite('leave_requests', 'UPDATE', { status }, id);
  };

  const submitAttendance = async (records: AttendanceRecord[]) => {
    // PERFORMANCE FIX: Use Promise.all for parallel execution instead of sequential for loop
    const writes = records.map(record => performWrite('attendance', 'CREATE', record));
    await Promise.all(writes);
  };

  const addAssessment = async (assessment: Omit<Assessment, 'id'>) => {
    await performWrite('assessments', 'CREATE', assessment);
  };

  const batchAddAssessments = async (assessments: Omit<Assessment, 'id'>[]) => {
    // Optimized batch add
    const writes = assessments.map(assessment => performWrite('assessments', 'CREATE', assessment));
    await Promise.all(writes);
  };

  const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
    await performWrite('assessments', 'UPDATE', updates, id);
  }

  const addStudentNote = async (note: Omit<StudentNote, 'id'>) => {
    await performWrite('student_notes', 'CREATE', note);
  }

  const markNotificationRead = async (id: string) => {
    await performWrite('notifications', 'UPDATE', { read: true }, id);
  }

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    await performWrite('users', 'UPDATE', updates, id);
  }

  const addEvent = async (event: Omit<SchoolEvent, 'id'>) => {
    await performWrite('events', 'CREATE', event);
  }

  const updateEvent = async (id: string, updates: Partial<SchoolEvent>) => {
    await performWrite('events', 'UPDATE', updates, id);
  }
  
  const deleteEvent = async (id: string) => {
    await performWrite('events', 'DELETE', {}, id);
  }

  const submitConsent = async (consent: Omit<EventConsent, 'id'>) => {
    await performWrite('consents', 'CREATE', consent);
  }

  const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await performWrite('leave_requests', 'CREATE', request);
  };

  const resolveLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string, addToCalendar?: boolean) => {
    await performWrite('leave_requests', 'UPDATE', { status, rejectionReason: reason }, id);
    const request = leaveRequests.find(r => r.id === id);
    if (request) {
        await performWrite('notifications', 'CREATE', {
            userId: request.staffId,
            title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: status === 'APPROVED' ? `Your leave request has been approved.` : `Your leave request was rejected.`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
            read: false,
            date: new Date().toISOString()
        });

        if (status === 'APPROVED' && addToCalendar) {
            await performWrite('events', 'CREATE', {
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
      t.classId !== slot.classId
    );
  };

  const addTimetableSlot = async (slot: Omit<TimetableSlot, 'id'>) => {
    const existing = timetable.find(t => t.classId === slot.classId && t.day === slot.day && t.startTime === slot.startTime);
    if (existing) {
        await performWrite('timetable', 'DELETE', {}, existing.id);
    }
    await performWrite('timetable', 'CREATE', slot);
  };

  const deleteTimetableSlot = async (id: string) => {
    await performWrite('timetable', 'DELETE', {}, id);
  };

  const addSupportTicket = async (ticket: Omit<SupportTicket, 'id'>) => {
    // Ensure we start with messages array if passed as single message object from legacy inputs
    // This wrapper ensures backward compatibility but the implementation uses new structure
    await performWrite('support_tickets', 'CREATE', ticket);
  };

  const replyToTicket = async (ticketId: string, message: Omit<TicketMessage, 'id' | 'timestamp'>) => {
      const ticket = supportTickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const newMessage: TicketMessage = {
          id: `msg_${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...message
      };

      await performWrite('support_tickets', 'UPDATE', {
          messages: [...ticket.messages, newMessage],
          updatedAt: new Date().toISOString()
      }, ticketId);
  };

  const updateTicket = async (ticketId: string, updates: Partial<SupportTicket>) => {
      await performWrite('support_tickets', 'UPDATE', { ...updates, updatedAt: new Date().toISOString() }, ticketId);
  }

  // Legacy wrapper for older components
  const resolveSupportTicket = async (id: string, response: string, responderName: string) => {
    const ticket = supportTickets.find(t => t.id === id);
    if (!ticket) return;
    
    // Add response message and update status
    await replyToTicket(id, {
        senderId: 'admin',
        senderName: responderName,
        role: 'ADMIN',
        message: response
    });
    
    await updateTicket(id, { status: 'RESOLVED' });
  };

  const submitApplication = async (app: Omit<AdmissionApplication, 'id'>) => {
    await performWrite('admissions_applications', 'CREATE', app);
  };

  const updateApplicationStage = async (id: string, stage: AdmissionStage) => {
    await performWrite('admissions_applications', 'UPDATE', { stage }, id);
  };

  // --- ENHANCED ENROLLMENT LOGIC ---
  const enrollApplicant = async (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    // 1. Create Student
    const newStudent = await db.collection('students').add({
        name: app.childName,
        grade: app.targetGrade,
        admissionNumber: `MW-${new Date().getFullYear()}-${Math.floor(Math.random()*1000 + 100)}`,
        parentName: app.parentName,
        contactPhone: app.parentPhone,
        contactEmail: app.parentEmail,
        balance: 30000,
        avatarUrl: `https://ui-avatars.com/api/?name=${app.childName}&background=random`
    });

    const newStudentId = newStudent.id;

    // 2. Link or Create Parent
    const existingParent = users.find(u => u.email.toLowerCase() === app.parentEmail.toLowerCase());
    
    if (existingParent) {
       // Link to existing
       const currentLinked = existingParent.linkedStudentIds || [];
       if (!currentLinked.includes(newStudentId)) {
          await updateUser(existingParent.id, { 
             linkedStudentIds: [...currentLinked, newStudentId] 
          });
          // Notify
          await performWrite('notifications', 'CREATE', {
             userId: existingParent.id,
             title: 'New Student Linked',
             message: `${app.childName} has been enrolled and linked to your account.`,
             type: 'SUCCESS',
             read: false,
             date: new Date().toISOString()
          });
       }
    } else {
       // Create new parent user
       await performWrite('users', 'CREATE', {
          name: app.parentName,
          email: app.parentEmail,
          role: UserRole.PARENT,
          status: 'ACTIVE',
          phoneNumber: app.parentPhone,
          linkedStudentIds: [newStudentId],
          avatarUrl: `https://ui-avatars.com/api/?name=${app.parentName}&background=random`
       });
       // In a real app, trigger welcome email here
    }

    // 3. Update Application Status
    await updateApplicationStage(applicationId, 'ENROLLED');
  };

  const addSmsTemplate = async (template: Omit<SmsTemplate, 'id'>) => {
    await performWrite('communication_templates', 'CREATE', template);
  };

  const updateSmsTemplate = async (id: string, updates: Partial<SmsTemplate>) => {
    await performWrite('communication_templates', 'UPDATE', updates, id);
  };

  const deleteSmsTemplate = async (id: string) => {
    await performWrite('communication_templates', 'DELETE', {}, id);
  };

  const addTransportRoute = async (route: Omit<TransportRoute, 'id'>) => {
    await performWrite('transport_routes', 'CREATE', route);
  };

  const addStaffRecord = async (staff: Omit<StaffRecord, 'id'>) => {
    await performWrite('staff', 'CREATE', staff);
  };

  const updateStaffRecord = async (id: string, updates: Partial<StaffRecord>) => {
    await performWrite('staff', 'UPDATE', updates, id);
  };

  const connectionState = isSyncing ? 'SYNCING' : (isOnline ? 'ONLINE' : 'OFFLINE');

  return (
    <StudentDataContext.Provider value={{ 
      students, transactions, feeStructures, streams, syllabus, leaveRequests, attendance, competencies, assessments, notifications, studentNotes, users, events, consents, timetable, supportTickets, applications, smsTemplates, transportRoutes, transportVehicles, transportLogs, staffRecords, systemConfig, systemHealth,
      loading, 
      connectionStatus: connectionState,
      pendingChanges,
      addStudent, registerStudent, bulkCreateStudents, addTransaction, addFeeStructure, addStream, addSyllabusTopic, updateSyllabusStatus, updateLeaveRequest, submitAttendance, addAssessment, batchAddAssessments, updateAssessment, addStudentNote, markNotificationRead, updateUser, addEvent, updateEvent, deleteEvent, submitConsent, submitLeaveRequest, resolveLeaveRequest, addTimetableSlot, deleteTimetableSlot, checkTimetableConflict, addSupportTicket, replyToTicket, updateTicket, resolveSupportTicket, submitApplication, updateApplicationStage, enrollApplicant, addSmsTemplate, updateSmsTemplate, deleteSmsTemplate, addTransportRoute, addStaffRecord, updateStaffRecord,
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
