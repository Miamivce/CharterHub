import { getAuthToken } from './auth'

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8000'

/**
 * Create an XHR request with proper CORS handling for file downloads
 * This provides more reliable cross-domain file handling than fetch API
 */
export function createCorsXHR(
  method: string,
  url: string,
  responseType: XMLHttpRequestResponseType = 'blob'
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Get auth token for request
    const token = getAuthToken()
    if (!token) {
      return reject(new Error('Authentication token not found'))
    }

    // Create full URL if relative path provided
    let fullUrl = url.startsWith('http')
      ? url
      : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`

    // Add auth token as URL parameter to avoid CORS preflight requests
    const separator = fullUrl.includes('?') ? '&' : '?'
    fullUrl = `${fullUrl}${separator}auth_token=${encodeURIComponent(token)}`

    console.log(`Creating XHR request to: ${fullUrl.split('auth_token=')[0]}[TOKEN HIDDEN]`)

    // Create and configure XHR
    const xhr = new XMLHttpRequest()
    xhr.open(method, fullUrl, true)
    xhr.responseType = responseType

    // Don't set withCredentials for URL-based auth tokens
    // Setting it to false improves CORS compatibility
    xhr.withCredentials = false

    // Set up response handlers
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        console.log(`XHR request succeeded: ${this.status}`)
        resolve(xhr.response)
      } else {
        console.error(`XHR request failed: ${this.status}`)
        reject(new Error(`Server returned ${this.status}: ${this.statusText}`))
      }
    }

    xhr.onerror = function () {
      console.error('XHR network error', {
        url: fullUrl,
        status: this.status,
        statusText: this.statusText,
      })
      reject(new Error('Network error while fetching document'))
    }

    xhr.onabort = function () {
      console.warn('XHR request aborted')
      reject(new Error('Request was aborted'))
    }

    xhr.ontimeout = function () {
      console.error('XHR request timed out')
      reject(new Error('Request timed out'))
    }

    // Set a longer timeout for document operations (30 seconds)
    xhr.timeout = 30000

    // Send the request
    xhr.send()
  })
}

/**
 * Download a file blob as a file with proper file extension
 */
export function downloadBlobAsFile(blob: Blob, filename: string): void {
  try {
    // Try to determine file extension from blob type
    let extension = ''
    const mimeType = blob.type

    if (mimeType) {
      const mimeTypeParts = mimeType.split('/')
      if (mimeTypeParts.length > 1) {
        extension = `.${mimeTypeParts[1].split(';')[0].toLowerCase()}`

        // Handle special cases
        if (extension === '.jpeg') extension = '.jpg'
        if (extension === '.vnd.openxmlformats-officedocument.wordprocessingml.document')
          extension = '.docx'
        if (extension === '.vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          extension = '.xlsx'
        if (extension === '.vnd.openxmlformats-officedocument.presentationml.presentation')
          extension = '.pptx'
      }
    }

    // Clean filename and add extension if needed
    let safeFilename = filename || 'document'

    // Add extension only if filename doesn't already have one
    if (extension && !safeFilename.toLowerCase().endsWith(extension.toLowerCase())) {
      safeFilename += extension
    }

    console.log(`Preparing download with filename: ${safeFilename}, type: ${mimeType}`)

    // Create a blob URL
    const url = URL.createObjectURL(blob)

    // Create a download link
    const link = document.createElement('a')
    link.href = url
    link.download = safeFilename
    link.style.display = 'none'

    // Add to DOM, trigger click, and remove
    document.body.appendChild(link)
    link.click()

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log(`Download completed for ${safeFilename}`)
    }, 100)
  } catch (error) {
    console.error('Error downloading blob as file:', error)
    throw error
  }
}

/**
 * CORS-friendly approach to download a document using form POST
 * This avoids CORS preflight requests by using a traditional form submission
 */
export function downloadDocumentViaForm(documentId: string, filename?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Initiating form-based download for document ID: ${documentId}`)

      // Get the token for authentication
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Create a download URL with the token as a parameter
      const downloadUrl = `${API_BASE_URL}/api/admin/documents/download.php?id=${documentId}&auth_token=${encodeURIComponent(token)}`

      // Create a hidden iframe to handle the download
      const iframe = window.document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = downloadUrl

      // Add to document body
      window.document.body.appendChild(iframe)

      // Set up a timeout to remove the iframe after a reasonable time
      setTimeout(() => {
        window.document.body.removeChild(iframe)
        console.log('Download iframe removed')
        resolve()
      }, 5000) // Give it 5 seconds to process the download

      console.log(`Form-based download initiated for document ${documentId}`)
    } catch (error) {
      console.error(`Failed to initiate form-based download for document ${documentId}:`, error)
      reject(error)
    }
  })
}
