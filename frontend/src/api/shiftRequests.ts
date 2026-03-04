import apiClient from './client';
import type { ShiftRequest, CreateShiftRequestReq } from '../types';

export interface ShiftRequestQueryParams {
  year?: number;
  month?: number;
  employee_id?: number;
}

export const getShiftRequests = async (params?: ShiftRequestQueryParams): Promise<ShiftRequest[]> => {
  const response = await apiClient.get<ShiftRequest[]>('/shift-requests', { params });
  return response.data;
};

export const getMyShiftRequests = async (params?: { year?: number; month?: number }): Promise<ShiftRequest[]> => {
  const response = await apiClient.get<ShiftRequest[]>('/shift-requests/my', { params });
  return response.data;
};

export const createShiftRequest = async (data: CreateShiftRequestReq): Promise<ShiftRequest> => {
  const response = await apiClient.post<ShiftRequest>('/shift-requests', data);
  return response.data;
};

export const updateShiftRequest = async (id: number, data: Omit<CreateShiftRequestReq, 'date'>): Promise<ShiftRequest> => {
  const response = await apiClient.put<ShiftRequest>(`/shift-requests/${id}`, data);
  return response.data;
};

export const deleteShiftRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`/shift-requests/${id}`);
};
