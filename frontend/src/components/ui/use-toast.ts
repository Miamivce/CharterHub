import { useState, useEffect, ReactNode } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: ReactNode
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: React.ReactNode
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

export const toast = {
  success: (props: { title?: string; description?: ReactNode; duration?: number }) => {
    // Implementation details would be added in a real app
    console.log('Toast success:', props)
  },
  error: (props: { title?: string; description?: ReactNode; duration?: number }) => {
    // Implementation details would be added in a real app
    console.log('Toast error:', props)
  },
  warning: (props: { title?: string; description?: ReactNode; duration?: number }) => {
    // Implementation details would be added in a real app
    console.log('Toast warning:', props)
  },
  info: (props: { title?: string; description?: ReactNode; duration?: number }) => {
    // Implementation details would be added in a real app
    console.log('Toast info:', props)
  },
  custom: (props: { title?: string; description?: ReactNode; duration?: number }) => {
    // Implementation details would be added in a real app
    console.log('Toast custom:', props)
  },
}

export { useToast }
