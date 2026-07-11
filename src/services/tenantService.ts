import { api } from './apiClient';

export interface Tenant {
    _id: string;
    clientName: string;
    slug?: string;
    email: string;
    mobile?: string;
    projectName: string;
    databaseName: string;
    dbUsername: string;
    dbPassword?: string;
    clusterConnectionString: string;
    status: string;
    createdAt: string;
    amount?: number;
    paidAmount?: number;
    adminPassword?: string;
    storageLimitGB?: number;
    paymentStatus?: 'PENDING' | 'PARTIAL' | 'COMPLETED';
    storageUsedMB?: number;
    documentCount?: number;
    planStartDate?: string;
    planEndDate?: string;
    accountType?: 'live' | 'demo';
    createdBy?: string | { _id: string; fullName: string; email: string };
}

export interface TenantLog {
    _id: string;
    tenantId: string;
    action: string;
    status: string;
    details?: any;
    createdAt: string;
}

export const getTenants = () => api.get('/tenants').then(res => res.data);
export const getDashboardSummary = () => api.get('/tenants/dashboard/summary').then(res => res.data);
export const getTenantBySlug = (slug: string) => api.get(`/tenants/by-slug/${slug}`).then(res => res.data);
export const createTenant = (data: any) => api.post('/tenants', data).then(res => res.data);
export const updateTenant = (id: string, data: any) => api.put(`/tenants/${id}`, data).then(res => res.data);
export const deleteTenant = (id: string) => api.delete(`/tenants/${id}`).then(res => res.data);

export const getTenantLogs = (id: string) => api.get(`/tenants/${id}/logs`).then(res => res.data);
export const updateTenantLog = (tenantId: string, logId: string, data: Partial<TenantLog>) => api.put(`/tenants/${tenantId}/logs/${logId}`, data).then(res => res.data);
export const deleteTenantLog = (tenantId: string, logId: string) => api.delete(`/tenants/${tenantId}/logs/${logId}`).then(res => res.data);

export const getWhatsappSettings = (slug: string) => api.get(`/tenants/${slug}/whatsapp-settings`).then(res => res.data);
export const updateWhatsappSettings = (slug: string, data: any) => api.put(`/tenants/${slug}/whatsapp-settings`, data).then(res => res.data);
export const getWhatsappTemplates = (slug: string) => api.get(`/tenants/${slug}/whatsapp-templates`).then(res => res.data);
export const createWhatsappTemplate = (slug: string, data: any) => api.post(`/tenants/${slug}/whatsapp-templates`, data).then(res => res.data);
export const deleteWhatsappTemplate = (slug: string, templateName: string) => api.delete(`/tenants/${slug}/whatsapp-templates?name=${encodeURIComponent(templateName)}`).then(res => res.data);
export const sendWhatsappReminder = (slug: string, data: any) => api.post(`/tenants/${slug}/whatsapp-send-reminder`, data).then(res => res.data);
export const uploadWhatsappMedia = (slug: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', file.type);
    formData.append('fileLength', String(file.size));
    return api.post(`/tenants/${slug}/whatsapp-upload-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
};

// ─── WhatsApp Chat Panel (com.bot CRM proxy) ──────────────────────────────────
export const getWhatsappChats = (slug: string, page = 1, limit = 1000, search = '') =>
    api.get(`/tenants/${slug}/whatsapp-chats`, { params: { page, limit, search } }).then(res => res.data);

export const getWhatsappChatMessages = (slug: string, chatId: string, page = 1, limit = 20) =>
    api.get(`/tenants/${slug}/whatsapp-chats/${chatId}/messages`, { params: { page, limit, sort: 'newest' } }).then(res => res.data);

export const sendWhatsappChatMessage = (slug: string, chatId: string, data: { to: string; message: string }) =>
    api.post(`/tenants/${slug}/whatsapp-chats/${chatId}/send`, data).then(res => res.data);
