import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { childrenAPI } from '../api/children';
import { rewardsAPI } from '../api/rewards';
import { uploadsAPI } from '../api/uploads';
import ChildCard from '../components/ChildCard';
import RedeemModal from '../components/RedeemModal';
import ImageUpload from '../components/ImageUpload';
import Modal from '../components/Modal';
import styles from './KidsPage.module.css';

const KidsPage = () => {
  const [children, setChildren] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [redeemChild, setRedeemChild] = useState(null);
  const [editingChildId, setEditingChildId] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', avatar_color: '#3B82F6' });
  const [editFormData, setEditFormData] = useState({ name: '', age: '', avatar_color: '#3B82F6' });
  const [editChildImage, setEditChildImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const [childrenData, rewardsData] = await Promise.all([
        childrenAPI.getAll(),
        rewardsAPI.getAll()
      ]);
      setChildren(childrenData.children);
      setRewards(rewardsData.rewards);
    } catch (_err) {
      setError('Failed to load kids');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await childrenAPI.create({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        avatar_color: formData.avatar_color
      });
      setShowModal(false);
      setFormData({ name: '', age: '', avatar_color: '#3B82F6' });
      loadChildren();
    } catch (_err) {
      setError('Failed to create kid');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this kid? All associated data will be removed.')) {
      return;
    }

    try {
      await childrenAPI.delete(id);
      loadChildren();
    } catch (_err) {
      alert('Failed to delete kid');
    }
  };

  const openEditModal = (id) => {
    const child = children.find(c => c.id === id);
    if (!child) return;
    setEditingChildId(id);
    setEditFormData({
      name: child.name,
      age: child.age ? child.age.toString() : '',
      avatar_color: child.avatar_color || '#3B82F6'
    });
    setEditChildImage(child.profile_image || null);
    setShowEditModal(true);
  };

  const handleEditImageUpload = async (file) => {
    if (!editingChildId) return;
    try {
      setUploading(true);
      const data = await uploadsAPI.uploadChildImage(editingChildId, file);
      setEditChildImage(data.profile_image);
      loadChildren();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditImageRemove = async () => {
    if (!editingChildId) return;
    try {
      setUploading(true);
      await uploadsAPI.removeChildImage(editingChildId);
      setEditChildImage(null);
      loadChildren();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await childrenAPI.update(editingChildId, {
        name: editFormData.name,
        age: editFormData.age ? parseInt(editFormData.age) : null,
        avatar_color: editFormData.avatar_color
      });
      setShowEditModal(false);
      setEditingChildId(null);
      loadChildren();
    } catch (_err) {
      setError('Failed to update kid');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.kidsPage}>
      <div className={styles.header}>
        <h2>My Kids</h2>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + Add Kid
        </button>
      </div>

      {children.length === 0 ? (
        <div className={styles.empty}>
          <p>No kids added yet. Click "Add Kid" to get started!</p>
        </div>
      ) : (
        <div className={styles.kidsGrid}>
          {children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              onDelete={handleDelete}
              onEdit={openEditModal}
              onRedeem={(id) => setRedeemChild(children.find(c => c.id === id))}
              onClick={() => navigate(`/children/${child.id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Add Kid">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="age">Age (optional)</label>
              <input
                id="age"
                type="number"
                min="0"
                max="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="color">Avatar Color</label>
              <input
                id="color"
                type="color"
                value={formData.avatar_color}
                onChange={(e) => setFormData({ ...formData, avatar_color: e.target.value })}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>Add Kid</button>
          </form>
        </Modal>
      )}

      {redeemChild && (
        <RedeemModal
          child={redeemChild}
          rewards={rewards}
          onClose={() => setRedeemChild(null)}
          onRedeemed={() => { setRedeemChild(null); loadChildren(); }}
        />
      )}

      {showEditModal && (
        <Modal onClose={() => { setShowEditModal(false); setEditingChildId(null); }} title="Edit Kid">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleEditSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="edit_name">Name *</label>
              <input
                id="edit_name"
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_age">Age (optional)</label>
              <input
                id="edit_age"
                type="number"
                min="0"
                max="18"
                value={editFormData.age}
                onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_color">Avatar Color</label>
              <input
                id="edit_color"
                type="color"
                value={editFormData.avatar_color}
                onChange={(e) => setEditFormData({ ...editFormData, avatar_color: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Profile Picture</label>
              <ImageUpload
                currentImage={editChildImage}
                onUpload={handleEditImageUpload}
                onRemove={handleEditImageRemove}
                uploading={uploading}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>Save Changes</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default KidsPage;
