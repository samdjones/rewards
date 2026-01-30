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
  const [selectedReward, setSelectedReward] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_cost: '',
    category: ''
  });
  const [redeemData, setRedeemData] = useState({ child_id: '', notes: '' });
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

    try {
      await rewardsAPI.redeem(selectedReward.id, redeemData.child_id, redeemData.notes);
      setShowRedeemModal(false);
      setRedeemData({ child_id: '', notes: '' });
      setSelectedReward(null);
      alert('Reward redeemed successfully!');
      loadData();
    } catch (err) {
      setError(err.message);
    }
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
    setShowRedeemModal(true);
  };

  const getChildPoints = (childId) => {
    const child = children.find(c => c.id === parseInt(childId));
    return child ? child.current_points : 0;
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
              <label htmlFor="child">Select Child *</label>
              <select
                id="child"
                value={redeemData.child_id}
                onChange={(e) => setRedeemData({ ...redeemData, child_id: e.target.value })}
                required
              >
                <option value="">Choose a child...</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name} ({child.current_points} pts)
                  </option>
                ))}
              </select>
            </div>

            {redeemData.child_id && (
              <div className={styles.pointsCheck}>
                {getChildPoints(redeemData.child_id) >= selectedReward.point_cost ? (
                  <span className={styles.sufficient}>
                    ✓ Sufficient points
                  </span>
                ) : (
                  <span className={styles.insufficient}>
                    ✗ Not enough points (need {selectedReward.point_cost})
                  </span>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                rows="2"
                value={redeemData.notes}
                onChange={(e) => setRedeemData({ ...redeemData, notes: e.target.value })}
              />
            </div>

            <div className={styles.costInfo}>
              Will deduct {selectedReward.point_cost} points
            </div>

            <button type="submit" className={styles.submitBtn}>Redeem Reward</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RewardsPage;
