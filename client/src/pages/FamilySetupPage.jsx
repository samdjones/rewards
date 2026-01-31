import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPages.module.css';

const FamilySetupPage = () => {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, hasFamily, createFamily, joinFamily } = useAuth();
  const navigate = useNavigate();

  // If already has family, redirect to dashboard
  if (hasFamily) {
    return <Navigate to="/" replace />;
  }

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createFamily(familyName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await joinFamily(inviteCode);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>Welcome, {user?.name}!</h1>
          <h2 className={styles.subtitle}>Set Up Your Family</h2>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' }}>
            To start tracking rewards, you need to be part of a family.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              className={styles.submitBtn}
              onClick={() => setMode('create')}
            >
              Create a New Family
            </button>

            <button
              className={styles.submitBtn}
              style={{ backgroundColor: '#10B981' }}
              onClick={() => setMode('join')}
            >
              Join with Invite Code
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            If another parent has already set up your family, ask them for the invite code.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>Create Family</h1>
          <h2 className={styles.subtitle}>Give your family a name</h2>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleCreateFamily} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="familyName">Family Name</label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., The Smith Family"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating...' : 'Create Family'}
            </button>
          </form>

          <p className={styles.switchText}>
            <button
              onClick={() => { setMode(null); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 600 }}
            >
              Go Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>Join Family</h1>
          <h2 className={styles.subtitle}>Enter your invite code</h2>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleJoinFamily} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="inviteCode">Invite Code</label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABCD1234"
                required
                maxLength={8}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Joining...' : 'Join Family'}
            </button>
          </form>

          <p className={styles.switchText}>
            <button
              onClick={() => { setMode(null); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 600 }}
            >
              Go Back
            </button>
          </p>
        </div>
      </div>
    );
  }
};

export default FamilySetupPage;
