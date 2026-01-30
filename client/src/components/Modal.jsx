import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ children, onClose, title }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
