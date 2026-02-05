import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { childrenAPI } from '../api/children';
import ChildCard from '../components/ChildCard';
import Modal from '../components/Modal';
import styles from './KidsPage.module.css';

const KidsPage = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', age: '', avatar_color: '#3B82F6' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll();
      setChildren(data.children);
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
    </div>
  );
};

export default KidsPage;
