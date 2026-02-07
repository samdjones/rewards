import React from 'react';
import styles from './ChildCard.module.css';

const ChildCard = ({ child, onDelete, onEdit, onClick }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(child.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(child.id);
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.avatar} style={{ backgroundColor: child.avatar_color }}>
        {child.name.charAt(0).toUpperCase()}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{child.name}</h3>
        {child.age && <p className={styles.age}>Age {child.age}</p>}
        <div className={styles.points}>
          <span className={styles.pointsValue}>{child.current_points}</span>
          <span className={styles.pointsLabel}>points</span>
        </div>
      </div>
      <button onClick={handleEdit} className={styles.editBtn} aria-label="Edit" title="Edit">
        ✎
      </button>
      <button onClick={handleDelete} className={styles.deleteBtn} aria-label="Delete" title="Delete">
        ✕
      </button>
    </div>
  );
};

export default ChildCard;
