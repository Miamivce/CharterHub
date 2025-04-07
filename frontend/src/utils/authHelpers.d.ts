/**
 * TypeScript declarations for authHelpers.js
 */

interface AuthData {
  token: string | null
  refreshToken: string | null
  user: any | null
  expiry: number | null
}

export function storeAuthData(authData: AuthData, rememberMe?: boolean): void
export function getAuthData(): AuthData
export function clearAuthData(): void
export function formatToken(token: string): string
export function isAuthenticated(): boolean
export function shouldRefreshToken(thresholdSeconds?: number): boolean
export function parseJwt(token: string): any | null
export function getUserRole(): string | null
export function hasRole(roles: string | string[]): boolean
export function isClient(): boolean
export function isAdmin(): boolean

declare const authHelpers: {
  storeAuthData: typeof storeAuthData
  getAuthData: typeof getAuthData
  clearAuthData: typeof clearAuthData
  isAuthenticated: typeof isAuthenticated
  shouldRefreshToken: typeof shouldRefreshToken
  parseJwt: typeof parseJwt
  getUserRole: typeof getUserRole
  hasRole: typeof hasRole
  isClient: typeof isClient
  isAdmin: typeof isAdmin
  formatToken: typeof formatToken
}

export default authHelpers
