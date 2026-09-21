import { z } from 'zod';

// ============================================================================
// AUTH & LOGIN
// ============================================================================
export const LoginSchema = z.object({
  companyCode: z.string().min(2, 'Company code is required').max(50),
  usernameOrEmail: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
  deviceId: z.string().optional()
}).transform((data) => ({
  ...data,
  usernameOrEmail: (data.usernameOrEmail || data.username || data.email || '').trim()
})).refine((data) => data.usernameOrEmail.length >= 3, {
  message: 'Username or Email is required',
  path: ['usernameOrEmail']
});

export const MobileLoginSchema = z.object({
  companyCode: z.string().min(2, 'Company code is required').max(50),
  employeeCodeOrMobile: z.string().min(3, 'Employee code or Mobile is required'),
  pinOrPassword: z.string().min(4, 'PIN or Password is required'),
  deviceId: z.string().min(4, 'Device ID is required'),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional()
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required')
});

// ============================================================================
// COMPANY & UNIT
// ============================================================================
export const CompanySchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, numbers, hyphen and underscore only'),
  name: z.string().min(2).max(255),
  legalName: z.string().min(2).max(255),
  address: z.string().min(5),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  tan: z.string().regex(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, 'Invalid TAN format').optional().or(z.literal('')),
  cin: z.string().optional().or(z.literal('')),
  phone: z.string().min(10).max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  financialYear: z.string().default('2026-2027'),
  payrollCycle: z.enum(['MONTHLY', 'BI_WEEKLY', 'WEEKLY']).default('MONTHLY'),
  timezone: z.string().default('Asia/Kolkata'),
  currency: z.string().default('INR')
});

export const UnitSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  location: z.string().min(2).max(255),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().min(10).max(10000).default(100),
  geofenceEnabled: z.boolean().default(true)
});

// ============================================================================
// EMPLOYEE MASTER
// ============================================================================
export const EmployeeCreateSchema = z.object({
  companyId: z.string().uuid(),
  unitId: z.string().uuid(),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  employeeCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, 'Alphanumeric employee code only'),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').max(100),
  fatherHusbandName: z.string().max(255).optional().or(z.literal('')),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).default('SINGLE'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a valid 10-digit number'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(3),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  emergencyContact: z.string().optional().or(z.literal('')),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  grade: z.string().max(50).optional().or(z.literal('')),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  reportingManagerId: z.string().uuid().optional().nullable(),
  workStatus: z.enum(['OFFICE', 'REMOTE', 'HYBRID', 'FIELD']).default('OFFICE'),

  // Bank & Statutory Details
  bankName: z.string().max(100).optional().or(z.literal('')),
  accountNumber: z.string().max(50).optional().or(z.literal('')),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC Code').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number').optional().or(z.literal('')),
  aadhaarRef: z.string().max(50).optional().or(z.literal('')),
  uanNumber: z.string().regex(/^[0-9]{12}$/, 'UAN must be 12 digits').optional().or(z.literal('')),
  esicNumber: z.string().regex(/^[0-9]{17}$/, 'ESIC must be 17 digits').optional().or(z.literal('')),
  pfApplicable: z.boolean().default(true),
  esicApplicable: z.boolean().default(true),
  ptApplicable: z.boolean().default(true),
  tdsApplicable: z.boolean().default(false),
  salaryStructureType: z.string().default('STANDARD'),

  // Initial Salary Setup (Optional during creation)
  ctcAnnual: z.number().min(0).optional().default(0),
  grossMonthly: z.number().min(0).optional().default(0),
  basic: z.number().min(0).optional().default(0),
  hra: z.number().min(0).optional().default(0),
  conveyance: z.number().min(0).optional().default(0),
  specialAllowance: z.number().min(0).optional().default(0),
  medicalAllowance: z.number().min(0).optional().default(0)
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

// ============================================================================
// FACE ENROLLMENT & VERIFICATION
// ============================================================================
export const FaceEnrollmentSchema = z.object({
  employeeId: z.string().uuid(),
  embedding: z.array(z.number()).min(128, 'Vector must be at least 128 dimensions'),
  qualityScore: z.number().min(0.5, 'Face quality score must be at least 0.5'),
  modelVersion: z.string().default('mediapipe-facemesh-v1'),
  deviceInfo: z.string().optional(),
  consentObtained: z.literal(true, { errorMap: () => ({ message: 'Biometric consent is mandatory' }) })
});

export const FaceVerifySchema = z.object({
  employeeId: z.string().uuid(),
  probeEmbedding: z.array(z.number()).min(128),
  qualityScore: z.number().min(0.5),
  livenessScore: z.number().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().optional(),
  deviceId: z.string().min(1)
});

// ============================================================================
// ATTENDANCE & PUNCH
// ============================================================================
export const AttendancePunchSchema = z.object({
  employeeId: z.string().uuid(),
  punchType: z.enum(['IN', 'OUT']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  gpsAccuracy: z.number().optional(),
  deviceId: z.string().min(1),
  timestamp: z.string().optional(), // ISO string from device
  faceEmbedding: z.array(z.number()).optional(),
  faceSimilarityScore: z.number().optional(),
  clientEventId: z.string().optional()
});

export const AttendanceSyncBatchSchema = z.object({
  punches: z.array(
    z.object({
      clientEventId: z.string().min(1),
      employeeId: z.string().uuid(),
      punchType: z.enum(['IN', 'OUT']),
      eventTimestamp: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      gpsAccuracy: z.number().optional(),
      deviceId: z.string().min(1),
      faceSimilarityScore: z.number().optional()
    })
  ).min(1, 'At least one punch event required for sync')
});

export const AttendanceRegularizationSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  correctionType: z.enum(['MISSING_IN', 'MISSING_OUT', 'WRONG_PUNCH', 'SHIFT_CORRECTION', 'FULL_ATTENDANCE']),
  requestedInTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  requestedOutTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  reason: z.string().min(5, 'Detailed reason is required')
});

// ============================================================================
// LEAVE & SHIFTS
// ============================================================================
export const LeaveApplySchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(5, 'Reason is required')
});

export const ShiftSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  gracePeriodMinutes: z.number().min(0).max(120).default(15),
  lateThresholdMinutes: z.number().min(0).max(180).default(30),
  earlyExitThresholdMinutes: z.number().min(0).max(180).default(30),
  halfDayWorkHours: z.number().min(1).max(12).default(4.0),
  fullDayWorkHours: z.number().min(4).max(16).default(8.0),
  breakDurationMinutes: z.number().min(0).max(180).default(60),
  overtimeMinMinutes: z.number().min(0).max(300).default(60),
  nightShift: z.boolean().default(false),
  crossMidnight: z.boolean().default(false)
});

// ============================================================================
// PAYROLL ENGINE
// ============================================================================
export const PayrollGenerateSchema = z.object({
  companyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM (e.g. 2026-09)'),
  totalWorkingDays: z.number().int().min(20).max(31).default(30),
  attendanceCutoff: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const PayrollActionSchema = z.object({
  payrollPeriodId: z.string().uuid(),
  action: z.enum(['CHECK', 'SUBMIT', 'APPROVE', 'LOCK', 'REOPEN']),
  comments: z.string().optional()
});
