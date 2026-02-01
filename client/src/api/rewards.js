const API_URL = '/api';

export const rewardsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/rewards`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch rewards');
    return res.json();
  },

  getOne: async (id) => {
    const res = await fetch(`${API_URL}/rewards/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch reward');
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create reward');
    }
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update reward');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/rewards/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete reward');
    return res.json();
  },

  redeem: async (id, child_ids, notes) => {
    const res = await fetch(`${API_URL}/rewards/${id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ child_ids, notes })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to redeem reward');
    }
    return res.json();
  }
};
