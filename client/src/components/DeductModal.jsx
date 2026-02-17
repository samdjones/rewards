import React, { useState } from 'react';
import { childrenAPI } from '../api/children';
import Modal from './Modal';
import styles from './DeductModal.module.css';

const DeductModal = ({ child, onClose, onDeducted }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pts = parseInt(amount);
    if (!pts || pts <= 0) return;

    setSubmitting(true);
    try {
      await childrenAPI.adjustPoints(child.id, -pts, reason || 'Point deduction');
      onDeducted();
    } catch (_err) {
      alert('Failed to deduct points');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Deduct from ${child.name}`}>
      <div className={styles.pointsBanner}>
        {child.name} has <strong>{child.current_points}</strong> points
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="deduct_amount">Amount to deduct *</label>
          <input
            id="deduct_amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="Points to deduct"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="deduct_reason">Reason (optional)</label>
          <input
            id="deduct_reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Bad behaviour"
          />
        </div>
        <button
          type="submit"
          className={styles.deductBtn}
          disabled={submitting || !amount || parseInt(amount) <= 0}
        >
          {submitting ? 'Deducting...' : `Deduct ${amount ? amount : '0'} points`}
        </button>
      </form>
    </Modal>
  );
};

export default DeductModal;
