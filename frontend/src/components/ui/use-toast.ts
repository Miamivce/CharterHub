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

// Create an implementable toast handler
class ToastHandler {
  success(props: ToastProps) {
    console.log('Toast success:', props)
    return this.custom({ ...props, variant: 'success' });
  }
  
  error(props: ToastProps) {
    console.log('Toast error:', props)
    return this.custom({ ...props, variant: 'destructive' });
  }
  
  warning(props: ToastProps) {
    console.log('Toast warning:', props)
    return this.custom({ ...props });
  }
  
  info(props: ToastProps) {
    console.log('Toast info:', props)
    return this.custom({ ...props });
  }
  
  custom(props: ToastProps) {
    console.log('Toast custom:', props)
    // In a real implementation, this would add the toast to a state
    const id = Math.random().toString(36).substring(2, 9);
    return id;
  }
}

// Create the toast instance
const toastInstance = new ToastHandler();

// Export the toast object
export const toast = {
  success: toastInstance.success.bind(toastInstance),
  error: toastInstance.error.bind(toastInstance),
  warning: toastInstance.warning.bind(toastInstance),
  info: toastInstance.info.bind(toastInstance),
  custom: toastInstance.custom.bind(toastInstance)
};

export { useToast }
