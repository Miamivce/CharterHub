import { AxiosError } from 'axios'

export enum ErrorType {
  NETWORK = 'network',
  CORS = 'cors', 
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  code?: string
  statusCode?: number
  details?: Record<string, any>
}

/**
 * Categorize and format API errors for consistent handling
 */
export function categorizeApiError(error: any): AppError {
  // Default error
  const appError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
    originalError: error
  }

  // Check if it's an Axios error
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError

    // Get status code if available
    if (axiosError.response?.status) {
      appError.statusCode = axiosError.response.status
    }

    // Network or CORS errors
    if (
      axiosError.message === 'Network Error' || 
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNABORTED' ||
      !axiosError.response
    ) {
      appError.type = ErrorType.NETWORK
      appError.message = 'Unable to connect to the server. Please check your internet connection.'
      appError.code = axiosError.code || 'network_error'
      
      // Check if it might be a CORS error
      const isCORSRelated = 
        axiosError.message?.includes('CORS') ||
        axiosError.message?.includes('cross-origin') ||
        axiosError.message?.toLowerCase().includes('access-control') ||
        (axiosError.response && axiosError.response.status === 0)
        
      if (isCORSRelated) {
        appError.type = ErrorType.CORS
        appError.message = 'Your connection to the server is blocked. Please try again or contact support.'
        appError.code = 'cors_error'
      }
      
      return appError
    }

    // Authentication errors
    if (axiosError.response?.status === 401) {
      appError.type = ErrorType.AUTH
      appError.message = 'Your session has expired. Please log in again.'
      appError.code = 'auth_expired'
      return appError
    }

    // Validation errors
    if (axiosError.response?.status === 400 || axiosError.response?.status === 422) {
      appError.type = ErrorType.VALIDATION
      appError.message = 'Please check your information and try again.'
      appError.code = 'validation_error'
      
      // Include validation details if available
      const responseData = axiosError.response.data as any
      if (responseData?.errors || responseData?.validationErrors) {
        appError.details = responseData.errors || responseData.validationErrors
      }
      
      return appError
    }

    // Server errors
    if (axiosError.response?.status >= 500) {
      appError.type = ErrorType.SERVER
      appError.message = 'The server encountered an error. Please try again later.'
      appError.code = 'server_error'
      return appError
    }

    // Other HTTP errors
    if (axiosError.response) {
      appError.type = ErrorType.CLIENT
      appError.message = 'An error occurred with your request.'
      appError.code = `http_${axiosError.response.status}`
      
      // Try to get message from response
      const responseData = axiosError.response.data as any
      if (responseData?.message) {
        appError.message = responseData.message
      }
      
      return appError
    }
  }

  // For non-Axios errors or unhandled cases
  if (error instanceof Error) {
    appError.message = error.message
  }

  return appError
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const appError = categorizeApiError(error)
  return appError.message
}

/**
 * Handle API errors with logging and optional callback
 */
export function handleApiError(
  error: any, 
  context: string, 
  callback?: (appError: AppError) => void
): AppError {
  const appError = categorizeApiError(error)
  
  // Log error details for debugging
  console.error(`[${context}] ${appError.type.toUpperCase()} ERROR:`, {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    details: appError.details,
    original: appError.originalError
  })
  
  // Execute callback if provided
  if (callback) {
    callback(appError)
  }
  
  return appError
} 