import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../../services/wpApi'
import { Alert, Box, CircularProgress, Typography, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

const EmailVerificationPopup: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [redirectUrl, setRedirectUrl] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setStatus('error')
        setMessage('No verification token found.')
        return
      }

      try {
        const response = await verifyEmail(token)
        setStatus('success')
        setMessage(response.message)
        if (response.redirectUrl) {
          setRedirectUrl(response.redirectUrl)
        }
      } catch (error: unknown) {
        setStatus('error')
        if (error instanceof Error) {
          setMessage(error.message)
        } else {
          setMessage('Verification failed. Please try again later.')
        }
      }
    }

    verifyToken()
  }, [searchParams])

  const handleRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl
    } else {
      navigate('/login')
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 4,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {message}
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon
              sx={{
                fontSize: 60,
                color: 'success.main',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              {message}
            </Typography>
            <Button variant="contained" color="primary" onClick={handleRedirect} sx={{ mt: 2 }}>
              Continue to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon
              sx={{
                fontSize: 60,
                color: 'error.main',
                mb: 2,
              }}
            />
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
              Return to Login
            </Button>
          </>
        )}
      </Box>
    </Box>
  )
}

export default EmailVerificationPopup
