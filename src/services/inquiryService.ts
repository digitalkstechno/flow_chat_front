import { api } from './apiClient';

export interface Inquiry {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    status: 'new' | 'resolved';
    createdAt: string;
    updatedAt: string;
}

export const createInquiry = (data: { name: string; email: string; phone?: string; message: string }) =>
    api.post('/inquiries', data).then((res) => res.data);

export const getInquiries = () =>
    api.get('/inquiries').then((res) => res.data);

export const resolveInquiry = (id: string) =>
    api.put(`/inquiries/${id}/resolve`).then((res) => res.data);

export const deleteInquiry = (id: string) =>
    api.delete(`/inquiries/${id}`).then((res) => res.data);
