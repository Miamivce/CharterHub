import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'

// Debug helper for admin authentication
const LoginDebugHelper: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [localTokenInfo, setLocalTokenInfo] = useState<any>(null)

  const BACKEND_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

  // Get token information from local storage on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const sessionToken = sessionStorage.getItem('auth_token')

    setLocalTokenInfo({
      localStorage: token
        ? {
            available: true,
            prefix: token.substring(0, 10) + '...',
            length: token.length,
          }
        : { available: false },
      sessionStorage: sessionToken
        ? {
            available: true,
            prefix: sessionToken.substring(0, 10) + '...',
            length: sessionToken.length,
          }
        : { available: false },
    })
  }, [])

  // Call the debug-auth.php endpoint to check token validation
  const checkAuthStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

      const response = await axios.get(`${BACKEND_URL}/api/admin/debug-auth.php`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      setDebugInfo(response.data)
    } catch (err: any) {
      console.error('Auth debug failed:', err)
      setError(err.message || 'Failed to debug authentication')

      // Try to extract response data if available
      if (err.response) {
        setDebugInfo({
          error: true,
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ mt: 3, mb: 3, border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Admin Authentication Debug
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Local Token Information:</Typography>
        {localTokenInfo ? (
          <List dense>
            <ListItem>
              <ListItemText
                primary="Token in localStorage"
                secondary={
                  localTokenInfo.localStorage.available
                    ? `${localTokenInfo.localStorage.prefix} (${localTokenInfo.localStorage.length} characters)`
                    : 'Not found'
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Token in sessionStorage"
                secondary={
                  localTokenInfo.sessionStorage.available
                    ? `${localTokenInfo.sessionStorage.prefix} (${localTokenInfo.sessionStorage.length} characters)`
                    : 'Not found'
                }
              />
            </ListItem>
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Checking token storage...
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={checkAuthStatus}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Check Authentication Status'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {debugInfo && (
          <Box mt={3}>
            <Typography variant="subtitle1">Authentication Debug Results:</Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                bgcolor: '#f5f5f5',
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default LoginDebugHelper
