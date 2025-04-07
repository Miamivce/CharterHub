import { useState, useEffect, ReactNode } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: ReactNode
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: React.ReactNode
  variant?: 'default' | 'destructive' | 'success'
}

export interface ToastProps {
  title?: string
  description?: ReactNode
  duration?: number
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContext {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const useToast = (): ToastContext => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...toast }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const removeAllToasts = () => {
    setToasts([])
  }

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
  }
}

// Define the toast function type that includes both direct call and methods
interface ToastFunction {
  (props: ToastProps): string;
  success: (props: ToastProps) => string;
  error: (props: ToastProps) => string;
  warning: (props: ToastProps) => string;
  info: (props: ToastProps) => string;
  custom: (props: ToastProps) => string;
}

// Create the main toast function
const toastFn = (props: ToastProps): string => {
  console.log('Toast called directly:', props);
  // In a real implementation, this would add the toast to a state
  const id = Math.random().toString(36).substring(2, 9);
  return id;
};

// Add methods to the function
toastFn.success = (props: ToastProps): string => {
  console.log('Toast success:', props);
  return toastFn({ ...props, variant: 'success' });
};

toastFn.error = (props: ToastProps): string => {
  console.log('Toast error:', props);
  return toastFn({ ...props, variant: 'destructive' });
};

toastFn.warning = (props: ToastProps): string => {
  console.log('Toast warning:', props);
  return toastFn({ ...props });
};

toastFn.info = (props: ToastProps): string => {
  console.log('Toast info:', props);
  return toastFn({ ...props });
};

toastFn.custom = (props: ToastProps): string => {
  console.log('Toast custom:', props);
  return toastFn(props);
};

// Export the toast function with its methods
export const toast: ToastFunction = toastFn;

export { useToast }
