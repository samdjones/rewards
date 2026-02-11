const API_URL = '/api';

export const kioskAPI = {
  generateCode: async (sessionToken) => {
    const res = await fetch(`${API_URL}/kiosk/code`, {
      method: 'POST',
      headers: sessionToken ? { 'Content-Type': 'application/json' } : {},
      credentials: 'include',
      body: sessionToken ? JSON.stringify({ session_token: sessionToken }) : undefined
    });
    if (!res.ok) throw new Error('Failed to generate kiosk code');
    return res.json();
  },

  checkStatus: async (sessionToken) => {
    const res = await fetch(`${API_URL}/kiosk/status?session_token=${encodeURIComponent(sessionToken)}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to check kiosk status');
    return res.json();
  },

  pair: async (code) => {
    const res = await fetch(`${API_URL}/kiosk/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to pair kiosk');
    }
    return res.json();
  },

  getDashboardData: async () => {
    const res = await fetch(`${API_URL}/kiosk/dashboard`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch kiosk dashboard data');
    return res.json();
  },

  getSessions: async () => {
    const res = await fetch(`${API_URL}/kiosk/sessions`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch kiosk sessions');
    const data = await res.json();
    return data.sessions;
  },

  removeSession: async (id) => {
    const res = await fetch(`${API_URL}/kiosk/sessions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to remove kiosk session');
    return res.json();
  }
};
