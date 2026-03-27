
export interface EnrolledClass {
  classId: string;
  name: string;
  price: number;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  WARNING = 'WARNING'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  subscription_start_date?: string; // ISO Date string
  subscription_end_date?: string; // ISO Date string
  enrolled_classes?: string[]; // Array of Class IDs
  qr_code_hash: string;
  avatar?: string;
  notes?: string;
  amount?: number;
  durationDays?: number;
  createdAt?: string;
  updated_at?: string;
}

export enum SupportMessageType {
  PAYMENT_PROOF = 'PAYMENT_PROOF',
  GENERAL_SUPPORT = 'GENERAL_SUPPORT'
}

export enum SupportMessageStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface SupportMessage {
  id: string;
  user_id: string;
  type: SupportMessageType;
  content?: string;
  attachment_url?: string;
  status: SupportMessageStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface GymClass {
  id: string;
  name: string;
  instructor: string;
  startTime: string; // HH:mm
  duration: string; // e.g., "60 min"
  maxSpots: number;
  weekDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  price: number; // Default price
  createdAt?: string;
}

export interface UserStatusData {
  status: UserStatus;
  daysRemaining: number;
  color: string;
  label: string;
  timeString: string; // New field for "32h 15m" or "15 Dias"
}