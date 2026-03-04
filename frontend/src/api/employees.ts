import apiClient from './client';
import type { User, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';

export const getEmployees = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/employees');
  return response.data;
};

export const getEmployee = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: CreateEmployeeRequest): Promise<User> => {
  const response = await apiClient.post<User>('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: number, data: UpdateEmployeeRequest): Promise<User> => {
  const response = await apiClient.put<User>(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};
