const API_URL = '/api';

export const childrenAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/children`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch children');
    return res.json();
  },

  getOne: async (id) => {
    const res = await fetch(`${API_URL}/children/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch child');
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create child');
    }
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/children/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update child');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/children/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete child');
    return res.json();
  },

  adjustPoints: async (id, amount, reason) => {
    const res = await fetch(`${API_URL}/children/${id}/adjust-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, reason })
    });
    if (!res.ok) throw new Error('Failed to adjust points');
    return res.json();
  },

  getActivity: async (id) => {
    const res = await fetch(`${API_URL}/children/${id}/activity`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  getStats: async (id) => {
    const res = await fetch(`${API_URL}/children/${id}/stats`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }
};
