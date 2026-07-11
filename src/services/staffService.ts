import { api } from './apiClient';

export interface Staff {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
}

const staffBase = (slug: string) => `/tenants/${slug}/staff`;

export const getTenantStaff = (slug: string) =>
    api.get(staffBase(slug)).then(res => res.data);

export const createTenantStaff = (slug: string, data: any) => api.post(`/tenants/${slug}/staff/create`, data).then(res => res.data);
export const updateTenantStaff = (slug: string, staffId: string, data: any) => api.put(`/tenants/${slug}/staff/${staffId}`, data).then(res => res.data);
export const deleteTenantStaff = (slug: string, staffId: string) => api.delete(`/tenants/${slug}/staff/${staffId}`).then(res => res.data);

export const staffLogin = (slug: string, data: { email: string; password: string }) =>
    api.post(`${staffBase(slug)}/login`, data).then(res => res.data);

export const getStaffProfile = (slug: string) =>
    api.get(`${staffBase(slug)}/me`).then(res => res.data);

export const impersonateStaff = (slug: string) =>
    api.post(`${staffBase(slug)}/impersonate`).then(res => res.data);

export const forgotPassword = (slug: string, data: { email: string }) =>
    api.post(`${staffBase(slug)}/forgot-password`, data).then(res => res.data);
