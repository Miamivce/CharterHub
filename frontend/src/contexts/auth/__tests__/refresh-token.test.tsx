import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../AuthContext'
import wpApi from '@/services/wpApi'

// Mock the wpApi module
jest.mock('@/services/wpApi')

describe('AuthContext Token Refresh', () => {
  // Clear storage before each test
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    jest.clearAllMocks()
  })

  test('refreshTokenIfNeeded should refresh token if available', async () => {
    // Define a mock user for the test
    const testUser = {
      id: 123,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      verified: true,
    }

    // Create a test component that uses the auth context
    function TestComponent() {
      const auth = useJWTAuth()

      const handleRefresh = async () => {
        const result = await auth.refreshTokenIfNeeded()
        if (result) {
          document.getElementById('result')!.textContent = 'success'
        } else {
          document.getElementById('result')!.textContent = 'failed'
        }
      }

      return (
        <div>
          <button data-testid="refresh-btn" onClick={handleRefresh}>
            Refresh Token
          </button>
          <div id="result"></div>
        </div>
      )
    }

    // Set up mock tokens in storage before rendering
    act(() => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('refresh_token', 'test-refresh')
      localStorage.setItem('token_expiry', (Date.now() - 1000).toString()) // Expired token
    })

    // Render with AuthProvider
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    // Click the refresh button
    const refreshButton = screen.getByTestId('refresh-btn')
    fireEvent.click(refreshButton)

    // Check that token was refreshed
    await waitFor(() => {
      expect(document.getElementById('result')!.textContent).toBe('success')
    })

    // Check that tokens were updated in storage
    expect(localStorage.getItem('auth_token')).toBe('new-refreshed-token')
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token')
  })

  test('refreshTokenIfNeeded should return false if no tokens are available', async () => {
    // Create a test component that uses the auth context
    function TestComponent() {
      const auth = useJWTAuth()

      const handleRefresh = async () => {
        const result = await auth.refreshTokenIfNeeded()
        document.getElementById('result')!.textContent = result ? 'success' : 'failed'
      }

      return (
        <div>
          <button data-testid="refresh-btn" onClick={handleRefresh}>
            Refresh Token
          </button>
          <div id="result"></div>
        </div>
      )
    }

    // Render with AuthProvider - no tokens in storage
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    // Click the refresh button
    const refreshButton = screen.getByTestId('refresh-btn')
    fireEvent.click(refreshButton)

    // Check that refresh failed
    await waitFor(() => {
      expect(document.getElementById('result')!.textContent).toBe('failed')
    })
  })
})
