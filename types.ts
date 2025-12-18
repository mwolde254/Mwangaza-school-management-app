
export enum UserRole {
  ADMIN = 'ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  SUPER_ADMIN = 'SUPER_ADMIN'
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
  totalPoints?: number;
  schoolId?: string; // Tenant ID for multi-tenancy
}

// --- SUPER ADMIN / SAAS TYPES ---

export type BillingStatus = 'ACTIVE' | 'TRIAL' | 'PENDING_PAYMENT' | 'SUSPENDED';

export interface SchoolTenant {
  id: string;
  name: string;
  slug: string; // URL identifier
  logoUrl: string;
  studentCount: number;
  status: BillingStatus;
  joinedDate: string;
  expiryDate: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  contactPerson: string;
  contactEmail: string;
  enabledModules: string[]; // e.g. ['TRANSPORT', 'FINANCE', 'ACADEMICS']
}

export interface GlobalSmsLog {
  id: string;
  schoolId: string;
  schoolName: string;
  count: number;
  cost: number;
  date: string;
}

// --- HR & STAFF TYPES ---
export type StaffRole = 'TEACHER' | 'ADMIN' | 'SUPPORT' | 'PRINCIPAL' | 'TRANSPORT';
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface StaffRecord {
  id: string;
  userId?: string; // Link to auth user if they have login access
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: EmploymentStatus;
  startDate: string;
  salaryBand?: string;
  qualifications: string[]; // List of certs/degrees
}

export interface SystemConfig {
  currency: string;
  academicYear: string;
  currentTerm: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  maintenanceMode?: boolean;
}

export interface SystemHealth {
  unlinkedStudents: number;
  financeApiStatus: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  missingTimetableEntries: number;
  lastBackup: string;
  uptime: string;
  apiLatency: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string; // e.g., "Grade 4"
  stream?: string; // e.g., "East"
  admissionNumber: string;
  dob?: string; // ISO Date
  gender?: 'Male' | 'Female';
  enrollmentDate?: string;
  parentName: string;
  contactPhone?: string;
  contactEmail?: string;
  balance: number;
  avatarUrl: string;
  transportRouteId?: string; // Linked transport route
  totalPoints?: number;
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
  type: 'TUITION' | 'LUNCH' | 'TRANSPORT' | 'UNIFORM' | 'TRIP' | 'EVENT' | 'LICENSE_FEE';
  date: string;
  status: 'PAID' | 'PENDING';
  method: 'MPESA' | 'BANK' | 'CASH' | 'CARD';
  reference?: string;
  schoolId?: string; // For SaaS level ledger
}

export interface FeeStructure {
  id: string;
  grade: string;
  term: string;
  items: { name: string; amount: number }[];
  total: number;
  status: 'DRAFT' | 'PUBLISHED';
  academicYear: string;
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

// --- ACADEMICS / GRADE MANAGER TYPES ---

export interface ClassStream {
  id: string;
  grade: string; // e.g. "Grade 4"
  name: string; // e.g. "East"
  color: string; // Hex Code e.g. "#38BDF8"
  classTeacherId?: string;
  classTeacherName?: string;
}

export interface SyllabusTopic {
  id: string;
  grade: string;
  subject: string;
  term: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
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

export type TicketCategory = 'FEES' | 'ACADEMIC' | 'TRANSPORT' | 'DISCIPLINARY' | 'IT_SUPPORT' | 'MAINTENANCE' | 'HR' | 'OTHER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'NORMAL' | 'HIGH' | 'CRITICAL';
export type TicketSource = 'PARENT' | 'STAFF';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: string; // UserRole or 'SYSTEM'
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  source: TicketSource;
  requestorId: string;
  requestorName: string;
  requestorRole: UserRole;
  studentId?: string; // Optional linkage to specific child (Parent tickets)
  studentName?: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  location?: string; // For facility/maintenance issues
  assignedToId?: string; // Staff ID
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  schoolId?: string; // For super-admin oversight
  isEscalated?: boolean;
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

// --- SMS TEMPLATES ---
export type SmsCategory = 'General' | 'Fees' | 'Exams' | 'Emergency' | 'Transport';
export type SmsTemplateStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface SmsTemplate {
  id: string;
  name: string;
  category: SmsCategory;
  content: string;
  status: SmsTemplateStatus;
  createdBy: string; // User ID or Name
  rejectionReason?: string;
}

// --- TRANSPORT TYPES ---
export type TransportStatus = 'ON_ROUTE' | 'IDLE' | 'DELAYED' | 'COMPLETED' | 'MAINTENANCE';

export interface TransportRoute {
  id: string;
  name: string; // e.g. "Kileleshwa Morning"
  driverName: string;
  vehicleNumber: string; // e.g. "KBA 123T"
  stops: string[]; // List of stop names
  scheduleTime: string; // "06:30"
}

export interface TransportVehicle {
  id: string;
  routeId: string;
  // Simulating coordinates as % of map container for demo purposes (x, y)
  currentLocation: { x: number; y: number }; 
  speed: number;
  status: TransportStatus;
  nextStop: string;
  etaToNextStop: string; // "5 mins"
  lastUpdated: string;
}

export interface TransportLog {
  id: string;
  date: string;
  routeId: string;
  driverName: string;
  departureTime: string;
  arrivalTime: string;
  status: 'ON_TIME' | 'LATE';
  delayMinutes?: number;
}

export interface PointLog {
  id: string;
  userId: string;
  role: string;
  points: number;
  reason: string;
  date: string;
  awardedBy: string;
}
