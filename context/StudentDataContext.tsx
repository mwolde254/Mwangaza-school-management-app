
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Student, AttendanceRecord, FinanceTransaction, LeaveRequest, Competency, Assessment, StudentNote, UserProfile, SchoolEvent, EventConsent, TimetableSlot, SupportTicket, AdmissionApplication, AdmissionStage, SmsTemplate, TransportRoute, TransportVehicle, TransportLog, StaffRecord, SystemConfig, SystemHealth, PointLog } from '../types';
import { db, AppNotification, OfflineDB, SyncItem } from '../services/db';

interface DataContextType {
  // Data
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
  smsTemplates: SmsTemplate[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  transportLogs: TransportLog[];
  staffRecords: StaffRecord[];
  pointsLogs: PointLog[];
  systemConfig: SystemConfig | null;
  systemHealth: SystemHealth | null;
  
  // Status
  loading: boolean;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  pendingChanges: number;

  // Actions
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
  addSmsTemplate: (template: Omit<SmsTemplate, 'id'>) => Promise<void>;
  updateSmsTemplate: (id: string, updates: Partial<SmsTemplate>) => Promise<void>;
  deleteSmsTemplate: (id: string) => Promise<void>;
  addTransportRoute: (route: Omit<TransportRoute, 'id'>) => Promise<void>;
  addStaffRecord: (staff: Omit<StaffRecord, 'id'>) => Promise<void>;
  updateStaffRecord: (id: string, updates: Partial<StaffRecord>) => Promise<void>;
  awardPoints: (targetId: string, role: 'STUDENT' | 'TEACHER', points: number, reason: string, awardedBy: string) => Promise<void>;
  refresh: () => void;
}

const StudentDataContext = createContext<DataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
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
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>([]);
  const [transportLogs, setTransportLogs] = useState<TransportLog[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [pointsLogs, setPointsLogs] = useState<PointLog[]>([]);
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
            // Remove the temp ID from the payload so DB assigns a real one (or DB uses provided ID if we want consistency)
            // Here, our db.add assigns a new ID, but we want to map it? 
            // Simplified: Just add it.
            // Remove temp ID if it was added for local key
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
          // Stop syncing on error to prevent data corruption order
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
      // 1. Save to Offline Queue
      const offlineItem = OfflineDB.addToQueue({
        collection,
        type,
        payload: { ...payload, id: docId || `temp_${Date.now()}` }, // Ensure temp ID for local create
        docId
      });
      setPendingChanges(prev => prev + 1);
      
      // 2. Optimistic UI Update happens automatically via db.onSnapshot because we modified services/db.ts getCollection 
      // to merge the Offline Queue! So no manual state update needed here.
      // However, we trigger a refresh of the snapshot listeners essentially by waiting for the polling in db.ts
      
      return offlineItem; 
    } else {
      // Online: Direct DB Call
      if (type === 'CREATE') return await db.collection(collection).add(payload);
      if (type === 'UPDATE' && docId) return await db.collection(collection).update(docId, payload);
      if (type === 'DELETE' && docId) return await db.collection(collection).delete(docId);
    }
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await db.collection('students').get() as Student[];
      // ... (rest of fetch logic remains, but simplified here as listeners handle updates)
      // We rely on listeners primarily now
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

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
      db.onSnapshot('support_tickets', setSupportTickets),
      db.onSnapshot('admissions_applications', setApplications),
      db.onSnapshot('communication_templates', setSmsTemplates),
      db.onSnapshot('transport_routes', setTransportRoutes),
      db.onSnapshot('transport_vehicles', setTransportVehicles),
      db.onSnapshot('transport_logs', setTransportLogs),
      db.onSnapshot('staff', setStaffRecords),
      db.onSnapshot('attendance', setAttendance),
      db.onSnapshot('competencies', setCompetencies),
      db.onSnapshot('points', setPointsLogs)
    ];
    
    // Transport Sim
    const simInterval = setInterval(() => {
        setTransportVehicles(prev => prev.map(v => {
            const newX = Math.max(10, Math.min(90, v.currentLocation.x + (Math.random() - 0.5) * 5));
            const newY = Math.max(10, Math.min(90, v.currentLocation.y + (Math.random() - 0.5) * 5));
            return { ...v, currentLocation: { x: newX, y: newY }, speed: Math.max(0, Math.min(80, v.speed + (Math.random() - 0.5) * 10)) };
        }));
    }, 5000);

    const configFetch = async () => {
       const sysData = await db.collection('config').getConfig() as any;
       setSystemConfig(sysData.config);
       setSystemHealth(sysData.health);
       setLoading(false);
    };
    configFetch();

    return () => {
      unsubscribes.forEach(u => u());
      clearInterval(simInterval);
    };
  }, []);

  // --- ACTIONS (Wrapped with performWrite) ---

  const addStudent = async (student: Omit<Student, 'id'>) => {
    await performWrite('students', 'CREATE', student);
  };

  const addTransaction = async (tx: Omit<FinanceTransaction, 'id'>) => {
    await performWrite('finance', 'CREATE', tx);
    // Optimistic balance update for student?
    // In offline mode, the student record update needs to be queued too
    const student = students.find(s => s.id === tx.studentId);
    if (student) {
      await performWrite('students', 'UPDATE', { balance: student.balance - tx.amount }, student.id);
    }
  };

  const updateLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await performWrite('leave_requests', 'UPDATE', { status }, id);
  };

  const submitAttendance = async (records: AttendanceRecord[]) => {
    // Batch writes simulated by looping
    for (const record of records) {
        // Check if updating existing record for today? 
        // For simplicity, we just add new records or overwrite if ID matches
        // But offline queue expects single items.
        await performWrite('attendance', 'CREATE', record);
    }
  };

  const addAssessment = async (assessment: Omit<Assessment, 'id'>) => {
    await performWrite('assessments', 'CREATE', assessment);
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
    
    // Logic for notifications and calendar is complex to fully replicate offline atomically without cloud functions
    // We will simulate the notification creation offline too
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
    await performWrite('support_tickets', 'CREATE', ticket);
  };

  const resolveSupportTicket = async (id: string, response: string, responderName: string) => {
    await performWrite('support_tickets', 'UPDATE', {
        status: 'RESOLVED',
        adminResponse: response,
        resolvedAt: new Date().toISOString(),
        resolvedBy: responderName
    }, id);
  };

  const submitApplication = async (app: Omit<AdmissionApplication, 'id'>) => {
    await performWrite('admissions_applications', 'CREATE', app);
  };

  const updateApplicationStage = async (id: string, stage: AdmissionStage) => {
    await performWrite('admissions_applications', 'UPDATE', { stage }, id);
  };

  const enrollApplicant = async (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    await addStudent({
        name: app.childName,
        grade: app.targetGrade,
        admissionNumber: `ADM-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
        parentName: app.parentName,
        contactPhone: app.parentPhone,
        contactEmail: app.parentEmail,
        balance: 30000,
        avatarUrl: `https://ui-avatars.com/api/?name=${app.childName}&background=random`,
        totalPoints: 0
    });

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

  const awardPoints = async (targetId: string, role: 'STUDENT' | 'TEACHER', points: number, reason: string, awardedBy: string) => {
    // 1. Create Log
    await performWrite('points', 'CREATE', {
        userId: targetId,
        role,
        points,
        reason,
        date: new Date().toISOString(),
        awardedBy
    });

    // 2. Optimistic Update of Total
    if (role === 'STUDENT') {
        const student = students.find(s => s.id === targetId);
        if (student) {
            const newTotal = (student.totalPoints || 0) + points;
            await performWrite('students', 'UPDATE', { totalPoints: newTotal }, targetId);
        }
    } else {
        const user = users.find(u => u.id === targetId);
        if (user) {
            const newTotal = (user.totalPoints || 0) + points;
            await performWrite('users', 'UPDATE', { totalPoints: newTotal }, targetId);
        }
    }
  };

  const connectionState = isSyncing ? 'SYNCING' : (isOnline ? 'ONLINE' : 'OFFLINE');

  return (
    <StudentDataContext.Provider value={{ 
      students, transactions, leaveRequests, attendance, competencies, assessments, notifications, studentNotes, users, events, consents, timetable, supportTickets, applications, smsTemplates, transportRoutes, transportVehicles, transportLogs, staffRecords, pointsLogs, systemConfig, systemHealth,
      loading, 
      connectionStatus: connectionState,
      pendingChanges,
      addStudent, addTransaction, updateLeaveRequest, submitAttendance, addAssessment, updateAssessment, addStudentNote, markNotificationRead, updateUser, addEvent, deleteEvent, submitConsent, submitLeaveRequest, resolveLeaveRequest, addTimetableSlot, deleteTimetableSlot, checkTimetableConflict, addSupportTicket, resolveSupportTicket, submitApplication, updateApplicationStage, enrollApplicant, addSmsTemplate, updateSmsTemplate, deleteSmsTemplate, addTransportRoute, addStaffRecord, updateStaffRecord, awardPoints,
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
