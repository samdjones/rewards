const API_URL = '/api';

export const familiesAPI = {
  // Create a new family
  create: async (name) => {
    const res = await fetch(`${API_URL}/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create family');
    }
    return res.json();
  },

  // Get current user's family
  getCurrent: async () => {
    const res = await fetch(`${API_URL}/families/current`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get family');
    }
    return res.json();
  },

  // Update family settings
  update: async (data) => {
    const res = await fetch(`${API_URL}/families/current`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update family');
    }
    return res.json();
  },

  // Delete family
  delete: async () => {
    const res = await fetch(`${API_URL}/families/current`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete family');
    }
    return res.json();
  },

  // Join family via invite code
  join: async (inviteCode) => {
    const res = await fetch(`${API_URL}/families/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ invite_code: inviteCode })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to join family');
    }
    return res.json();
  },

  // Leave current family
  leave: async () => {
    const res = await fetch(`${API_URL}/families/leave`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to leave family');
    }
    return res.json();
  },

  // Get family members
  getMembers: async () => {
    const res = await fetch(`${API_URL}/families/current/members`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get members');
    }
    return res.json();
  },

  // Update member role
  updateMemberRole: async (userId, role) => {
    const res = await fetch(`${API_URL}/families/current/members/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update member role');
    }
    return res.json();
  },

  // Remove member from family
  removeMember: async (userId) => {
    const res = await fetch(`${API_URL}/families/current/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove member');
    }
    return res.json();
  },

  // Get invite code (admin only)
  getInviteCode: async () => {
    const res = await fetch(`${API_URL}/families/current/invite-code`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get invite code');
    }
    return res.json();
  },

  // Regenerate invite code (admin only)
  regenerateInviteCode: async () => {
    const res = await fetch(`${API_URL}/families/current/invite-code/regenerate`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to regenerate invite code');
    }
    return res.json();
  },

  // Reset all history (admin only)
  resetHistory: async () => {
    const res = await fetch(`${API_URL}/families/current/reset-history`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to reset history');
    }
    return res.json();
  }
};
