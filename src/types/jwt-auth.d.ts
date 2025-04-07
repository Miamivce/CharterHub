import { FC, ReactNode } from 'react';

/**
 * Type declarations to fix compatibility issues with JWT authentication components
 */

declare module '../frontend/src/contexts/auth/JWTAuthContext' {
  export interface AuthProviderProps {
    children: ReactNode;
  }

  export interface JWTAuthContextType {
    isAuthenticated: boolean;
    isInitialized: boolean;
    user: any | null;
    loading: {
      login: boolean;
      logout: boolean;
      register: boolean;
      forgotPassword: boolean;
      resetPassword: boolean;
      verifyEmail: boolean;
      updateProfile: boolean;
      changePassword: boolean;
      refreshUserData: boolean;
    };
    errors: {
      login: Error | null;
      logout: Error | null;
      register: Error | null;
      forgotPassword: Error | null;
      resetPassword: Error | null;
      verifyEmail: Error | null;
      updateProfile: Error | null;
      changePassword: Error | null;
      refreshUserData: Error | null;
    };
    login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
    logout: () => Promise<void>;
    register: (data: any) => Promise<any>;
    forgotPassword: (email: string) => Promise<boolean>;
    resetPassword: (data: any) => Promise<boolean>;
    verifyEmail: (token: string, email?: string) => Promise<boolean>;
    updateProfile: (data: any) => Promise<any>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
    refreshUserData: () => Promise<any>;
  }

  export const JWTAuthProvider: FC<AuthProviderProps>;
  export const useJWTAuth: () => JWTAuthContextType;
}

declare module '../frontend/src/pages/shared/JWTLogin' {
  export interface JWTLoginProps {}
  export const JWTLogin: FC<JWTLoginProps>;
}

declare module '../frontend/src/components/shared/JWTProtectedRoute' {
  export interface JWTProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('admin' | 'client')[];
    redirectTo?: string;
  }
  export const JWTProtectedRoute: FC<JWTProtectedRouteProps>;
  export default JWTProtectedRoute;
} 