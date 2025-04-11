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
    if (
      error.message.includes('Minified React error #300') ||
      error.message.includes('Minified React error #310') ||
      error.message.includes('Suspense') ||
      error.message.includes('lazy') ||
      error.message.includes('navigation') ||
      error.message.includes('cancel') ||
      error.message.includes('canceled') ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError' ||
      (error instanceof Error && error.name.includes('ApiError') && error.message.includes('canceled')) ||
      (error.stack && error.stack.includes('ERR_CANCELED'))
    ) {
      console.log('Ignoring navigation/cancelation error in error boundary:', error.message)
      return {
        hasError: false,
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
    const isIgnorableError = 
      error.message.includes('Minified React error #300') ||
      error.message.includes('Minified React error #310') ||
      error.message.includes('Suspense') ||
      error.message.includes('lazy') ||
      error.message.includes('navigation') ||
      error.message.includes('cancel') ||
      error.message.includes('canceled') ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError' ||
      (error instanceof Error && error.name.includes('ApiError') && error.message.includes('canceled')) ||
      (error.stack && error.stack.includes('ERR_CANCELED'));
      
    if (isIgnorableError) {
      console.log('Navigation or cancellation error caught and ignored by ErrorBoundary:', error.message);
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

    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
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
