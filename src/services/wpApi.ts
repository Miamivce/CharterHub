import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { envConfig } from './envValidator';

// Error Types
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public errors: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Types
interface UserRegistrationData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    company?: string;
    inviteToken?: string;
}

interface UserProfileData {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    company?: string;
    role: 'admin' | 'customer';
    verified: boolean;
}

interface PasswordResetData {
    email: string;
    token?: string;
    newPassword?: string;
}

interface AdminUserListParams {
    page?: number;
    perPage?: number;
    search?: string;
    role?: 'admin' | 'customer';
}

interface AdminInviteUserData {
    email: string;
    role: 'admin' | 'customer';
    firstName: string;
    lastName: string;
    bookingId?: number;
}

// Booking Types
interface BookingData {
    id?: number;
    title: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    userId?: number;
    vesselId?: number;
    details?: string;
    totalPrice?: number;
    depositAmount?: number;
    depositPaid?: boolean;
    documents?: number[]; // Document IDs
}

interface BookingListParams {
    page?: number;
    perPage?: number;
    status?: BookingData['status'];
    userId?: number;
    vesselId?: number;
    startDate?: string;
    endDate?: string;
}

interface BookingDocumentData {
    bookingId: number;
    documentId: number;
    type: 'contract' | 'invoice' | 'passport' | 'captain_details' | 'itinerary' | 'crew_profile' | 
          'sample_menu' | 'preference_sheet' | 'payment_overview' | 'brochure' | 'proposal' | 'receipt' | 'other';
    notes?: string;
}

// User Statistics Types
interface UserStatistics {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    lastBookingDate: string | null;
    documentsSubmitted: number;
    memberSince: string;
}

interface UserActivityLog {
    id: number;
    userId: number;
    action: 'login' | 'signup' | 'booking_created' | 'booking_updated' | 'document_uploaded' | 'profile_updated' | 'password_changed';
    details: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}

interface ActivityLogParams {
    page?: number;
    perPage?: number;
    userId?: number;
    action?: UserActivityLog['action'];
    startDate?: string;
    endDate?: string;
}

interface UserStatsParams {
    startDate?: string;
    endDate?: string;
}

// Analytics Types
interface BookingAnalytics {
    revenue: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        trend: Array<{
            date: string;
            amount: number;
        }>;
    };
    bookings: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        trend: Array<{
            date: string;
            status: BookingData['status'];
            count: number;
        }>;
    };
    vessels: Array<{
        id: number;
        name: string;
        bookingCount: number;
        revenue: number;
        occupancyRate: number;
    }>;
    seasonality: Array<{
        month: number;
        bookingCount: number;
        revenue: number;
        occupancyRate: number;
    }>;
    customerSegments: Array<{
        segment: string;
        customerCount: number;
        bookingCount: number;
        revenue: number;
    }>;
}

interface DocumentAnalytics {
    documents: {
        total: number;
        byType: Record<BookingDocumentData['type'], number>;
        trend: Array<{
            date: string;
            count: number;
        }>;
    };
    storage: {
        totalSize: number;
        byType: Record<BookingDocumentData['type'], number>;
        trend: Array<{
            date: string;
            size: number;
        }>;
    };
    processing: {
        averageUploadTime: number;
        failureRate: number;
        commonErrors: Array<{
            error: string;
            count: number;
        }>;
    };
    compliance: {
        missingRequired: Array<{
            bookingId: number;
            documentType: BookingDocumentData['type'];
            daysOverdue: number;
        }>;
        expiringDocuments: Array<{
            documentId: number;
            type: BookingDocumentData['type'];
            expiryDate: string;
            daysUntilExpiry: number;
        }>;
    };
}

interface AnalyticsParams {
    startDate?: string;
    endDate?: string;
    vesselId?: number;
    granularity?: 'day' | 'week' | 'month';
}

// Retry configuration
const MAX_RETRIES = parseInt(import.meta.env.VITE_MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000');

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry helper
const retryRequest = async (
    requestFn: () => Promise<any>,
    retries: number = MAX_RETRIES,
    currentAttempt: number = 0
): Promise<any> => {
    try {
        return await requestFn();
    } catch (error) {
        if (error instanceof ApiError) {
            // Don't retry on these status codes
            if ([400, 401, 403, 404, 422].includes(error.status || 0)) {
                throw error;
            }
            
            // Retry on rate limit with exponential backoff
            if (error.status === 429 && currentAttempt < retries) {
                const waitTime = RETRY_DELAY * Math.pow(2, currentAttempt);
                await delay(waitTime);
                return retryRequest(requestFn, retries, currentAttempt + 1);
            }
        }
        throw error;
    }
};

// Role validation
const requireAdmin = async () => {
    try {
        const user = await api.getCurrentUser();
        if (user.role !== 'admin') {
            throw new ApiError('Admin access required', 403, 'forbidden');
        }
    } catch (error) {
        throw new ApiError('Admin access required', 403, 'forbidden');
    }
};

// Validation Functions
const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    }
    return errors;
};

const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!password) {
        errors.push('Password is required');
    } else {
        if (password.length < 8) errors.push('Password must be at least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
        if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain a special character');
    }
    return errors;
};

const validateName = (name: string, field: string): string[] => {
    const errors: string[] = [];
    if (!name) {
        errors.push(`${field} is required`);
    } else if (name.length < 2) {
        errors.push(`${field} must be at least 2 characters`);
    }
    return errors;
};

// Create axios instance with default config
const wpApi = axios.create({
    baseURL: envConfig.AUTH_API_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
    },
    withCredentials: true
});

// Add authentication headers
wpApi.interceptors.request.use((config) => {
    // Get the token from sessionStorage to match login storage
    const token = sessionStorage.getItem('auth_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    
    console.log('[wpApi] Request interceptor state:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasRefreshToken: !!refreshToken,
        contentType: config.headers['Content-Type'],
        timestamp: new Date().toISOString()
    });
    
    if (!token) {
        console.warn('[wpApi] No auth token found in sessionStorage');
        return config;
    }

    // Validate token format
    try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error('[wpApi] Invalid token format - expected 3 parts, got:', tokenParts.length);
            // Clear invalid token
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('refresh_token');
        } else {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[wpApi] Added valid JWT token to request headers');
            
            // Log token parts lengths for debugging (without exposing the actual token)
            console.debug('[wpApi] Token structure:', {
                header: tokenParts[0].length,
                payload: tokenParts[1].length,
                signature: tokenParts[2].length
            });
        }
    } catch (error) {
        console.error('[wpApi] Token validation error:', error);
    }

    // Add CSRF token if available
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        console.log('[wpApi] Added CSRF token to request');
    }

    // Log the complete request configuration
    console.log('[wpApi] Final request configuration:', {
        url: config.url,
        method: config.method,
        headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? 'Bearer [REDACTED]' : 'none'
        },
        hasData: !!config.data,
        dataKeys: config.data ? Object.keys(config.data) : []
    });

    return config;
}, (error) => {
    console.error('[wpApi] Request interceptor error:', error);
    return Promise.reject(error);
});

// Enhanced error handling interceptor
wpApi.interceptors.response.use(
    (response) => {
        console.log('[wpApi] Response success:', {
            url: response.config.url,
            method: response.config.method,
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            hasTokens: !!(response.data && response.data.tokens),
            timestamp: new Date().toISOString()
        });

        // If response includes new tokens, update them in sessionStorage
        if (response.data && response.data.tokens) {
            console.log('[wpApi] Updating tokens in sessionStorage from response');
            sessionStorage.setItem('auth_token', response.data.tokens.access_token);
            sessionStorage.setItem('refresh_token', response.data.tokens.refresh_token);
            
            // Verify token storage
            const storedToken = sessionStorage.getItem('auth_token');
            console.log('[wpApi] Token storage verification:', {
                tokenUpdated: !!storedToken,
                tokenLength: storedToken ? storedToken.length : 0,
                timestamp: new Date().toISOString()
            });
        }

        return response;
    },
    async (error) => {
        console.error('[wpApi] Response error details:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            errorMessage: error.message,
            hasResponse: !!error.response,
            hasResponseData: !!(error.response?.data),
            timestamp: new Date().toISOString()
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
            console.error('[wpApi] Authentication error - clearing tokens from sessionStorage');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('refresh_token');
            
            // Log auth state after clearing
            console.debug('[wpApi] Auth state after 401:', {
                hasToken: !!sessionStorage.getItem('auth_token'),
                hasRefreshToken: !!sessionStorage.getItem('refresh_token'),
                originalUrl: error.config?.url,
                timestamp: new Date().toISOString()
            });
        }

        if (error.response) {
            // Extract detailed error information
            const errorDetails = {
                message: error.response.data?.message || 'Server error',
                code: error.response.data?.code || 'unknown_error',
                errors: error.response.data?.errors || {},
                status: error.response.status
            };

            console.error('[wpApi] Structured error details:', {
                ...errorDetails,
                timestamp: new Date().toISOString()
            });

            throw new ApiError(
                errorDetails.message,
                errorDetails.status,
                errorDetails.code,
                errorDetails.errors
            );
        } else if (error.request) {
            console.error('[wpApi] Network error - no response received:', {
                url: error.config?.url,
                method: error.config?.method,
                timestamp: new Date().toISOString()
            });
            throw new ApiError('No response from server', 0, 'network_error');
        } else {
            console.error('[wpApi] Request setup error:', {
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw new ApiError(error.message, 0, 'request_error');
        }
    }
);

// API methods
export const api = {
    // User Management
    async registerUser(data: UserRegistrationData) {
        // Validate input
        const errors: Record<string, string[]> = {
            email: validateEmail(data.email),
            password: validatePassword(data.password),
            firstName: validateName(data.firstName, 'First name'),
            lastName: validateName(data.lastName, 'Last name'),
        };

        // Filter out empty error arrays
        const validationErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v.length > 0)
        );

        if (Object.keys(validationErrors).length > 0) {
            throw new ValidationError('Validation failed', validationErrors);
        }

        return retryRequest(async () => {
            const response = await wpApi.post('/charterhub/v1/users/register', {
                email: data.email,
                password: data.password,
                first_name: data.firstName,
                last_name: data.lastName,
                phone_number: data.phoneNumber,
                company: data.company,
                invite_token: data.inviteToken
            });
            return response.data;
        });
    },

    async verifyEmail(token: string) {
        if (!token) {
            throw new ValidationError('Validation failed', {
                token: ['Verification token is required']
            });
        }

        try {
            const response = await wpApi.post('/charterhub/v1/users/verify-email', { token });
            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to verify email', 500);
        }
    },

    async requestPasswordReset(data: PasswordResetData) {
        const emailErrors = validateEmail(data.email);
        if (emailErrors.length > 0) {
            throw new ValidationError('Validation failed', { email: emailErrors });
        }

        try {
            const response = await wpApi.post('/charterhub/v1/users/reset-password-request', {
                email: data.email
            });
            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to request password reset', 500);
        }
    },

    async resetPassword(data: PasswordResetData) {
        const errors: Record<string, string[]> = {};
        
        if (!data.token) {
            errors.token = ['Reset token is required'];
        }
        if (data.newPassword) {
            errors.password = validatePassword(data.newPassword);
        } else {
            errors.password = ['New password is required'];
        }

        if (Object.keys(errors).length > 0) {
            throw new ValidationError('Validation failed', errors);
        }

        try {
            const response = await wpApi.post('/charterhub/v1/users/reset-password', {
                token: data.token,
                new_password: data.newPassword
            });
            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to reset password', 500);
        }
    },

    async updateProfile(userId: number, data: Partial<UserProfileData>) {
        // Validate user ID
        if (!userId || userId <= 0) {
            console.error('[wpApi] Invalid user ID:', userId);
            throw new ValidationError('Validation failed', {
                userId: ['Invalid user ID']
            });
        }

        const errors: Record<string, string[]> = {};

        // Validate all provided fields
        if (data.email !== undefined) {
            errors.email = validateEmail(data.email);
        }
        if (data.firstName !== undefined) {
            errors.firstName = validateName(data.firstName, 'First name');
        }
        if (data.lastName !== undefined) {
            errors.lastName = validateName(data.lastName, 'Last name');
        }
        if (data.phoneNumber !== undefined && data.phoneNumber !== '') {
            // Basic phone number validation
            if (!/^\+?[\d\s-()]+$/.test(data.phoneNumber)) {
                errors.phoneNumber = ['Invalid phone number format'];
            }
        }

        const validationErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v.length > 0)
        );

        if (Object.keys(validationErrors).length > 0) {
            console.error('[wpApi] Profile update validation errors:', validationErrors);
            throw new ValidationError('Validation failed', validationErrors);
        }

        try {
            // Check if we have an auth token before making the request
            const token = sessionStorage.getItem('auth_token');
            if (!token) {
                console.error('[wpApi] No auth token available for profile update');
                throw new ApiError('Authentication required', 401, 'no_auth_token');
            }

            console.log('[wpApi] Starting profile update:', {
                userId,
                providedFields: Object.keys(data),
                hasAuthToken: !!token
            });

            const response = await wpApi.post('/auth/update-profile.php', {
                id: userId,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                company: data.company,
                email: data.email
            });

            console.log('[wpApi] Profile update success:', {
                status: response.status,
                updatedFields: Object.keys(data),
                receivedTokens: !!response.data.tokens
            });

            // If we get new tokens in the response, update them
            if (response.data.tokens) {
                sessionStorage.setItem('auth_token', response.data.tokens.access_token);
                sessionStorage.setItem('refresh_token', response.data.tokens.refresh_token);
                console.log('[wpApi] Updated auth tokens');
            }

            return response.data;
        } catch (error) {
            console.error('[wpApi] Profile update error:', {
                userId,
                error: error instanceof ApiError ? error.message : 'Unknown error',
                status: error.response?.status
            });
            throw error;
        }
    },

    // Documents
    async getDocuments() {
        try {
            const response = await wpApi.get('/wp/v2/documents');
            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to fetch documents', 500);
        }
    },

    async uploadDocument(file: File, metadata: any) {
        if (!file) {
            throw new ValidationError('Validation failed', {
                file: ['File is required']
            });
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            Object.entries(metadata).forEach(([key, value]) => {
                formData.append(key, value as string);
            });

            const response = await wpApi.post('/charterhub/v1/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to upload document', 500);
        }
    },

    // Users
    async getCurrentUser() {
        try {
            const response = await wpApi.get('/wp/v2/users/me');
            return response.data as UserProfileData;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to fetch current user', 500);
        }
    },

    // Admin Methods
    async getUsers(params: AdminUserListParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/users', {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10,
                    search: params.search,
                    role: params.role
                }
            });
            return response.data;
        });
    },

    async inviteUser(data: AdminInviteUserData) {
        await requireAdmin();

        const errors: Record<string, string[]> = {
            email: validateEmail(data.email),
            firstName: validateName(data.firstName, 'First name'),
            lastName: validateName(data.lastName, 'Last name')
        };

        const validationErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v.length > 0)
        );

        if (Object.keys(validationErrors).length > 0) {
            throw new ValidationError('Validation failed', validationErrors);
        }

        return retryRequest(async () => {
            const response = await wpApi.post('/charterhub/v1/users/invite', {
                email: data.email,
                role: data.role,
                first_name: data.firstName,
                last_name: data.lastName,
                booking_id: data.bookingId
            });
            return response.data;
        });
    },

    async deleteUser(userId: number) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.delete(`/charterhub/v1/users/${userId}`);
            return response.data;
        });
    },

    async updateUserRole(userId: number, role: 'admin' | 'customer') {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.put(`/charterhub/v1/users/${userId}/role`, {
                role
            });
            return response.data;
        });
    },

    async getInvitations(params: { page?: number; perPage?: number } = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/invitations', {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10
                }
            });
            return response.data;
        });
    },

    async revokeInvitation(invitationId: number) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.delete(`/charterhub/v1/invitations/${invitationId}`);
            return response.data;
        });
    },

    // Booking Methods
    async createBooking(data: BookingData) {
        return retryRequest(async () => {
            const response = await wpApi.post('/charterhub/v1/bookings', {
                title: data.title,
                start_date: data.startDate,
                end_date: data.endDate,
                status: data.status,
                user_id: data.userId,
                vessel_id: data.vesselId,
                details: data.details,
                total_price: data.totalPrice,
                deposit_amount: data.depositAmount,
                deposit_paid: data.depositPaid,
                documents: data.documents
            });
            return response.data;
        });
    },

    async updateBooking(bookingId: number, data: Partial<BookingData>) {
        return retryRequest(async () => {
            const response = await wpApi.put(`/charterhub/v1/bookings/${bookingId}`, {
                title: data.title,
                start_date: data.startDate,
                end_date: data.endDate,
                status: data.status,
                user_id: data.userId,
                vessel_id: data.vesselId,
                details: data.details,
                total_price: data.totalPrice,
                deposit_amount: data.depositAmount,
                deposit_paid: data.depositPaid,
                documents: data.documents
            });
            return response.data;
        });
    },

    async getBooking(bookingId: number) {
        return retryRequest(async () => {
            const response = await wpApi.get(`/charterhub/v1/bookings/${bookingId}`);
            return response.data;
        });
    },

    async getBookings(params: BookingListParams = {}) {
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/bookings', {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10,
                    status: params.status,
                    user_id: params.userId,
                    vessel_id: params.vesselId,
                    start_date: params.startDate,
                    end_date: params.endDate
                }
            });
            return response.data;
        });
    },

    async deleteBooking(bookingId: number) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.delete(`/charterhub/v1/bookings/${bookingId}`);
            return response.data;
        });
    },

    async updateBookingStatus(bookingId: number, status: BookingData['status']) {
        return retryRequest(async () => {
            const response = await wpApi.put(`/charterhub/v1/bookings/${bookingId}/status`, {
                status
            });
            return response.data;
        });
    },

    async attachDocumentToBooking(data: BookingDocumentData) {
        return retryRequest(async () => {
            const response = await wpApi.post('/charterhub/v1/booking-documents', {
                booking_id: data.bookingId,
                document_id: data.documentId,
                type: data.type,
                notes: data.notes
            });
            return response.data;
        });
    },

    async removeDocumentFromBooking(bookingId: number, documentId: number) {
        return retryRequest(async () => {
            const response = await wpApi.delete(`/charterhub/v1/booking-documents/${bookingId}/${documentId}`);
            return response.data;
        });
    },

    async getBookingDocuments(bookingId: number) {
        return retryRequest(async () => {
            const response = await wpApi.get(`/charterhub/v1/bookings/${bookingId}/documents`);
            return response.data;
        });
    },

    async updateBookingPayment(bookingId: number, data: { depositPaid?: boolean; totalPaid?: boolean }) {
        return retryRequest(async () => {
            const response = await wpApi.put(`/charterhub/v1/bookings/${bookingId}/payment`, {
                deposit_paid: data.depositPaid,
                total_paid: data.totalPaid
            });
            return response.data;
        });
    },

    // Admin Booking Methods
    async getBookingStats() {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/bookings/stats');
            return response.data;
        });
    },

    async getBookingCalendar(params: { start: string; end: string; vesselId?: number }) {
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/bookings/calendar', {
                params: {
                    start: params.start,
                    end: params.end,
                    vessel_id: params.vesselId
                }
            });
            return response.data;
        });
    },

    // User Statistics Methods
    async getUserStatistics(userId: number, params: UserStatsParams = {}) {
        return retryRequest(async () => {
            const response = await wpApi.get(`/charterhub/v1/users/${userId}/statistics`, {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate
                }
            });
            return response.data as UserStatistics;
        });
    },

    async getSystemStatistics() {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/statistics/system');
            return response.data;
        });
    },

    // Activity Logging
    async getUserActivity(params: ActivityLogParams = {}) {
        const isAdmin = (await api.getCurrentUser()).role === 'admin';
        
        // If not admin, can only view own activity
        if (!isAdmin && params.userId && params.userId !== (await api.getCurrentUser()).id) {
            throw new ApiError('Access denied', 403, 'forbidden');
        }

        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/activity-logs', {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10,
                    user_id: params.userId,
                    action: params.action,
                    start_date: params.startDate,
                    end_date: params.endDate
                }
            });
            return response.data as {
                items: UserActivityLog[];
                total: number;
                pages: number;
            };
        });
    },

    async getRecentActivity(limit: number = 5) {
        const user = await api.getCurrentUser();
        return retryRequest(async () => {
            const response = await wpApi.get(`/charterhub/v1/users/${user.id}/recent-activity`, {
                params: { limit }
            });
            return response.data as UserActivityLog[];
        });
    },

    // Admin Analytics Methods
    async getUserAnalytics() {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/users');
            return response.data as {
                totalUsers: number;
                activeUsers: number;
                newUsersThisMonth: number;
                usersByRole: Record<string, number>;
                registrationTrend: Array<{
                    date: string;
                    count: number;
                }>;
                activityByType: Record<UserActivityLog['action'], number>;
            };
        });
    },

    async getActivityAnalytics(params: UserStatsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/activity', {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate
                }
            });
            return response.data as {
                totalActions: number;
                actionsByType: Record<UserActivityLog['action'], number>;
                activityTimeline: Array<{
                    date: string;
                    actions: Record<UserActivityLog['action'], number>;
                }>;
                topUsers: Array<{
                    userId: number;
                    email: string;
                    actionCount: number;
                }>;
                unusualActivity: Array<{
                    userId: number;
                    email: string;
                    action: UserActivityLog['action'];
                    count: number;
                    threshold: number;
                }>;
            };
        });
    },

    async exportActivityLogs(params: ActivityLogParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/activity-logs/export', {
                params: {
                    user_id: params.userId,
                    action: params.action,
                    start_date: params.startDate,
                    end_date: params.endDate
                },
                responseType: 'blob'
            });
            return response.data;
        });
    },

    // Booking Analytics Methods
    async getBookingAnalytics(params: AnalyticsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/bookings', {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate,
                    vessel_id: params.vesselId,
                    granularity: params.granularity || 'day'
                }
            });
            return response.data as BookingAnalytics;
        });
    },

    async getRevenueForecasts(params: AnalyticsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/revenue-forecasts', {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate,
                    vessel_id: params.vesselId
                }
            });
            return response.data as {
                forecastedRevenue: number;
                confidence: number;
                factors: Array<{
                    factor: string;
                    impact: number;
                }>;
                monthlyForecasts: Array<{
                    month: string;
                    revenue: number;
                    bookings: number;
                }>;
            };
        });
    },

    async getVesselPerformance(vesselId: number, params: AnalyticsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get(`/charterhub/v1/analytics/vessels/${vesselId}/performance`, {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate,
                    granularity: params.granularity || 'day'
                }
            });
            return response.data as {
                revenue: number;
                bookings: number;
                occupancyRate: number;
                averageBookingValue: number;
                maintenanceCosts: number;
                netProfit: number;
                customerSatisfaction: number;
                timeline: Array<{
                    date: string;
                    revenue: number;
                    bookings: number;
                    occupancyRate: number;
                }>;
            };
        });
    },

    // Document Analytics Methods
    async getDocumentAnalytics(params: AnalyticsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/documents', {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate,
                    granularity: params.granularity || 'day'
                }
            });
            return response.data as DocumentAnalytics;
        });
    },

    async getDocumentCompliance() {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/documents/compliance');
            return response.data as {
                compliantBookings: number;
                totalBookings: number;
                missingDocuments: Array<{
                    bookingId: number;
                    documentType: BookingDocumentData['type'];
                    daysOverdue: number;
                }>;
                expiringDocuments: Array<{
                    documentId: number;
                    type: BookingDocumentData['type'];
                    expiryDate: string;
                    daysUntilExpiry: number;
                }>;
            };
        });
    },

    async getStorageAnalytics(params: AnalyticsParams = {}) {
        await requireAdmin();
        
        return retryRequest(async () => {
            const response = await wpApi.get('/charterhub/v1/analytics/documents/storage', {
                params: {
                    start_date: params.startDate,
                    end_date: params.endDate,
                    granularity: params.granularity || 'day'
                }
            });
            return response.data as {
                totalStorage: number;
                storageByType: Record<BookingDocumentData['type'], number>;
                storageGrowth: Array<{
                    date: string;
                    size: number;
                    newDocuments: number;
                }>;
                largestDocuments: Array<{
                    id: number;
                    name: string;
                    type: BookingDocumentData['type'];
                    size: number;
                    uploadDate: string;
                }>;
            };
        });
    },

    // Add more API methods as needed
};

export default api; 