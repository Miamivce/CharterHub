// Mock the wpApi service for testing

// Define the mock user response shape
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
}

// Define error classes to match the real implementation
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

// Create simple mock implementations without Jest functions
const wpApi = {
  testConnection: async () => ({ success: true }),
  
  getCurrentUser: async () => {
    return {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      verified: true
    };
  },
  
  login: async ({ email, password, rememberMe }: { email: string, password: string, rememberMe: boolean }) => {
    if (password === 'wrong-password') {
      throw new Error('Invalid credentials');
    }
    
    return {
      auth_token: 'test-token',
      refresh_token: 'test-refresh-token',
      user: {
        id: 1,
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        verified: true
      }
    };
  },
  
  logout: async () => ({ success: true }),
  
  registerUser: async (data: any) => {
    if (data.email === 'existing@example.com') {
      throw new Error('Email already exists');
    }
    
    return {
      token: 'new-user-token',
      refresh_token: 'new-user-refresh',
      user: {
        id: 2,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'customer',
        verified: false
      }
    };
  },
  
  refreshToken: async () => {
    return {
      auth_token: 'new-refreshed-token',
      refresh_token: 'new-refresh-token',
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        verified: true
      }
    };
  },
  
  requestPasswordReset: async () => ({ success: true }),
  
  resetPassword: async () => ({ success: true }),
  
  updateProfile: async (userId: number, data: any) => {
    return {
      id: userId,
      ...data,
      email: 'test@example.com',
      role: 'customer',
      verified: true
    };
  },
  
  verifyEmail: async () => ({ success: true })
};

export default wpApi; 