import apiClient from './client';
import type { Shift, CreateShiftRequest } from '../types';

export interface ShiftQueryParams {
  year?: number;
  month?: number;
  employee_id?: number;
  status?: string;
}

export const getShifts = async (params?: ShiftQueryParams): Promise<Shift[]> => {
  const response = await apiClient.get<Shift[]>('/shifts', { params });
  return response.data;
};

export const getMyShifts = async (params?: { year?: number; month?: number }): Promise<Shift[]> => {
  const response = await apiClient.get<Shift[]>('/shifts/my', { params });
  return response.data;
};

export const getShift = async (id: number): Promise<Shift> => {
  const response = await apiClient.get<Shift>(`/shifts/${id}`);
  return response.data;
};

export const createShift = async (data: CreateShiftRequest): Promise<Shift> => {
  const response = await apiClient.post<Shift>('/shifts', data);
  return response.data;
};

export const updateShift = async (id: number, data: CreateShiftRequest): Promise<Shift> => {
  const response = await apiClient.put<Shift>(`/shifts/${id}`, data);
  return response.data;
};

export const deleteShift = async (id: number): Promise<void> => {
  await apiClient.delete(`/shifts/${id}`);
};

export const confirmShifts = async (year: number, month: number): Promise<{ message: string; updatedCount: number }> => {
  const response = await apiClient.put('/shifts/confirm', { year, month });
  return response.data;
};
