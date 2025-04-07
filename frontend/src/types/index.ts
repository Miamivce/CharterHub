export * from './document'

export interface ContextProviderProps {
  children: React.ReactNode
}

// User Types
export interface UserProfileData {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    company?: string;
    role: 'admin' | 'client';
    verified: boolean;
}
