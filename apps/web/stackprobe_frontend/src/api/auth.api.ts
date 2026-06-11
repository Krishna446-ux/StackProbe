import { apiGet, apiPost } from './client';
import type { AuthResponse } from '../types/auth.types';

/**
 * Check current authentication status via backend session cookie.
 */
export async function checkAuth(): Promise<AuthResponse> {
  return apiGet<AuthResponse>('/auth/me');
}

/**
 * Logout — clears the backend session cookie.
 */
export async function logout(): Promise<void> {
  await apiPost<void>('/auth/logout');
}
