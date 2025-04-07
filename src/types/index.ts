// User Types
export interface UserProfileData {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    company?: string;
    role: 'admin' | 'customer';
    verified: boolean;
}

// Booking Types
export interface BookingData {
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
    documents?: number[];
}

// Document Types
export interface DocumentData {
    id: number;
    title: string;
    type: 'contract' | 'invoice' | 'passport' | 'license' | 'other';
    url: string;
    uploadedBy: number;
    uploadedAt: string;
    size: number;
    mimeType: string;
    metadata?: Record<string, any>;
}

// Analytics Types
export interface BookingAnalytics {
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
}

// API Response Types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    pages: number;
    currentPage: number;
} 