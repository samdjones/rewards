import React, { useState } from 'react';
import { rewardsAPI } from '../api/rewards';
import Modal from './Modal';
import styles from './RedeemModal.module.css';

const RedeemModal = ({ child, rewards, onClose, onRedeemed }) => {
  const [redeeming, setRedeeming] = useState(null);

  const handleRedeem = async (reward) => {
    setRedeeming(reward.id);
    try {
      await rewardsAPI.redeem(reward.id, [child.id]);
      alert(`${reward.name} redeemed for ${child.name}!`);
      onRedeemed();
    } catch (_err) {
      alert('Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <Modal onClose={onClose} title={`Redeem for ${child.name}`}>
      <div className={styles.pointsBanner}>
        {child.name} has <strong>{child.current_points}</strong> points
      </div>
      {rewards.length === 0 ? (
        <p className={styles.empty}>No rewards available. Add rewards first!</p>
      ) : (
        <div className={styles.rewardList}>
          {rewards.map(reward => {
            const canAfford = child.current_points >= reward.point_cost;
            return (
              <div key={reward.id} className={`${styles.rewardItem} ${!canAfford ? styles.insufficientItem : ''}`}>
                <div className={styles.rewardInfo}>
                  <span className={styles.rewardName}>{reward.name}</span>
                  {reward.description && <span className={styles.rewardDesc}>{reward.description}</span>}
                  <span className={styles.rewardCost}>{reward.point_cost} pts</span>
                </div>
                <button
                  className={styles.redeemBtn}
                  disabled={!canAfford || redeeming === reward.id}
                  onClick={() => handleRedeem(reward)}
                >
                  {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default RedeemModal;
