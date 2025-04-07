import { useCallback } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationOptions {
  type: NotificationType
  message: string
  duration?: number
}

export function useNotification() {
  const showNotification = useCallback(
    ({ type, message, duration = 3000 }: NotificationOptions) => {
      // For now, we'll use a simple alert
      // In a real app, you'd want to use a proper notification system
      if (type === 'error') {
        console.error(message)
      } else {
        console.log(`${type}: ${message}`)
      }
    },
    []
  )

  return { showNotification }
}
