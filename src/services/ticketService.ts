import { api } from './apiClient';

export interface Ticket {
    _id: string;
    tenantSlug: string;
    tenantName: string;
    subject: string;
    description: string;
    status: 'open' | 'resolved';
    raisedBy: string;
    createdAt: string;
    updatedAt: string;
    dealer?: { _id: string; fullName: string; email: string } | null;
}

export const createTicket = (slug: string, data: { subject: string; description: string }) =>
    api.post(`/tenants/${slug}/tickets`, data).then(res => res.data);

export const getTenantTickets = (slug: string) =>
    api.get(`/tenants/${slug}/tickets`).then(res => res.data);

export const getAllTickets = () =>
    api.get('/tickets').then(res => res.data);

export const resolveTicket = (id: string) =>
    api.put(`/tickets/${id}/resolve`).then(res => res.data);

export const deleteTicket = (id: string) =>
    api.delete(`/tickets/${id}`).then(res => res.data);
