import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familiesAPI } from '../api/families';
import styles from './FamilySettingsPage.module.css';

const FamilySettingsPage = () => {
  const { user, isAdmin, leaveFamily, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const membersData = await familiesAPI.getMembers();
      setMembers(membersData.members);

      if (isAdmin) {
        const codeData = await familiesAPI.getInviteCode();
        setInviteCode(codeData.invite_code);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure? The old invite code will stop working.')) return;

    try {
      setActionLoading(true);
      const data = await familiesAPI.regenerateInviteCode();
      setInviteCode(data.invite_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert('Invite code copied to clipboard!');
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await familiesAPI.updateMemberRole(userId, newRole);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the family?`)) return;

    try {
      setActionLoading(true);
      await familiesAPI.removeMember(userId);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm('Are you sure you want to leave this family? You will lose access to all family data.')) return;

    try {
      setActionLoading(true);
      await leaveFamily();
      navigate('/family/setup');
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!confirm('Are you sure you want to DELETE this family? This will remove all children, tasks, rewards, and history. This cannot be undone!')) return;
    if (!confirm('This is your last warning. All family data will be permanently deleted. Continue?')) return;

    try {
      setActionLoading(true);
      await familiesAPI.delete();
      await refreshUser();
      navigate('/family/setup');
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleResetHistory = async () => {
    if (!confirm('Are you sure you want to reset all history? This will:\n\n• Set all kids\' points to 0\n• Clear all task completion history\n• Clear all reward redemption history\n\nThis cannot be undone!')) return;

    try {
      setActionLoading(true);
      await familiesAPI.resetHistory();
      alert('All history has been reset successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{user?.family?.name}</h1>
      <p className={styles.subtitle}>Family Settings</p>

      {error && <div className={styles.error}>{error}</div>}

      {/* Invite Code Section (Admin Only) */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Invite Code</h2>
          <p className={styles.sectionDescription}>
            Share this code with other parents to invite them to your family.
          </p>

          <div className={styles.inviteCodeBox}>
            <code className={styles.inviteCode}>
              {showInviteCode ? inviteCode : '********'}
            </code>
            <div className={styles.inviteCodeActions}>
              <button
                onClick={() => setShowInviteCode(!showInviteCode)}
                className={styles.btnSecondary}
              >
                {showInviteCode ? 'Hide' : 'Show'}
              </button>
              {showInviteCode && (
                <button onClick={handleCopyCode} className={styles.btnSecondary}>
                  Copy
                </button>
              )}
              <button
                onClick={handleRegenerateCode}
                className={styles.btnSecondary}
                disabled={actionLoading}
              >
                Regenerate
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Members Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Family Members</h2>

        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>
                  {member.name}
                  {member.id === user.id && ' (you)'}
                </span>
                <span className={styles.memberEmail}>{member.email}</span>
              </div>

              <div className={styles.memberActions}>
                <span className={`${styles.roleBadge} ${member.role === 'admin' ? styles.adminBadge : ''}`}>
                  {member.role}
                </span>

                {isAdmin && member.id !== user.id && (
                  <>
                    <button
                      onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                      className={styles.btnSmall}
                      disabled={actionLoading}
                    >
                      {member.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className={`${styles.btnSmall} ${styles.btnDanger}`}
                      disabled={actionLoading}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className={`${styles.section} ${styles.dangerSection}`}>
        <h2 className={styles.sectionTitle}>Danger Zone</h2>

        <div className={styles.dangerActions}>
          <div className={styles.dangerItem}>
            <div>
              <strong>Leave Family</strong>
              <p>You will lose access to all family data.</p>
            </div>
            <button
              onClick={handleLeaveFamily}
              className={styles.btnDanger}
              disabled={actionLoading}
            >
              Leave Family
            </button>
          </div>

          {isAdmin && (
            <div className={styles.dangerItem}>
              <div>
                <strong>Reset All History</strong>
                <p>Reset all points to zero and clear task completion and reward redemption history.</p>
              </div>
              <button
                onClick={handleResetHistory}
                className={styles.btnDanger}
                disabled={actionLoading}
              >
                Reset History
              </button>
            </div>
          )}

          {isAdmin && (
            <div className={styles.dangerItem}>
              <div>
                <strong>Delete Family</strong>
                <p>Permanently delete the family and all its data.</p>
              </div>
              <button
                onClick={handleDeleteFamily}
                className={styles.btnDanger}
                disabled={actionLoading}
              >
                Delete Family
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FamilySettingsPage;
