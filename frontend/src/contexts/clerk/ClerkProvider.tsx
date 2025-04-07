import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'

interface ClerkProviderProps {
  children: React.ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing Clerk Publishable Key')
  }

  return (
    <BaseClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      {children}
    </BaseClerkProvider>
  )
}
