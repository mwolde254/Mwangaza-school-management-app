
export enum UserRole {
  ADMIN = 'ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT'
}

export interface LeaveBalance {
  annual: { total: number; used: number };
  sick: { total: number; used: number };
  compassionate: { total: number; used: number };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  avatarUrl?: string;
  phoneNumber?: string;
  linkedStudentIds?: string[]; // For parents
  leaveBalances?: LeaveBalance; // New for staff
}

export interface Student {
  id: string;
  name: string;
  grade: string; // e.g., "Grade 4"
  admissionNumber: string;
  parentName: string;
  contactPhone?: string;
  contactEmail?: string;
  balance: number;
  avatarUrl: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  authorName: string;
  date: string;
  type: 'BEHAVIOR' | 'ACADEMIC' | 'GENERAL';
  content: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT'
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  minutesLate?: number;
}

export interface Assessment {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  total: number;
  comments?: string;
}

export interface FinanceTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: 'TUITION' | 'LUNCH' | 'TRANSPORT' | 'UNIFORM' | 'TRIP';
  date: string;
  status: 'PAID' | 'PENDING';
  method: 'MPESA' | 'BANK' | 'CASH';
}

export interface Competency {
  id: string;
  studentId: string;
  subject: string;
  strand: string;
  rating: 'Emerging' | 'Developing' | 'Meeting Expectation' | 'Exceeding';
  notes?: string;
}

export type LeaveType = 'MEDICAL' | 'ANNUAL' | 'COMPASSIONATE' | 'OFFICIAL';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  coverTeacherId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  requestDate: string;
}

// --- CALENDAR TYPES ---

export type EventType = 'GENERAL' | 'ACADEMIC' | 'HOLIDAY' | 'TRIP' | 'STAFF';
export type EventAudience = 'WHOLE_SCHOOL' | 'GRADE' | 'CLASS' | 'STAFF';

export interface SchoolEvent {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  type: EventType;
  audience: EventAudience;
  targetGrade?: string; 
  description?: string;
  requiresConsent: boolean;
  requiresPayment: boolean;
  cost?: number;
}

export interface EventConsent {
  id: string;
  eventId: string;
  studentId: string;
  parentName: string;
  signedDate: string;
  status: 'SIGNED';
}

// --- TIMETABLE TYPES ---

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableSlot {
  id: string;
  classId: string; // e.g. "Grade 4"
  day: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string;   // "08:40"
  subject: string;   // "Mathematics" or "BREAK"
  teacherId?: string;
  teacherName?: string;
  room?: string;
  type: 'LESSON' | 'BREAK';
}

// --- SUPPORT / HELP DESK TYPES ---

export type TicketCategory = 'FEES' | 'ACADEMIC' | 'TRANSPORT' | 'DISCIPLINARY' | 'OTHER';
export type TicketStatus = 'OPEN' | 'RESOLVED';

export interface SupportTicket {
  id: string;
  parentId: string;
  parentName: string;
  studentId?: string; // Optional linkage to specific child
  studentName?: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  date: string;
  adminResponse?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// --- ADMISSIONS TYPES ---

export type AdmissionStage = 'NEW_INQUIRY' | 'UNDER_REVIEW' | 'INTERVIEW' | 'OFFER_SENT' | 'ENROLLED' | 'REJECTED';

export interface AdmissionApplication {
  id: string;
  submissionDate: string;
  stage: AdmissionStage;
  
  // Student Details
  childName: string;
  dob: string;
  gender: 'Male' | 'Female';
  targetGrade: string;
  
  // Parent Details
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  
  // Medical & Needs
  hasAllergies: boolean;
  allergyDetails?: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetails?: string;
  
  // Documents (URLs)
  docBirthCert?: string;
  docReportCard?: string;
  docImmunization?: string;
  
  // Internal
  notes?: string;
}
