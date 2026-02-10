import React from 'react';
import styles from './Avatar.module.css';

const Avatar = ({ profileImage, avatarColor, name, size = 40, className = '' }) => {
  const sizeStyle = { width: `${size}px`, height: `${size}px` };

  if (profileImage) {
    return (
      <div className={`${styles.avatar} ${className}`} style={sizeStyle}>
        <img
          src={profileImage}
          alt={name}
          className={styles.avatarImage}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles.avatarFallback} ${className}`}
      style={{ ...sizeStyle, backgroundColor: avatarColor || '#3B82F6', fontSize: `${size * 0.45}px` }}
    >
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

export default Avatar;
