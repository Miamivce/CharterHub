// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Generic mock API response handler
async function mockApiResponse<T>(
  data: T,
  delayMs: number = Math.random() * 800 + 200,
  success: boolean = true,
  errorMessage?: string
): Promise<T> {
  await delay(delayMs)

  if (!success) {
    throw new Error(errorMessage || 'Mock API error')
  }

  return data
}

// Mock API service
export const mockApi = {
  async get<T>(data: T): Promise<T> {
    return mockApiResponse(data)
  },

  async post<T>(data: T): Promise<T> {
    return mockApiResponse(data)
  },

  async put<T>(data: T): Promise<T> {
    return mockApiResponse(data)
  },

  async patch<T>(data: T): Promise<T> {
    return mockApiResponse(data)
  },

  async delete<T>(data: T): Promise<T> {
    return mockApiResponse(data)
  },
}
