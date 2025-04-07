import { createContext, useContext, useState, useCallback } from 'react'
import { ContextProviderProps } from '../types'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
  title?: string
  actions?: { label: string; onClick: () => void }[]
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  showNotification: (message: string, type: NotificationType, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: ContextProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-remove notification after duration (if specified)
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const showNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 3000) => {
      addNotification({
        type,
        message,
        duration,
      })
    },
    [addNotification]
  )

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    showNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Add specific handling for database transaction errors
export const showDatabaseTimeoutNotification = (
  addNotification: (notification: Notification) => void,
  retryFn?: () => void
) => {
  addNotification({
    id: `db-timeout-${Date.now()}`,
    type: 'warning',
    title: 'Database Operation Timeout',
    message:
      "The operation is taking longer than expected due to database constraints. We're automatically retrying.",
    duration: 10000,
    actions: retryFn
      ? [
          {
            label: 'Retry Now',
            onClick: retryFn,
          },
        ]
      : undefined,
  })
}

// Show error notification with improved error detection
export const showErrorNotification = (
  addNotification: (notification: Notification) => void,
  error: Error | string,
  title = 'Error'
) => {
  const errorMessage = typeof error === 'string' ? error : error.message

  // Check for specific error types to show appropriate messages
  if (errorMessage.includes('timeout') || errorMessage.includes('Lock wait timeout exceeded')) {
    showDatabaseTimeoutNotification(addNotification)
    return
  }

  addNotification({
    id: `error-${Date.now()}`,
    type: 'error',
    title,
    message: errorMessage,
    duration: 8000,
  })
}
