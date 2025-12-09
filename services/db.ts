
import { Student, FinanceTransaction, AttendanceRecord, LeaveRequest, Competency, UserProfile, UserRole, Assessment, AttendanceStatus, StudentNote, SchoolEvent, EventConsent, TimetableSlot, SupportTicket, AdmissionApplication, SmsTemplate, TransportRoute, TransportVehicle, TransportLog, StaffRecord, SystemConfig, SystemHealth, PointLog } from '../types';

// Simulating Firestore behavior with LocalStorage and Async delays
const DELAY = 500;

// --- OFFLINE SYNC TYPES & STORE ---
export interface SyncItem {
  id: string;
  collection: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  docId?: string;
  timestamp: number;
}

export const OfflineDB = {
  getQueue: (): SyncItem[] => {
    try {
      return JSON.parse(localStorage.getItem('mwangaza_sync_queue') || '[]');
    } catch { return []; }
  },
  addToQueue: (item: Omit<SyncItem, 'id' | 'timestamp'>) => {
    const queue = OfflineDB.getQueue();
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    queue.push(newItem);
    localStorage.setItem('mwangaza_sync_queue', JSON.stringify(queue));
    return newItem;
  },
  removeFromQueue: (id: string) => {
    const queue = OfflineDB.getQueue().filter(i => i.id !== id);
    localStorage.setItem('mwangaza_sync_queue', JSON.stringify(queue));
  },
  clearQueue: () => {
    localStorage.setItem('mwangaza_sync_queue', '[]');
  }
};

// Initial Data
const MOCK_USERS: UserProfile[] = [
  { 
    id: 'u1', 
    name: 'Principal Admin', 
    email: 'admin@school.com', 
    role: UserRole.PRINCIPAL, 
    status: 'ACTIVE', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Principal+Admin&background=1E3A8A&color=fff',
    leaveBalances: {
      annual: { total: 21, used: 5 },
      sick: { total: 14, used: 0 },
      compassionate: { total: 7, used: 0 }
    },
    totalPoints: 120
  },
  { 
    id: 'u2', 
    name: 'Tr. Sarah Johnson', 
    email: 'teacher@school.com', 
    role: UserRole.TEACHER, 
    status: 'ACTIVE', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=059669&color=fff',
    leaveBalances: {
      annual: { total: 21, used: 12 },
      sick: { total: 14, used: 2 },
      compassionate: { total: 7, used: 0 }
    },
    totalPoints: 350
  },
  { 
    id: 'u3', 
    name: 'David Kamau', 
    email: 'parent@school.com', 
    role: UserRole.PARENT, 
    status: 'ACTIVE', 
    linkedStudentIds: ['st1'], 
    avatarUrl: 'https://ui-avatars.com/api/?name=David+Kamau&background=FCD34D&color=1E3A8A' 
  },
  { 
    id: 'u4', 
    name: 'Mr. John Maina', 
    email: 'john@school.com', 
    role: UserRole.TEACHER, 
    status: 'ACTIVE', 
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Maina&background=111827&color=fff',
    leaveBalances: {
      annual: { total: 21, used: 0 },
      sick: { total: 14, used: 10 },
      compassionate: { total: 7, used: 3 }
    },
    totalPoints: 210
  },
  { 
    id: 'u5', 
    name: 'System Administrator', 
    email: 'sysadmin@school.com', 
    role: UserRole.ADMIN, 
    status: 'ACTIVE', 
    avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=000&color=fff',
  }
];

// --- HR MOCK DATA ---
const MOCK_STAFF: StaffRecord[] = [
  { id: 'stf1', userId: 'u2', fullName: 'Sarah Johnson', email: 'teacher@school.com', phone: '0711223344', role: 'TEACHER', department: 'Primary', status: 'ACTIVE', startDate: '2020-01-10', salaryBand: 'TS-3', qualifications: ['B.Ed Primary Education', 'CBC Certified'] },
  { id: 'stf2', userId: 'u4', fullName: 'John Maina', email: 'john@school.com', phone: '0722334455', role: 'TEACHER', department: 'Science', status: 'ACTIVE', startDate: '2019-05-01', salaryBand: 'TS-4', qualifications: ['B.Sc Science', 'PGDE'] },
  { id: 'stf3', fullName: 'Mary Wanjiku', email: 'mary@school.com', phone: '0733445566', role: 'SUPPORT', department: 'Catering', status: 'ACTIVE', startDate: '2021-02-15', salaryBand: 'SS-2', qualifications: ['Food & Beverage Cert'] },
  { id: 'stf4', fullName: 'James Mwangi', email: 'james@school.com', phone: '0744556677', role: 'TRANSPORT', department: 'Logistics', status: 'ON_LEAVE', startDate: '2018-09-01', salaryBand: 'SS-3', qualifications: ['PSV License', 'First Aid'] },
];

const MOCK_SYSTEM_CONFIG: SystemConfig = {
  currency: 'KES',
  academicYear: '2023',
  currentTerm: 'Term 3',
  lastModifiedBy: 'System Administrator',
  lastModifiedDate: '2023-09-01T10:00:00Z'
};

const MOCK_DATA_HEALTH: SystemHealth = {
  unlinkedStudents: 2,
  financeApiStatus: 'ACTIVE',
  missingTimetableEntries: 5,
  lastBackup: '2023-10-26T02:00:00Z'
};

const MOCK_STUDENTS: Student[] = [
  { id: 'st1', name: 'Zuri Kamau', grade: 'Grade 4', admissionNumber: 'ADM-2023-001', parentName: 'David Kamau', contactPhone: '0712345678', contactEmail: 'david@kamau.com', balance: 15000, avatarUrl: 'https://picsum.photos/100/100?random=1', transportRouteId: 'tr1', totalPoints: 150 },
  { id: 'st2', name: 'Jabari Ochieng', grade: 'Grade 4', admissionNumber: 'ADM-2023-002', parentName: 'Grace Ochieng', contactPhone: '0722345678', contactEmail: 'grace@ochieng.com', balance: 0, avatarUrl: 'https://picsum.photos/100/100?random=2', transportRouteId: 'tr2', totalPoints: 85 },
  { id: 'st3', name: 'Nia Wanjiku', grade: 'Grade 5', admissionNumber: 'ADM-2023-003', parentName: 'Esther Wanjiku', contactPhone: '0733345678', contactEmail: 'esther@wanjiku.com', balance: 4500, avatarUrl: 'https://picsum.photos/100/100?random=3', totalPoints: 200 },
  { id: 'st4', name: 'Kofi Abdi', grade: 'Grade 4', admissionNumber: 'ADM-2023-004', parentName: 'Mohammed Abdi', contactPhone: '0744345678', contactEmail: 'mohammed@abdi.com', balance: 22000, avatarUrl: 'https://picsum.photos/100/100?random=4', totalPoints: 120 },
];

const MOCK_POINTS: PointLog[] = [
  { id: 'pl1', userId: 'u2', role: 'TEACHER', points: 50, reason: '100% Attendance Submission', date: '2023-10-01', awardedBy: 'SYSTEM' },
  { id: 'pl2', userId: 'u2', role: 'TEACHER', points: 100, reason: 'All Assessments Graded', date: '2023-10-15', awardedBy: 'SYSTEM' },
  { id: 'pl3', userId: 'st1', role: 'STUDENT', points: 10, reason: 'Top Score in Math', date: '2023-10-10', awardedBy: 'u2' },
  { id: 'pl4', userId: 'st1', role: 'STUDENT', points: 5, reason: 'Helping Peers', date: '2023-10-12', awardedBy: 'u2' },
  { id: 'pl5', userId: 'u4', role: 'TEACHER', points: 50, reason: '100% Attendance Submission', date: '2023-10-01', awardedBy: 'SYSTEM' },
];

const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'as1', studentId: 'st1', subject: 'Mathematics', score: 85, total: 100, comments: 'Excellent problem solving.' },
  { id: 'as2', studentId: 'st1', subject: 'English', score: 72, total: 100, comments: 'Good reading comprehension.' },
  { id: 'as3', studentId: 'st2', subject: 'Mathematics', score: 65, total: 100, comments: 'Needs improvement in algebra.' },
];

const MOCK_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'tx1', studentId: 'st2', studentName: 'Jabari Ochieng', amount: 15000, type: 'TUITION', date: '2023-10-01', status: 'PAID', method: 'MPESA' },
  { id: 'tx2', studentId: 'st1', studentName: 'Zuri Kamau', amount: 5000, type: 'LUNCH', date: '2023-10-02', status: 'PAID', method: 'CASH' },
];

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lr1', staffId: 'u4', staffName: 'Mr. John Maina', type: 'MEDICAL', startDate: '2023-10-25', endDate: '2023-10-27', days: 3, reason: 'Severe flu, doctor note attached.', status: 'PENDING', requestDate: '2023-10-24' },
  { id: 'lr2', staffId: 'u2', staffName: 'Tr. Sarah Johnson', type: 'ANNUAL', startDate: '2023-11-15', endDate: '2023-11-20', days: 5, reason: 'Family vacation.', status: 'APPROVED', requestDate: '2023-10-10' },
];

const MOCK_COMPETENCIES: Competency[] = [
  { id: 'cmp1', studentId: 'st1', subject: 'Mathematics', strand: 'Numbers', rating: 'Exceeding', notes: 'Can multiply 3 digit numbers easily.' },
  { id: 'cmp2', studentId: 'st1', subject: 'English', strand: 'Listening', rating: 'Meeting Expectation', notes: 'Follows complex instructions.' },
  { id: 'cmp3', studentId: 'st1', subject: 'Science', strand: 'Environment', rating: 'Emerging', notes: 'Needs support identifying local plants.' },
  { id: 'cmp4', studentId: 'st2', subject: 'Mathematics', strand: 'Geometry', rating: 'Developing', notes: 'Struggles with angles.' },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att1', studentId: 'st1', date: '2023-10-20', status: AttendanceStatus.PRESENT },
  { id: 'att2', studentId: 'st1', date: '2023-10-21', status: AttendanceStatus.PRESENT },
  { id: 'att3', studentId: 'st1', date: '2023-10-22', status: AttendanceStatus.LATE, minutesLate: 15 },
  { id: 'att4', studentId: 'st1', date: '2023-10-23', status: AttendanceStatus.PRESENT },
  { id: 'att5', studentId: 'st1', date: '2023-10-24', status: AttendanceStatus.ABSENT },
];

const MOCK_NOTES: StudentNote[] = [
  { id: 'nt1', studentId: 'st1', authorName: 'Tr. Sarah', date: '2023-10-15', type: 'BEHAVIOR', content: 'Zuri was very helpful to her peers during the group project today.', severity: 'LOW' },
  { id: 'nt2', studentId: 'st1', authorName: 'Principal Admin', date: '2023-09-10', type: 'GENERAL', content: 'Parent meeting regarding Science Trip contribution.', severity: 'LOW' },
];

const MOCK_EVENTS: SchoolEvent[] = [
  { id: 'ev1', title: 'Grade 4 Science Trip', startDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), endDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), type: 'TRIP', audience: 'GRADE', targetGrade: 'Grade 4', description: 'Visit to the Nairobi Museum.', requiresConsent: true, requiresPayment: true, cost: 500 },
  { id: 'ev2', title: 'Mid-Term Exams', startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), endDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(), type: 'ACADEMIC', audience: 'WHOLE_SCHOOL', requiresConsent: false, requiresPayment: false },
  { id: 'ev3', title: 'Mashujaa Day', startDate: '2023-10-20T00:00:00.000Z', endDate: '2023-10-20T23:59:59.000Z', type: 'HOLIDAY', audience: 'WHOLE_SCHOOL', requiresConsent: false, requiresPayment: false },
  { id: 'ev4', title: 'Staff Meeting', startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), type: 'STAFF', audience: 'STAFF', description: 'Curriculum review in the main hall.', requiresConsent: false, requiresPayment: false },
];

const MOCK_CONSENTS: EventConsent[] = [
    // Empty initially
];

const MOCK_TIMETABLE: TimetableSlot[] = [
  // Grade 4 - Monday
  { id: 'tt1', classId: 'Grade 4', day: 'Monday', startTime: '08:00', endTime: '08:40', subject: 'Mathematics', teacherId: 'u2', teacherName: 'Tr. Sarah Johnson', room: 'Class 4A', type: 'LESSON' },
  { id: 'tt2', classId: 'Grade 4', day: 'Monday', startTime: '08:40', endTime: '09:20', subject: 'English', teacherId: 'u2', teacherName: 'Tr. Sarah Johnson', room: 'Class 4A', type: 'LESSON' },
  { id: 'tt3', classId: 'Grade 4', day: 'Monday', startTime: '09:20', endTime: '10:00', subject: 'Science', teacherId: 'u4', teacherName: 'Mr. John Maina', room: 'Lab 1', type: 'LESSON' },
  { id: 'tt4', classId: 'Grade 4', day: 'Monday', startTime: '10:00', endTime: '10:30', subject: 'BREAK', type: 'BREAK' },
  { id: 'tt5', classId: 'Grade 4', day: 'Monday', startTime: '10:30', endTime: '11:10', subject: 'Kiswahili', teacherId: 'u4', teacherName: 'Mr. John Maina', room: 'Class 4A', type: 'LESSON' },
  // Grade 4 - Tuesday
  { id: 'tt6', classId: 'Grade 4', day: 'Tuesday', startTime: '08:00', endTime: '08:40', subject: 'Social Studies', teacherId: 'u2', teacherName: 'Tr. Sarah Johnson', room: 'Class 4A', type: 'LESSON' },
  { id: 'tt7', classId: 'Grade 4', day: 'Tuesday', startTime: '08:40', endTime: '09:20', subject: 'Mathematics', teacherId: 'u2', teacherName: 'Tr. Sarah Johnson', room: 'Class 4A', type: 'LESSON' },
];

const MOCK_TICKETS: SupportTicket[] = [
  { id: 'tk1', parentId: 'u3', parentName: 'David Kamau', studentId: 'st1', studentName: 'Zuri Kamau', category: 'FEES', subject: 'Clarification on Trip Cost', message: 'Hi, does the science trip cost cover lunch as well?', status: 'RESOLVED', date: '2023-10-20T10:00:00Z', adminResponse: 'Yes, Mr. Kamau. Lunch and transport are included.', resolvedAt: '2023-10-20T14:00:00Z', resolvedBy: 'Bursar' },
  { id: 'tk2', parentId: 'u3', parentName: 'David Kamau', category: 'ACADEMIC', subject: 'Report Card access', message: 'I cannot download the Term 2 report card.', status: 'OPEN', date: '2023-10-25T08:30:00Z' }
];

const MOCK_APPLICATIONS: AdmissionApplication[] = [
  { 
    id: 'app1', 
    submissionDate: '2023-10-26T09:00:00Z', 
    stage: 'NEW_INQUIRY',
    childName: 'Imani Wekesa',
    dob: '2015-05-15',
    gender: 'Female',
    targetGrade: 'Grade 3',
    parentName: 'Samuel Wekesa',
    parentEmail: 'samuel@wekesa.com',
    parentPhone: '0711223344',
    hasAllergies: false,
    hasSpecialNeeds: false
  },
  { 
    id: 'app2', 
    submissionDate: '2023-10-24T14:30:00Z', 
    stage: 'UNDER_REVIEW',
    childName: 'Liam Odhiambo',
    dob: '2016-08-20',
    gender: 'Male',
    targetGrade: 'Grade 2',
    parentName: 'Alice Odhiambo',
    parentEmail: 'alice@odhiambo.com',
    parentPhone: '0799887766',
    hasAllergies: true,
    allergyDetails: 'Peanuts',
    hasSpecialNeeds: false,
    docBirthCert: 'uploaded',
    docReportCard: 'uploaded'
  },
  {
    id: 'app3',
    submissionDate: '2023-10-20T11:00:00Z',
    stage: 'OFFER_SENT',
    childName: 'Zara Shah',
    dob: '2014-02-10',
    gender: 'Female',
    targetGrade: 'Grade 5',
    parentName: 'Fatima Shah',
    parentEmail: 'fatima@shah.com',
    parentPhone: '0722334455',
    hasAllergies: false,
    hasSpecialNeeds: false
  }
];

const MOCK_TEMPLATES: SmsTemplate[] = [
  { id: 'tpl1', name: 'Fee Reminder - T3', category: 'Fees', content: 'Dear {{Parent Name}}, this is a gentle reminder that {{Student Name}} has a fee balance of KES {{Fee Balance}}. Please pay by Friday.', status: 'APPROVED', createdBy: 'u1' },
  { id: 'tpl2', name: 'Exam Results Ready', category: 'Exams', content: 'Hello, exam results for {{Student Name}} are now available on the portal. Admission No: {{Admission No}}. Regards, Mwangaza.', status: 'APPROVED', createdBy: 'u1' },
  { id: 'tpl3', name: 'Trip Departure', category: 'Transport', content: 'Reminder: The bus for {{Class}} departs tomorrow at 7:00 AM sharp. Please ensure {{Student Name}} is punctual.', status: 'DRAFT', createdBy: 'u2' },
  { id: 'tpl4', name: 'Emergency Closure', category: 'Emergency', content: 'Urgent: School will be closed tomorrow due to heavy rains. Please keep {{Student Name}} at home.', status: 'PENDING_APPROVAL', createdBy: 'u2' },
];

export interface AppNotification {
  id: string;
  userId: string; // 'all' or specific user id
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  read: boolean;
  date: string;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', userId: 'all', title: 'System Update', message: 'Maintenance scheduled for 2:00 AM tonight.', type: 'INFO', read: false, date: '2023-10-25' },
  { id: 'n2', userId: 'u1', title: 'New Leave Request', message: 'Mr. John Maina has requested sick leave.', type: 'WARNING', read: false, date: '2023-10-24' },
];

// --- TRANSPORT MOCK ---
const MOCK_TRANSPORT_ROUTES: TransportRoute[] = [
  { id: 'tr1', name: 'Kileleshwa Morning', driverName: 'James Mwangi', vehicleNumber: 'KBA 321T', stops: ['Kileleshwa P/S', 'Oloitoktok Rd', 'Methodist Guest House', 'Valley Arcade', 'School'], scheduleTime: '06:45' },
  { id: 'tr2', name: 'Westlands Express', driverName: 'Peter Kamau', vehicleNumber: 'KCD 555X', stops: ['Sarit Centre', 'Westgate', 'Mpaka Rd', 'School'], scheduleTime: '07:00' },
];

const MOCK_TRANSPORT_VEHICLES: TransportVehicle[] = [
  { id: 'v1', routeId: 'tr1', currentLocation: { x: 45, y: 30 }, speed: 45, status: 'ON_ROUTE', nextStop: 'Valley Arcade', etaToNextStop: '5 mins', lastUpdated: new Date().toISOString() },
  { id: 'v2', routeId: 'tr2', currentLocation: { x: 70, y: 60 }, speed: 20, status: 'DELAYED', nextStop: 'Mpaka Rd', etaToNextStop: '15 mins', lastUpdated: new Date().toISOString() },
];

const MOCK_TRANSPORT_LOGS: TransportLog[] = [
  { id: 'lg1', date: '2023-10-26', routeId: 'tr1', driverName: 'James Mwangi', departureTime: '06:45', arrivalTime: '07:30', status: 'ON_TIME' },
  { id: 'lg2', date: '2023-10-26', routeId: 'tr2', driverName: 'Peter Kamau', departureTime: '07:05', arrivalTime: '08:15', status: 'LATE', delayMinutes: 15 },
  { id: 'lg3', date: '2023-10-25', routeId: 'tr1', driverName: 'James Mwangi', departureTime: '06:40', arrivalTime: '07:25', status: 'ON_TIME' },
];

// Helper to simulate DB
const getCollection = <T>(path: string, defaults: T[]): T[] => {
  const key = `mwangaza_${path}`;
  const stored = localStorage.getItem(key);
  let data = stored ? JSON.parse(stored) : defaults;
  
  // If first run, initialize
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaults));
  }

  // --- MERGE OFFLINE QUEUE (OPTIMISTIC READ) ---
  const syncQueue = OfflineDB.getQueue();
  const pendingChanges = syncQueue.filter(item => item.collection === path);

  if (pendingChanges.length > 0) {
    // Clone to avoid mutating persisted state during render
    let mergedData = [...data];
    
    pendingChanges.sort((a,b) => a.timestamp - b.timestamp).forEach(change => {
      if (change.type === 'CREATE') {
        mergedData.push(change.payload);
      } else if (change.type === 'UPDATE') {
        const index = mergedData.findIndex((d: any) => d.id === change.docId);
        if (index > -1) {
          mergedData[index] = { ...mergedData[index], ...change.payload };
        }
      } else if (change.type === 'DELETE') {
        mergedData = mergedData.filter((d: any) => d.id !== change.docId);
      }
    });
    return mergedData;
  }

  return data;
};

const setCollection = (key: string, data: any[]) => {
  localStorage.setItem(`mwangaza_${key}`, JSON.stringify(data));
};

// Firestore-like API
export const db = {
  collection: (path: string) => ({
    get: async () => {
      await new Promise(r => setTimeout(r, DELAY));
      if (path === 'students') return getCollection<Student>('students', MOCK_STUDENTS);
      if (path === 'finance') return getCollection<FinanceTransaction>('finance', MOCK_TRANSACTIONS);
      if (path === 'leave_requests') return getCollection<LeaveRequest>('leave_requests', MOCK_LEAVE_REQUESTS);
      if (path === 'attendance') return getCollection<AttendanceRecord>('attendance', MOCK_ATTENDANCE);
      if (path === 'competencies') return getCollection<Competency>('competencies', MOCK_COMPETENCIES);
      if (path === 'users') return getCollection<UserProfile>('users', MOCK_USERS);
      if (path === 'assessments') return getCollection<Assessment>('assessments', MOCK_ASSESSMENTS);
      if (path === 'notifications') return getCollection<AppNotification>('notifications', MOCK_NOTIFICATIONS);
      if (path === 'student_notes') return getCollection<StudentNote>('student_notes', MOCK_NOTES);
      if (path === 'events') return getCollection<SchoolEvent>('events', MOCK_EVENTS);
      if (path === 'consents') return getCollection<EventConsent>('consents', MOCK_CONSENTS);
      if (path === 'timetable') return getCollection<TimetableSlot>('timetable', MOCK_TIMETABLE);
      if (path === 'support_tickets') return getCollection<SupportTicket>('support_tickets', MOCK_TICKETS);
      if (path === 'admissions_applications') return getCollection<AdmissionApplication>('admissions_applications', MOCK_APPLICATIONS);
      if (path === 'communication_templates') return getCollection<SmsTemplate>('communication_templates', MOCK_TEMPLATES);
      if (path === 'transport_routes') return getCollection<TransportRoute>('transport_routes', MOCK_TRANSPORT_ROUTES);
      if (path === 'transport_vehicles') return getCollection<TransportVehicle>('transport_vehicles', MOCK_TRANSPORT_VEHICLES);
      if (path === 'transport_logs') return getCollection<TransportLog>('transport_logs', MOCK_TRANSPORT_LOGS);
      if (path === 'staff') return getCollection<StaffRecord>('staff', MOCK_STAFF);
      if (path === 'points') return getCollection<PointLog>('points', MOCK_POINTS);
      return [];
    },
    // Special getter for single config docs
    getConfig: async () => {
        await new Promise(r => setTimeout(r, DELAY));
        return { config: MOCK_SYSTEM_CONFIG, health: MOCK_DATA_HEALTH };
    },
    add: async (data: any) => {
      await new Promise(r => setTimeout(r, DELAY));
      const collectionKey = path === 'invites' ? 'users' : path;
      
      const defaultData = path === 'students' ? MOCK_STUDENTS : 
                          path === 'users' ? MOCK_USERS : 
                          path === 'finance' ? MOCK_TRANSACTIONS :
                          path === 'attendance' ? MOCK_ATTENDANCE :
                          path === 'competencies' ? MOCK_COMPETENCIES : 
                          path === 'notifications' ? MOCK_NOTIFICATIONS : 
                          path === 'student_notes' ? MOCK_NOTES : 
                          path === 'events' ? MOCK_EVENTS :
                          path === 'leave_requests' ? MOCK_LEAVE_REQUESTS :
                          path === 'consents' ? MOCK_CONSENTS : 
                          path === 'timetable' ? MOCK_TIMETABLE : 
                          path === 'support_tickets' ? MOCK_TICKETS : 
                          path === 'admissions_applications' ? MOCK_APPLICATIONS : 
                          path === 'communication_templates' ? MOCK_TEMPLATES : 
                          path === 'transport_routes' ? MOCK_TRANSPORT_ROUTES :
                          path === 'transport_vehicles' ? MOCK_TRANSPORT_VEHICLES :
                          path === 'transport_logs' ? MOCK_TRANSPORT_LOGS : 
                          path === 'staff' ? MOCK_STAFF : 
                          path === 'points' ? MOCK_POINTS : [];

      const list = getCollection(collectionKey, defaultData as any[]);
      
      const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
      list.push(newItem);
      setCollection(collectionKey, list);
      return newItem;
    },
    update: async (id: string, updates: any) => {
      await new Promise(r => setTimeout(r, DELAY));
      const list = getCollection(path, []);
      const index = list.findIndex((item: any) => item.id === id);
      if (index > -1) {
        list[index] = { ...list[index], ...updates };
        setCollection(path, list);
      }
    },
    delete: async (id: string) => {
      await new Promise(r => setTimeout(r, DELAY));
      const list = getCollection(path, []);
      const newList = list.filter((item: any) => item.id !== id);
      setCollection(path, newList);
    },
    batchSet: async (items: any[]) => {
      await new Promise(r => setTimeout(r, DELAY));
      const list = getCollection(path, []);
      const newList = [...list, ...items];
      setCollection(path, newList);
    }
  }),
  onSnapshot: (path: string, callback: (data: any[]) => void) => {
    let defaultData: any[] = [];
    if (path === 'students') defaultData = MOCK_STUDENTS;
    else if (path === 'finance') defaultData = MOCK_TRANSACTIONS;
    else if (path === 'users') defaultData = MOCK_USERS;
    else if (path === 'assessments') defaultData = MOCK_ASSESSMENTS;
    else if (path === 'attendance') defaultData = MOCK_ATTENDANCE;
    else if (path === 'competencies') defaultData = MOCK_COMPETENCIES;
    else if (path === 'notifications') defaultData = MOCK_NOTIFICATIONS;
    else if (path === 'student_notes') defaultData = MOCK_NOTES;
    else if (path === 'events') defaultData = MOCK_EVENTS;
    else if (path === 'consents') defaultData = MOCK_CONSENTS;
    else if (path === 'leave_requests') defaultData = MOCK_LEAVE_REQUESTS;
    else if (path === 'timetable') defaultData = MOCK_TIMETABLE;
    else if (path === 'support_tickets') defaultData = MOCK_TICKETS;
    else if (path === 'admissions_applications') defaultData = MOCK_APPLICATIONS;
    else if (path === 'communication_templates') defaultData = MOCK_TEMPLATES;
    else if (path === 'transport_routes') defaultData = MOCK_TRANSPORT_ROUTES;
    else if (path === 'transport_vehicles') defaultData = MOCK_TRANSPORT_VEHICLES;
    else if (path === 'transport_logs') defaultData = MOCK_TRANSPORT_LOGS;
    else if (path === 'staff') defaultData = MOCK_STAFF;
    else if (path === 'points') defaultData = MOCK_POINTS;
    
    // Initial fetch
    const data = getCollection(path, defaultData);
    callback(data);
    
    const interval = setInterval(() => {
      // Re-fetch to capture updates, getCollection handles merging offline data
      const freshData = getCollection(path, defaultData);
      callback(freshData);
    }, 2000); // Polling interval
    
    return () => clearInterval(interval);
  }
};
