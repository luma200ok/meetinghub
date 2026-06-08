// ---- 공통 ----
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type ReservationStatus = 'RESERVED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

// ---- 회사 / 조직 ----
export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  parentId?: string;
}

export interface Position {
  id: string;
  companyId: string;
  name: string;
  level: number;
}

export interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  departmentId?: string;
  positionId?: string;
  role: 'ADMIN' | 'MEMBER';
}

// ---- 회의실 & 예약 ----
export interface MeetingRoom {
  id: string;
  companyId: string;
  name: string;
  location: string;
  capacity: number;
}

export interface Reservation {
  id: string;
  roomId: string;
  title: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  organizerId: string;
}

// ---- 회의록 & AI ----
export interface MeetingMinute {
  id: string;
  reservationId: string;
  content: string;
  createdById: string;
  createdAt: string;
}

export interface AiSummary {
  id: string;
  minuteId: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  risks: string[];
  createdAt: string;
}

// ---- 업무 ----
export interface ActionItem {
  id: string;
  minuteId: string;
  assigneeId: string;
  task: string;
  dueDate: string;
  status: TaskStatus;
}

// ---- 알림 ----
export interface Notification {
  id: string;
  userId: string;
  type: 'MEETING_REMINDER' | 'TASK_ASSIGNED' | 'INVITE';
  message: string;
  isRead: boolean;
  createdAt: string;
}
