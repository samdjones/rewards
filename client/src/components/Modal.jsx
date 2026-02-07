import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ children, onClose, title }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-title">
        <div className={styles.header}>
          <h3 id="modal-title">{title}</h3>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">✕</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
