import axios, { AxiosError } from 'axios'

export interface WordPressError {
  code: string
  message: string
  data?: {
    status: number
    [key: string]: any
  }
}

export class WordPressAPIError extends Error {
  code: string
  status: number
  data?: any

  constructor(error: WordPressError) {
    super(error.message)
    this.name = 'WordPressAPIError'
    this.code = error.code
    this.status = error.data?.status || 500
    this.data = error.data
  }
}

export const handleWordPressError = (error: unknown): WordPressAPIError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<WordPressError>
    if (axiosError.response?.data) {
      return new WordPressAPIError(axiosError.response.data)
    }
    // Network or timeout error
    return new WordPressAPIError({
      code: 'network_error',
      message: 'Failed to connect to WordPress API',
      data: { status: axiosError.response?.status || 500 },
    })
  }

  // Unknown error
  return new WordPressAPIError({
    code: 'unknown_error',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    data: { status: 500 },
  })
}

export const isWordPressError = (error: unknown): error is WordPressAPIError => {
  return error instanceof WordPressAPIError
}

export const getErrorMessage = (error: unknown): string => {
  if (isWordPressError(error)) {
    return error.message
  }
  return 'An unexpected error occurred'
}
