
import { Student, FinanceTransaction, AttendanceRecord, LeaveRequest, Competency, UserProfile, UserRole, Assessment, AttendanceStatus, StudentNote, SchoolEvent, EventConsent, TimetableSlot, SupportTicket, AdmissionApplication } from '../types';

// Simulating Firestore behavior with LocalStorage and Async delays
const DELAY = 500;

// Initial Data
const MOCK_USERS: UserProfile[] = [
  { 
    id: 'u1', 
    name: 'Principal Admin', 
    email: 'admin@school.com', 
    role: UserRole.ADMIN, 
    status: 'ACTIVE', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Principal+Admin&background=1E3A8A&color=fff',
    leaveBalances: {
      annual: { total: 21, used: 5 },
      sick: { total: 14, used: 0 },
      compassionate: { total: 7, used: 0 }
    }
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
    }
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
    }
  }
];

const MOCK_STUDENTS: Student[] = [
  { id: 'st1', name: 'Zuri Kamau', grade: 'Grade 4', admissionNumber: 'ADM-2023-001', parentName: 'David Kamau', contactPhone: '0712345678', contactEmail: 'david@kamau.com', balance: 15000, avatarUrl: 'https://picsum.photos/100/100?random=1' },
  { id: 'st2', name: 'Jabari Ochieng', grade: 'Grade 4', admissionNumber: 'ADM-2023-002', parentName: 'Grace Ochieng', contactPhone: '0722345678', contactEmail: 'grace@ochieng.com', balance: 0, avatarUrl: 'https://picsum.photos/100/100?random=2' },
  { id: 'st3', name: 'Nia Wanjiku', grade: 'Grade 5', admissionNumber: 'ADM-2023-003', parentName: 'Esther Wanjiku', contactPhone: '0733345678', contactEmail: 'esther@wanjiku.com', balance: 4500, avatarUrl: 'https://picsum.photos/100/100?random=3' },
  { id: 'st4', name: 'Kofi Abdi', grade: 'Grade 4', admissionNumber: 'ADM-2023-004', parentName: 'Mohammed Abdi', contactPhone: '0744345678', contactEmail: 'mohammed@abdi.com', balance: 22000, avatarUrl: 'https://picsum.photos/100/100?random=4' },
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

// Helper to simulate DB
const getCollection = <T>(key: string, defaults: T[]): T[] => {
  const stored = localStorage.getItem(`mwangaza_${key}`);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(`mwangaza_${key}`, JSON.stringify(defaults));
  return defaults;
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
      return [];
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
                          path === 'admissions_applications' ? MOCK_APPLICATIONS : [];

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
    
    const data = getCollection(path, defaultData);
    callback(data);
    
    const interval = setInterval(() => {
      const freshData = getCollection(path, []);
      callback(freshData);
    }, 2000); // Polling interval
    
    return () => clearInterval(interval);
  }
};
