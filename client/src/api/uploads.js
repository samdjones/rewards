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
  },

  uploadFamilyImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/uploads/families/current/profile-image`, {
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

  removeFamilyImage: async () => {
    const res = await fetch(`${API_URL}/uploads/families/current/profile-image`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove image');
    }
    return res.json();
  },

  uploadFamilyPhoto: async (file, caption) => {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    const res = await fetch(`${API_URL}/uploads/families/current/photos`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to upload photo');
    }
    return res.json();
  },

  getFamilyPhotos: async () => {
    const res = await fetch(`${API_URL}/uploads/families/current/photos`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get photos');
    }
    return res.json();
  },

  deleteFamilyPhoto: async (id) => {
    const res = await fetch(`${API_URL}/uploads/families/current/photos/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete photo');
    }
    return res.json();
  }
};
