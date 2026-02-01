const API_URL = '/api';

export const tasksAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/tasks`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  getOne: async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create task');
    }
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  complete: async (id, child_id, notes) => {
    const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ child_id, notes })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to complete task');
    }
    return res.json();
  },

  reorder: async (taskIds) => {
    const res = await fetch(`${API_URL}/tasks/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ task_ids: taskIds })
    });
    if (!res.ok) throw new Error('Failed to reorder tasks');
    return res.json();
  },

  uncomplete: async (id, child_id) => {
    const res = await fetch(`${API_URL}/tasks/${id}/uncomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ child_id })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to uncomplete task');
    }
    return res.json();
  },

  getCompletionsForDate: async (date) => {
    const res = await fetch(`${API_URL}/tasks/completions?date=${date}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch completions');
    return res.json();
  },

  completeForDate: async (id, child_id, date) => {
    const res = await fetch(`${API_URL}/tasks/${id}/complete-for-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ child_id, date })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to complete task');
    }
    return res.json();
  },

  uncompleteForDate: async (id, child_id, date) => {
    const res = await fetch(`${API_URL}/tasks/${id}/uncomplete-for-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ child_id, date })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to uncomplete task');
    }
    return res.json();
  }
};
