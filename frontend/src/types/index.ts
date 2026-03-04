export type Role = 'admin' | 'employee';
export type ShiftStatus = 'confirmed' | 'unconfirmed';
export type Availability = 'available' | 'unavailable' | 'negotiable';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Shift {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
}

export interface ShiftRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  availability: Availability;
  preferredStart: string | null;
  preferredEnd: string | null;
  note: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateEmployeeRequest {
  name: string;
  email: string;
  role: Role;
}

export interface CreateShiftRequest {
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface CreateShiftRequestReq {
  date: string;
  availability: Availability;
  preferredStart: string | null;
  preferredEnd: string | null;
  note: string;
}
