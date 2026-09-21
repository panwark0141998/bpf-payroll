// BPF Payroll - Shared Enterprise TypeScript Contracts

// ============================================================================
// COMMON & API RESPONSE
// ============================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// RBAC & AUTH
// ============================================================================
export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'HR_EXECUTIVE'
  | 'PAYROLL_MANAGER'
  | 'FINANCE'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'ATTENDANCE_OPERATOR'
  | 'EMPLOYEE'
  | 'MANAGEMENT';

export type ActionType =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'print'
  | 'download'
  | 'lock'
  | 'unlock';

export type ModuleName =
  | 'company'
  | 'unit'
  | 'employee'
  | 'document'
  | 'face'
  | 'device'
  | 'shift'
  | 'attendance'
  | 'regularization'
  | 'leave'
  | 'holiday'
  | 'overtime'
  | 'loan'
  | 'salary'
  | 'payroll'
  | 'payslip'
  | 'reports'
  | 'audit'
  | 'settings';

export interface Permission {
  id: string;
  module: ModuleName;
  action: ActionType;
  description?: string;
}

export interface Role {
  id: string;
  name: RoleName;
  displayName: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: string;
  companyId?: string;
  unitId?: string;
  username: string;
  email: string;
  fullName: string;
  mobile?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  employeeId?: string;
  roles: RoleName[];
  permissions: { [module in ModuleName]?: ActionType[] };
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// COMPANY & UNIT
// ============================================================================
export interface Company {
  id: string;
  code: string;
  name: string;
  legalName: string;
  address: string;
  gstin?: string;
  pan?: string;
  tan?: string;
  cin?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  financialYear: string;
  payrollCycle: 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY';
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Unit {
  id: string;
  companyId: string;
  code: string;
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  geofenceEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
}

export interface Designation {
  id: string;
  companyId: string;
  title: string;
  code: string;
  grade?: string;
}

// ============================================================================
// EMPLOYEE MASTER
// ============================================================================
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'EXITED';
export type WorkStatus = 'OFFICE' | 'REMOTE' | 'HYBRID' | 'FIELD';

export interface Employee {
  id: string;
  companyId: string;
  unitId: string;
  departmentId: string;
  designationId: string;
  employeeCode: string;
  biometricFaceId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  fatherHusbandName?: string;
  dateOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact?: string;
  dateOfJoining: string;
  grade?: string;
  employmentType: EmploymentType;
  reportingManagerId?: string;
  workStatus: WorkStatus;
  
  // Bank & Statutory
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  aadhaarRef?: string;
  uanNumber?: string;
  esicNumber?: string;
  pfApplicable: boolean;
  esicApplicable: boolean;
  ptApplicable: boolean;
  tdsApplicable: boolean;
  salaryStructureType: string;

  // Status & Exit
  status: EmployeeStatus;
  exitDate?: string;
  exitReason?: string;
  faceEnrolled: boolean;

  // Joined fields
  unitName?: string;
  departmentName?: string;
  designationTitle?: string;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'AADHAAR' | 'PAN' | 'BANK_PROOF' | 'JOINING_LETTER' | 'APPOINTMENT_LETTER' | 'PHOTO' | 'RESUME' | 'OTHER';
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  verified: boolean;
  verifiedBy?: string;
  createdAt: string;
}

// ============================================================================
// FACE RECOGNITION & BIOMETRICS
// ============================================================================
export interface FaceEnrollment {
  id: string;
  employeeId: string;
  encryptedEmbedding: string;
  embeddingDimension: number;
  qualityScore: number;
  modelVersion: string;
  deviceInfo?: string;
  enrolledAt: string;
  consentObtained: boolean;
  status: 'ACTIVE' | 'DISABLED' | 'REVOKED';
}

export interface FaceVerificationRequest {
  employeeId: string;
  probeEmbedding: number[];
  qualityScore: number;
  livenessScore?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  deviceId: string;
}

export interface FaceVerificationResult {
  verified: boolean;
  similarityScore: number;
  threshold: number;
  employeeId: string;
  employeeName: string;
  message: string;
}

// ============================================================================
// DEVICE MANAGEMENT
// ============================================================================
export interface Device {
  id: string;
  employeeId: string;
  deviceId: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  registrationDate: string;
  lastActive: string;
  status: 'PENDING' | 'APPROVED' | 'DISABLED' | 'BLOCKED';
  approvedBy?: string;
}

// ============================================================================
// SHIFTS & ATTENDANCE
// ============================================================================
export interface Shift {
  id: string;
  companyId: string;
  name: string;
  code: string;
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyExitThresholdMinutes: number;
  halfDayWorkHours: number;
  fullDayWorkHours: number;
  breakDurationMinutes: number;
  overtimeMinMinutes: number;
  nightShift: boolean;
  crossMidnight: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'WEEKLY_OFF'
  | 'LATE'
  | 'EARLY_EXIT'
  | 'OVERTIME'
  | 'MISSING_PUNCH';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  companyId: string;
  unitId: string;
  shiftId?: string;
  attendanceDate: string; // YYYY-MM-DD
  inTime?: string;
  outTime?: string;
  inTimestamp?: string;
  outTimestamp?: string;
  totalWorkHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  status: AttendanceStatus;
  inLatitude?: number;
  inLongitude?: number;
  inGpsAccuracy?: number;
  outLatitude?: number;
  outLongitude?: number;
  outGpsAccuracy?: number;
  inDeviceId?: string;
  outDeviceId?: string;
  faceVerified: boolean;
  faceSimilarityScore?: number;
  source: 'MOBILE_APP' | 'DESKTOP_MANUAL' | 'BIOMETRIC_DEVICE' | 'SYSTEM_GENERATED';
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED_SYNC';
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  unitName?: string;
  shiftName?: string;
}

export interface OfflinePunchPayload {
  clientEventId: string;
  employeeId: string;
  punchType: 'IN' | 'OUT';
  eventTimestamp: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  deviceId: string;
  faceEmbedding?: number[];
  faceSimilarityScore?: number;
}

// ============================================================================
// LEAVE & OVERTIME
// ============================================================================
export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  daysAllowedPerYear: number;
  isPaid: boolean;
  carryForwardMax: number;
  encashable: boolean;
  requiresApproval: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  year: number;
  totalCredited: number;
  used: number;
  pending: number;
  balance: number;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  companyId: string;
  unitId?: string;
  name: string;
  date: string;
  holidayType: 'NATIONAL' | 'FESTIVAL' | 'OPTIONAL' | 'REGIONAL';
  isPaid: boolean;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string;
  normalHours: number;
  otHours: number;
  otRate: number;
  otAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
}

// ============================================================================
// SALARY & PAYROLL
// ============================================================================
export interface SalaryStructure {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  ctcAnnual: number;
  grossMonthly: number;
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  isActive: boolean;
}

export interface StatutoryRule {
  id: string;
  companyId: string;
  ruleName: string;
  ruleType: 'PF' | 'ESI' | 'PT' | 'TDS';
  applicableState: string;
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  minEligibilityWage: number;
  ruleFormula?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type PayrollPeriodStatus =
  | 'OPEN'
  | 'ATTENDANCE_LOCKED'
  | 'PAYROLL_PROCESSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'LOCKED'
  | 'REOPENED';

export interface PayrollPeriod {
  id: string;
  companyId: string;
  unitId?: string;
  monthYear: string; // e.g. "2026-09"
  startDate: string;
  endDate: string;
  attendanceCutoff: string;
  totalWorkingDays: number;
  status: PayrollPeriodStatus;
  processedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  companyId: string;
  unitId: string;
  employeeCode?: string;
  employeeName?: string;
  departmentName?: string;
  designationTitle?: string;
  workingDays: number;
  presentDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  lopDays: number;
  payableDays: number;
  overtimeHours: number;
  
  // Earnings
  earnedBasic: number;
  earnedHra: number;
  earnedConveyance: number;
  earnedSpecialAllowance: number;
  earnedOtherAllowances: number;
  earnedOvertime: number;
  bonusAmount: number;
  incentivesAmount: number;
  grossEarnings: number;

  // Deductions
  pfEmployee: number;
  pfEmployer: number;
  esicEmployee: number;
  esicEmployer: number;
  professionalTax: number;
  tdsDeduction: number;
  loanDeduction: number;
  advanceDeduction: number;
  lopDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  netSalary: number;
  paymentStatus: 'UNPAID' | 'PROCESSING' | 'PAID' | 'ON_HOLD';
  paymentDate?: string;
}

export interface SalarySlipData {
  company: Company;
  employee: Employee;
  payroll: PayrollRecord;
  monthYear: string;
  slipNumber: string;
  netPayInWords: string;
  generatedAt: string;
}

// ============================================================================
// AUDIT & DASHBOARD METRICS
// ============================================================================
export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  lateToday: number;
  missingPunchesToday: number;
  overtimeEmployeesToday: number;
  currentMonthPayrollTotal: number;
  pendingLeaveApprovals: number;
  pendingRegularizations: number;
  currentPayrollPeriodStatus: PayrollPeriodStatus;
  departmentAttendanceBreakdown: { department: string; count: number; presentRate: number }[];
  attendanceTrend7Days: { date: string; present: number; absent: number; leave: number }[];
}
