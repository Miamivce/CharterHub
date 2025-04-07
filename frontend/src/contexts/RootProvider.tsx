import { ReactNode } from 'react'
import { NotificationProvider } from './notification/NotificationContext'
import { BookingProvider } from './booking/BookingContext'
import { DocumentProvider } from './document/DocumentContext'
import { JWTAuthProvider } from './auth/JWTAuthContext'

interface RootProviderProps {
  children: ReactNode
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <JWTAuthProvider>
      <NotificationProvider>
        <DocumentProvider>
          <BookingProvider>{children}</BookingProvider>
        </DocumentProvider>
      </NotificationProvider>
    </JWTAuthProvider>
  )
}

// TODO: Add other providers as they are implemented
// Example usage in App.tsx:
/*
import { RootProvider } from './contexts';

function App() {
  return (
    <RootProvider>
      <Router>
        <YourAppComponents />
      </Router>
    </RootProvider>
  );
}
*/
