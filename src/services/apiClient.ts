import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        let token = localStorage.getItem('token');
        
        const url = config.url || '';
        let slug = '';
        
        // Try matching `/tenants/by-slug/:slug` first
        const bySlugMatch = url.match(/^\/?tenants\/by-slug\/([^/]+)/);
        if (bySlugMatch && bySlugMatch[1]) {
            slug = bySlugMatch[1];
        } else {
            // Fall back to matching `/tenants/:slug`
            const tenantMatch = url.match(/^\/?tenants\/([^/]+)/);
            if (tenantMatch && tenantMatch[1] && tenantMatch[1] !== 'by-slug') {
                slug = tenantMatch[1];
            }
        }

        if (slug) {
            const isSuperadminPage = window.location.pathname.startsWith('/superadmin');
            const isImpersonateRequest = url.includes('/staff/impersonate');
            
            if (!isSuperadminPage && !isImpersonateRequest) {
                const tenantToken = localStorage.getItem(`staff_token_${slug}`);
                if (tenantToken) {
                    token = tenantToken;
                }
            }
        }
        
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                const pathname = window.location.pathname;
                if (!pathname.endsWith('/login')) {
                    const match = pathname.match(/^\/([^/]+)/);
                    if (match && match[1]) {
                        const firstSegment = match[1];
                        if (firstSegment === 'superadmin') {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/superadmin/login';
                        } else {
                            localStorage.removeItem(`staff_token_${firstSegment}`);
                            localStorage.removeItem(`staff_user_${firstSegment}`);
                            window.location.href = `/${firstSegment}/login`;
                        }
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);
