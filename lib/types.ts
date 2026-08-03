// ─── Customer domain types ────────────────────────────────────────────────────

export interface Customer {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  dniNie?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  profileImageUrl?: string;
  active: boolean;
  createdAt: string;
  activeVoucherCount: number;
}

export interface CustomerListResponse {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface Note {
  id: number;
  customerId: number;
  text: string;
  createdBy?: string;
  createdAt: string;
}

// ─── Service domain types ─────────────────────────────────────────────────────

export interface Service {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  category?: string;
  durationMinutes?: number;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  category?: string;
  durationMinutes?: number;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  active?: boolean;
  category?: string;
  durationMinutes?: number;
}

// ─── Calendar / Sessions domain types ────────────────────────────────────────

export interface ClassSession {
  id: number;
  serviceId: number;
  name: string;
  instructorId: number | null;
  instructorName: string | null;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  enrolledCount: number;
  availableSpots: number;
  hasFixedEnrollments: boolean;
  notes: string;
  color: string;
  active: boolean;
  createdAt?: string;
  recurring?: boolean;
  recurringSeriesId?: string | null;
}

export type EnrollmentType = "FIXED" | "OCCASIONAL";

export interface Enrollment {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  enrollmentType: EnrollmentType;
  recurrenceKey: string | null;
  customerVoucherId: number | null;
  voucherPaid: boolean | null;
  attended: boolean | null;
  createdAt: string;
}

export interface ClassSessionDetail extends ClassSession {
  enrollments: Enrollment[];
  waitlist?: WaitlistEntry[];
}

export interface WaitlistEntry {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  classSessionId: number;
  createdAt: string;
}

export interface CreateSessionPayload {
  serviceId: number;
  instructorId?: number | null;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  notes?: string;
  recurring?: boolean;
  color?: string;
}

export interface CreateSessionResponse extends ClassSession {
  generatedCount: number;
}

export interface UpdateSessionPayload {
  serviceId?: number;
  instructorId?: number | null;
  startDateTime?: string;
  endDateTime?: string;
  maxCapacity?: number;
  notes?: string;
  color?: string;
  /** @deprecated Use serviceId instead. Kept for compatibility with existing edit modal. */
  name?: string;
}

export interface AddEnrollmentPayload {
  customerId: number;
  enrollmentType: EnrollmentType;
}

export interface AddEnrollmentResponse {
  id: number;
  customerId: number;
  classSessionId: number;
  enrollmentType: EnrollmentType;
  recurrenceKey: string | null;
  createdAt: string;
  generatedCount: number;
}

export type EnrollmentStatusFilter = "all" | "upcoming" | "attended" | "no-show";

export interface CustomerEnrollmentResponse {
  id: number;
  classSessionId: number;
  sessionName: string;
  startDateTime: string;
  endDateTime: string;
  enrollmentType: EnrollmentType;
  attended: boolean | null;
  customerVoucherId: number | null;
  createdAt: string;
}

export interface CustomerEnrollmentListResponse {
  content: CustomerEnrollmentResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
}

// ─── Voucher domain types ─────────────────────────────────────────────────────

export type VoucherStatus = "ACTIVE" | "FINISHED" | "EXPIRED";
export type VoucherPlanType = "CREDITS" | "MONTHLY";

/** Voucher template — no customer data */
export interface VoucherTemplate {
  id: number;
  serviceId: number;
  serviceName: string;
  name: string;
  planType: VoucherPlanType;
  totalCredits?: number | null;
  maxSessionsPerWeek: number | null;
  maxSessionsPerMonth: number | null;
  recoverySessions: number | null;
  cancellationHours: number | null;
  pricePerSession: number | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

/** Assignment of a voucher template to a customer for a specific month */
export interface CustomerVoucherResponse {
  id: number;
  voucherId: number;
  voucherName: string;
  serviceId: number;
  serviceName: string;
  planType: VoucherPlanType;
  customerId: number;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  fixedDays?: string[];
  totalSessions: number;
  consumed: number;
  upcoming: number;
  purchaseDate: string;
  expirationDate: string;
  status: VoucherStatus;
  paid: boolean;
  paymentId?: number | null;
  createdAt: string;
}

/** Keep for backward compat — maps to the old shape still used by some pages */
export interface VoucherResponse {
  id: number;
  customerId: number | null;
  customerName: string;
  serviceId: number;
  serviceName: string;
  creditsTotal: number;
  creditsRemaining: number;
  status: VoucherStatus;
  purchasedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  planType: VoucherPlanType;
  maxSessionsPerWeek?: number | null;
  maxSessionsPerMonth?: number | null;
  recoverySessions?: number | null;
  cancellationHours?: number | null;
  pricePerSession?: number | null;
}

export interface CreateVoucherPayload {
  serviceId: number;
  totalCredits?: number | null;
  name?: string;
  planType?: VoucherPlanType;
  maxSessionsPerWeek?: number | null;
  maxSessionsPerMonth?: number | null;
  recoverySessions?: number | null;
  cancellationHours?: number | null;
  pricePerSession?: number | null;
}

export interface UpdateVoucherPayload {
  name?: string;
  planType?: VoucherPlanType;
  totalCredits?: number | null;
  maxSessionsPerWeek?: number | null;
  maxSessionsPerMonth?: number | null;
  recoverySessions?: number | null;
  cancellationHours?: number | null;
  pricePerSession?: number | null;
  active?: boolean;
}

export interface AssignVoucherPayload {
  customerId: number;
  periodYear?: number;
  periodMonth?: number;
  fixedDays?: string[];
  startDate?: string; // YYYY-MM-DD, for CREDITS type
  endDate?: string;   // YYYY-MM-DD, for CREDITS type
}

export interface UpdateCustomerVoucherPayload {
  startDate?: string;    // CREDITS: YYYY-MM-DD
  endDate?: string;      // CREDITS: YYYY-MM-DD
  periodYear?: number;   // MONTHLY
  periodMonth?: number;  // MONTHLY
  fixedDays?: string[];  // MONTHLY
  paid?: boolean;        // Manual payment flag
  paymentId?: number | null; // Payment link from finance
}

// ─── Finance domain types ─────────────────────────────────────────────────────

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "BIZUM";
export type CashRegisterStatus = "OPEN" | "CLOSED";

export interface CashRegister {
  id: number;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  finalAmount: number | null;
  status: CashRegisterStatus;
  paymentCount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  customerId: number;
  customerName: string;
  voucherId: number | null;
  serviceName: string | null;
  cashRegisterId: number | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes: string | null;
  active: boolean;
  cancelled: boolean;
  invoiceNumber?: string | null;
  creditNoteNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPayload {
  customerId: number;
  voucherId?: number | null;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  paymentDate?: string;
}

export interface OpenCashRegisterPayload {
  initialAmount: number;
}

export interface CloseCashRegisterPayload {
  finalAmount: number;
}

// ─── Studio settings ──────────────────────────────────────────────────────────

export type CalendarDays = "MON_SUN" | "MON_SAT" | "MON_FRI";

export interface StudioSettings {
  studioName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  schedule: string;
  instagram: string;
  facebook: string;
  updatedAt: string;
  calendarDays?: CalendarDays;
  workHourStart?: number;
  workHourEnd?: number;
  cif?: string;
  entityType?: string;
  taxName?: string;
  taxRate?: number;
  accountNumber?: string;
  ticketPrefix?: string;
  companyName?: string;
  billingAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  logoUrl?: string;
}

export interface UpdateSettingsPayload {
  studioName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  schedule: string;
  instagram: string;
  facebook: string;
  calendarDays?: CalendarDays;
  workHourStart?: number;
  workHourEnd?: number;
  cif?: string;
  entityType?: string;
  taxName?: string;
  taxRate?: number;
  accountNumber?: string;
  ticketPrefix?: string;
  companyName?: string;
  billingAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  logoUrl?: string;
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export interface HolidayResponse {
  id: number;
  date: string;      // "YYYY-MM-DD"
  name: string;
  createdAt: string;
}
