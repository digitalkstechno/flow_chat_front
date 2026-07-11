import { api } from './apiClient';

export interface User {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    password?: string;
    createdAt: string;
    isMaster?: boolean;
    role?: 'superadmin' | 'affiliate';
}

export const getUsers = () => api.get('/user').then(res => res.data);
export const createUser = (data: any) => api.post('/user/create', data).then(res => res.data);
export const updateUser = (id: string, data: any) => api.put(`/user/${id}`, data).then(res => res.data);
export const getUserById = (id: string) => api.get(`/user/${id}`).then(res => res.data);
export const deleteUser = (id: string) => api.delete(`/user/${id}`).then(res => res.data);
export const loginUser = (data: any) => api.post('/user/login', data).then(res => res.data);
export const getMe = () => api.get('/user/me').then(res => res.data);
