import { apiFetch, setAccessToken, clearAccessToken } from './client';

export async function login(email, password) {
  const payload = await apiFetch('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = payload?.data?.access_token;
  if (!token) {
    throw new Error('Login succeeded but no access_token was returned.');
  }

  setAccessToken(token);
  return payload.data;
}

export async function register(email, password, username) {
  return apiFetch('/api/v1/users/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });
}

export function logout() {
  clearAccessToken();
}
