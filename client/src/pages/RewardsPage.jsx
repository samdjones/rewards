import React, { useState, useEffect } from 'react';
import { rewardsAPI } from '../api/rewards';
import { childrenAPI } from '../api/children';
import Modal from '../components/Modal';
import styles from './RewardsPage.module.css';

const RewardsPage = () => {
  const [rewards, setRewards] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_cost: '',
    category: ''
  });
  const [redeemData, setRedeemData] = useState({ selectedChildIds: [], notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rewardsRes, childrenRes] = await Promise.all([
        rewardsAPI.getAll(),
        childrenAPI.getAll()
      ]);
      setRewards(rewardsRes.rewards);
      setChildren(childrenRes.children);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await rewardsAPI.create({
        name: formData.name,
        description: formData.description,
        point_cost: parseInt(formData.point_cost),
        category: formData.category || null
      });
      setShowModal(false);
      setFormData({ name: '', description: '', point_cost: '', category: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError('');

    if (redeemData.selectedChildIds.length === 0) {
      setError('Please select at least one kid');
      return;
    }

    try {
      await rewardsAPI.redeem(selectedReward.id, redeemData.selectedChildIds, redeemData.notes);
      setShowRedeemModal(false);
      setRedeemData({ selectedChildIds: [], notes: '' });
      setSelectedReward(null);
      alert('Reward redeemed successfully!');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleChildSelection = (childId) => {
    setRedeemData(prev => {
      const isSelected = prev.selectedChildIds.includes(childId);
      return {
        ...prev,
        selectedChildIds: isSelected
          ? prev.selectedChildIds.filter(id => id !== childId)
          : [...prev.selectedChildIds, childId]
      };
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      await rewardsAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Failed to delete reward');
    }
  };

  const openRedeemModal = (reward) => {
    setSelectedReward(reward);
    setRedeemData({ selectedChildIds: [], notes: '' });
    setShowRedeemModal(true);
  };

  const openEditModal = (reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      point_cost: reward.point_cost.toString(),
      category: reward.category || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await rewardsAPI.update(editingReward.id, {
        name: formData.name,
        description: formData.description,
        point_cost: parseInt(formData.point_cost),
        category: formData.category || null
      });
      setShowEditModal(false);
      setEditingReward(null);
      setFormData({ name: '', description: '', point_cost: '', category: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.rewardsPage}>
      <div className={styles.header}>
        <h2>Rewards</h2>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + Add Reward
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className={styles.empty}>
          <p>No rewards yet. Click "Add Reward" to create one!</p>
        </div>
      ) : (
        <div className={styles.rewardsList}>
          {rewards.map(reward => (
            <div key={reward.id} className={styles.rewardCard}>
              <div className={styles.rewardInfo}>
                <h3 className={styles.rewardName}>{reward.name}</h3>
                {reward.description && <p className={styles.rewardDesc}>{reward.description}</p>}
                <div className={styles.rewardMeta}>
                  <span className={styles.cost}>{reward.point_cost} pts</span>
                  {reward.category && <span className={styles.category}>{reward.category}</span>}
                </div>
              </div>
              <div className={styles.rewardActions}>
                <button onClick={() => openRedeemModal(reward)} className={styles.redeemBtn}>
                  Redeem
                </button>
                <button onClick={() => openEditModal(reward)} className={styles.editBtn}>
                  Edit
                </button>
                <button onClick={() => handleDelete(reward.id)} className={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Add Reward">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Reward Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="point_cost">Point Cost *</label>
              <input
                id="point_cost"
                type="number"
                min="1"
                value={formData.point_cost}
                onChange={(e) => setFormData({ ...formData, point_cost: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Toys, Activities, Treats"
              />
            </div>

            <button type="submit" className={styles.submitBtn}>Add Reward</button>
          </form>
        </Modal>
      )}

      {showRedeemModal && selectedReward && (
        <Modal onClose={() => setShowRedeemModal(false)} title={`Redeem: ${selectedReward.name}`}>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleRedeem} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Select Kids *</label>
              <div className={styles.childCheckboxes}>
                {children.map(child => {
                  const hasEnoughPoints = child.current_points >= selectedReward.point_cost;
                  const isSelected = redeemData.selectedChildIds.includes(child.id);
                  return (
                    <label
                      key={child.id}
                      className={`${styles.childCheckbox} ${!hasEnoughPoints ? styles.insufficientChild : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChildSelection(child.id)}
                        disabled={!hasEnoughPoints}
                      />
                      <span className={styles.childName}>{child.name}</span>
                      <span className={styles.childPoints}>
                        {child.current_points} pts
                        {!hasEnoughPoints && <span className={styles.needMore}> (need {selectedReward.point_cost})</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                rows="2"
                value={redeemData.notes}
                onChange={(e) => setRedeemData({ ...redeemData, notes: e.target.value })}
              />
            </div>

            {redeemData.selectedChildIds.length > 0 && (
              <div className={styles.costInfo}>
                Will deduct {selectedReward.point_cost} points from {redeemData.selectedChildIds.length} kid{redeemData.selectedChildIds.length > 1 ? 's' : ''} ({selectedReward.point_cost * redeemData.selectedChildIds.length} total)
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>Redeem Reward</button>
          </form>
        </Modal>
      )}

      {showEditModal && editingReward && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Reward">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleEdit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-name">Reward Name *</label>
              <input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-point_cost">Point Cost *</label>
              <input
                id="edit-point_cost"
                type="number"
                min="1"
                value={formData.point_cost}
                onChange={(e) => setFormData({ ...formData, point_cost: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-category">Category</label>
              <input
                id="edit-category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Toys, Activities, Treats"
              />
            </div>

            <button type="submit" className={styles.submitBtn}>Save Changes</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RewardsPage;
