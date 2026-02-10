import React, { useRef, useState } from 'react';
import styles from './ImageUpload.module.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUpload = ({ currentImage, onUpload, onRemove, uploading }) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 2MB.');
      return;
    }

    onUpload(file);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        {currentImage ? (
          <img src={currentImage} alt="Profile" className={styles.previewImage} />
        ) : (
          <div className={styles.placeholder}>No photo</div>
        )}
      </div>
      <div className={styles.actions}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.uploadBtn}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {currentImage && (
          <button
            type="button"
            onClick={onRemove}
            className={styles.removeBtn}
            disabled={uploading}
          >
            Remove
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default ImageUpload;
