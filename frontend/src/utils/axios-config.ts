import axios, { AxiosInstance } from 'axios'

// Configure global Axios defaults
axios.defaults.withCredentials = true // Ensure cookies are sent with requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest' // Identify AJAX requests

/**
 * Configures an Axios instance with CORS and error handling settings
 * @param instance The Axios instance to configure
 * @returns The configured Axios instance
 */
export const configureAxiosInstance = (instance: AxiosInstance): AxiosInstance => {
  // Set common headers for CORS
  instance.defaults.withCredentials = true
  instance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

  // Add request interceptor to handle potential CORS preflight issues
  instance.interceptors.request.use(
    (config) => {
      // Ensure JSON content type for non-FormData payloads
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add response interceptor to handle common errors
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      // Log CORS errors distinctly for easier debugging
      if (error.message && error.message.includes('Network Error')) {
        console.error('Possible CORS issue:', error)
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// Configure the global axios instance
configureAxiosInstance(axios)

export default axios
