const API_URL = '/api';

export const uploadsAPI = {
  uploadUserImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/uploads/users/me/profile-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to upload image');
    }
    return res.json();
  },

  removeUserImage: async () => {
    const res = await fetch(`${API_URL}/uploads/users/me/profile-image`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove image');
    }
    return res.json();
  },

  uploadChildImage: async (childId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/uploads/children/${childId}/profile-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to upload image');
    }
    return res.json();
  },

  removeChildImage: async (childId) => {
    const res = await fetch(`${API_URL}/uploads/children/${childId}/profile-image`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove image');
    }
    return res.json();
  }
};
