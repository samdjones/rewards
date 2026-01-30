const API_URL = '/api';

export const authAPI = {
  register: async (email, password, name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    return res.json();
  },

  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  }
};
