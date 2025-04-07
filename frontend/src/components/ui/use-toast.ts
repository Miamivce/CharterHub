import { useState, useEffect, ReactNode } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: ReactNode
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: React.ReactNode
}

export interface ToastProps {
  title?: string
  description?: ReactNode
  duration?: number
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

// Create a callable toast function
const createToast = (props: ToastProps) => {
  // Implement toast display logic here
  console.log('Toast created:', props)
}

// Export as a callable function with methods
export const toast = Object.assign(
  createToast,
  {
    success: (props: ToastProps) => {
      console.log('Toast success:', props)
    },
    error: (props: ToastProps) => {
      console.log('Toast error:', props)
    },
    warning: (props: ToastProps) => {
      console.log('Toast warning:', props)
    },
    info: (props: ToastProps) => {
      console.log('Toast info:', props)
    },
    custom: (props: ToastProps) => {
      console.log('Toast custom:', props)
    },
  }
)

export { useToast }
