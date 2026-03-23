import * as api from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function loginUser(email, password) {
  const res = await api.login(email, password);
  // Expecting { accessToken, refreshToken, user }
  if (res && res.accessToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', res.accessToken);
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
      if (res.user && res.user.email) localStorage.setItem('userEmail', res.user.email);
    }
  }
  return res;
}

export async function registerUser(payload) {
  const res = await api.register(payload);
  return res;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
  }
}

export async function getMe() {
  return api.apiRequest('/api/auth/me', { method: 'GET' });
}

export function getStoredEmail() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail');
}

export async function updateProfile(payload) {
  return api.apiRequest('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function startOAuth(provider, { link = false } = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const query = link ? '?link=true' : '';
  const res = await fetch(`${API_BASE}/api/auth/oauth/${provider}${query}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.message) || `OAuth start failed with ${res.status}`);
  }
  return data;
}

export async function unlinkProvider(provider) {
  return api.apiRequest(`/api/auth/oauth/${provider}`, { method: 'DELETE' });
}

export async function resendVerification(email) {
  return api.apiRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email) {
  return api.apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, password) {
  return api.apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token) {
  return api.apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}
