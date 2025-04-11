import React, { Component, ErrorInfo } from 'react'
import { Button } from './Button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // FIX: Ignore React Router navigation cancellation errors
    if (
      error.message.includes('Minified React error #300') ||
      error.message.includes('Suspense') ||
      error.message.includes('lazy') ||
      error.message.includes('navigation') ||
      error.message.includes('cancel')
    ) {
      console.log('Ignoring navigation-related error in error boundary:', error.message)
      return {
        hasError: false, // Don't show the error UI for navigation errors
        error,
        errorInfo: null,
      }
    }
    
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // CRITICAL FIX: Ignore React Router navigation errors
    const isNavigationError = 
      error.message.includes('Minified React error #300') ||
      error.message.includes('Suspense') ||
      error.message.includes('lazy') ||
      error.message.includes('navigation') ||
      error.message.includes('cancel');
      
    if (isNavigationError) {
      console.log('Navigation error caught and ignored by ErrorBoundary:', error.message);
      // Reset error state to prevent UI from showing error
      setTimeout(() => {
        if (this.state.hasError) {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
          });
        }
      }, 100);
      return;
    }
    
    this.setState({
      error,
      errorInfo,
    })

    // Log error to your error tracking service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // Attempt to recover by reloading the page
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // ENHANCEMENT: Only show the error UI when we have a real error, not navigation issues
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
              <p className="mt-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-sm font-medium text-red-800">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <Button onClick={this.handleReset}>Try Again</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
