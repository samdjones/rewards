import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familiesAPI } from '../api/families';
import { uploadsAPI } from '../api/uploads';
import { kioskAPI } from '../api/kiosk';
import Avatar from '../components/Avatar';
import styles from './FamilySettingsPage.module.css';

const FamilySettingsPage = () => {
  const { user, isAdmin, leaveFamily, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [familyImage, setFamilyImage] = useState(user?.family?.profile_image || null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [kioskCode, setKioskCode] = useState('');
  const [kioskSessions, setKioskSessions] = useState([]);
  const [holidayMode, setHolidayMode] = useState(user?.family?.holiday_mode || 0);
  const [weatherLocation, setWeatherLocation] = useState(user?.family?.weather_location || '');
  const [weatherSaveStatus, setWeatherSaveStatus] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [slideshowMode, setSlideshowMode] = useState(user?.family?.slideshow_mode || 'off');
  const [slideshowInterval, setSlideshowInterval] = useState(user?.family?.slideshow_interval || 30);
  const [slideshowSaveStatus, setSlideshowSaveStatus] = useState('');
  const photoInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const membersData = await familiesAPI.getMembers();
      setMembers(membersData.members);

      if (isAdmin) {
        const codeData = await familiesAPI.getInviteCode();
        setInviteCode(codeData.invite_code);

        try {
          const sessions = await kioskAPI.getSessions();
          setKioskSessions(sessions);
        } catch (_err) {
          // Kiosk sessions are non-critical
        }

        try {
          const photosData = await uploadsAPI.getFamilyPhotos();
          setPhotos(photosData.photos);
        } catch (_err) {
          // Photos are non-critical
        }

        try {
          const familyData = await familiesAPI.getCurrent();
          if (familyData.family) {
            setSlideshowMode(familyData.family.slideshow_mode || 'off');
            setSlideshowInterval(familyData.family.slideshow_interval || 30);
          }
        } catch (_err) {
          // Slideshow settings are non-critical
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFamilyImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2MB.');
      return;
    }

    try {
      setImageUploading(true);
      setError('');
      const data = await uploadsAPI.uploadFamilyImage(file);
      setFamilyImage(data.profile_image);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleFamilyImageRemove = async () => {
    try {
      setImageUploading(true);
      setError('');
      await uploadsAPI.removeFamilyImage();
      setFamilyImage(null);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleToggleHolidayMode = async () => {
    try {
      setActionLoading(true);
      const result = await familiesAPI.toggleHolidayMode();
      setHolidayMode(result.holiday_mode);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveWeatherLocation = async () => {
    try {
      setActionLoading(true);
      setWeatherSaveStatus('');
      await familiesAPI.setWeatherLocation(weatherLocation);
      setWeatherSaveStatus('Saved');
      setTimeout(() => setWeatherSaveStatus(''), 3000);
    } catch (err) {
      setWeatherSaveStatus('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      setPhotoUploading(true);
      setError('');
      const data = await uploadsAPI.uploadFamilyPhoto(file);
      setPhotos(prev => [...prev, data.photo]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return;

    try {
      setError('');
      await uploadsAPI.deleteFamilyPhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveSlideshowSettings = async () => {
    try {
      setActionLoading(true);
      setSlideshowSaveStatus('');
      const result = await familiesAPI.updateSlideshowSettings({
        slideshow_mode: slideshowMode,
        slideshow_interval: slideshowInterval
      });
      setSlideshowMode(result.slideshow_mode);
      setSlideshowInterval(result.slideshow_interval);
      setSlideshowSaveStatus('Saved');
      setTimeout(() => setSlideshowSaveStatus(''), 3000);
    } catch (err) {
      setSlideshowSaveStatus('Error: ' + err.message);
    } finally {
      setActionLoading(false);
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

  const handlePairKiosk = async () => {
    if (!kioskCode.trim()) return;

    try {
      setActionLoading(true);
      setError('');
      await kioskAPI.pair(kioskCode.trim().toUpperCase());
      setKioskCode('');
      const sessions = await kioskAPI.getSessions();
      setKioskSessions(sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpairKiosk = async (sessionId) => {
    if (!confirm('Remove this kiosk display?')) return;

    try {
      setActionLoading(true);
      await kioskAPI.removeSession(sessionId);
      setKioskSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err.message);
    } finally {
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
      <div className={styles.familyHeader}>
        <div
          className={`${styles.familyImageWrapper} ${isAdmin ? styles.familyImageClickable : ''}`}
          onClick={isAdmin ? () => fileInputRef.current?.click() : undefined}
          title={isAdmin ? 'Click to change family picture' : undefined}
        >
          <Avatar
            profileImage={familyImage}
            avatarColor="#6366f1"
            name={user?.family?.name || 'F'}
            size={80}
          />
          {isAdmin && <div className={styles.familyImageOverlay}>{imageUploading ? '...' : 'Edit'}</div>}
        </div>
        {isAdmin && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFamilyImageUpload}
            className={styles.hiddenInput}
          />
        )}
        <div>
          <h1 className={styles.title}>{user?.family?.name}</h1>
          <p className={styles.subtitle}>Family Settings</p>
        </div>
        {isAdmin && familyImage && (
          <button
            onClick={handleFamilyImageRemove}
            className={styles.btnSecondary}
            disabled={imageUploading}
          >
            Remove Photo
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Holiday Mode Section (Admin Only) */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Holiday Mode</h2>
          <p className={styles.sectionDescription}>
            When enabled, holiday tasks replace weekday and weekend tasks.
          </p>
          <div className={styles.holidayToggleBox}>
            <label className={styles.toggleLabel}>
              <span className={styles.toggleStatus}>
                {holidayMode ? 'On' : 'Off'}
              </span>
              <div
                className={`${styles.toggleSwitch} ${holidayMode ? styles.toggleActive : ''}`}
                onClick={handleToggleHolidayMode}
                role="switch"
                aria-checked={!!holidayMode}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleHolidayMode(); } }}
              >
                <div className={styles.toggleKnob} />
              </div>
            </label>
          </div>
        </section>
      )}

      {/* Weather Display Section (Admin Only) */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Weather Display</h2>
          <p className={styles.sectionDescription}>
            Show a 24-hour weather strip on the kiosk. Enter a city name (e.g. London, UK).
            Leave blank to disable.
          </p>
          <div className={styles.kioskPairBox}>
            <input
              type="text"
              value={weatherLocation}
              onChange={(e) => setWeatherLocation(e.target.value)}
              placeholder="e.g. London, UK"
              className={styles.kioskInput}
            />
            <button
              onClick={handleSaveWeatherLocation}
              className={styles.btnSecondary}
              disabled={actionLoading}
            >
              Save
            </button>
          </div>
          {weatherSaveStatus && (
            <p className={weatherSaveStatus.startsWith('Error') ? styles.error : styles.successMsg}>
              {weatherSaveStatus}
            </p>
          )}
        </section>
      )}

      {/* Picture Frame Section (Admin Only) */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Picture Frame</h2>
          <p className={styles.sectionDescription}>
            Display family photos on the kiosk as a slideshow.
          </p>

          <div className={styles.slideshowSettings}>
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Display mode</label>
              <select
                value={slideshowMode}
                onChange={(e) => setSlideshowMode(e.target.value)}
                className={styles.settingSelect}
              >
                <option value="off">Off</option>
                <option value="dedicated">Side panel</option>
                <option value="fullscreen">Full-screen alternating</option>
              </select>
            </div>

            {slideshowMode !== 'off' && (
              <div className={styles.settingRow}>
                <label className={styles.settingLabel}>
                  Shuffle interval: {slideshowInterval}s
                </label>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={slideshowInterval}
                  onChange={(e) => setSlideshowInterval(Number(e.target.value))}
                  className={styles.settingRange}
                />
              </div>
            )}

            <div className={styles.settingRow}>
              <button
                onClick={handleSaveSlideshowSettings}
                className={styles.btnSecondary}
                disabled={actionLoading}
              >
                Save Settings
              </button>
              {slideshowSaveStatus && (
                <span className={slideshowSaveStatus.startsWith('Error') ? styles.error : styles.successMsg}>
                  {slideshowSaveStatus}
                </span>
              )}
            </div>
          </div>

          <div className={styles.photoUploadRow}>
            <button
              onClick={() => photoInputRef.current?.click()}
              className={styles.btnSecondary}
              disabled={photoUploading || photos.length >= 20}
            >
              {photoUploading ? 'Uploading...' : 'Add Photo'}
            </button>
            <span className={styles.photoCount}>{photos.length}/20 photos</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className={styles.hiddenInput}
            />
          </div>

          {photos.length > 0 && (
            <div className={styles.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.image_data} alt={photo.caption || 'Family photo'} className={styles.photoThumb} />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className={styles.photoDeleteBtn}
                    title="Delete photo"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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

      {/* Kiosk Display Section (Admin Only) */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Kiosk Display</h2>
          <p className={styles.sectionDescription}>
            Pair a wall-mounted screen to show a read-only dashboard. Open <code>/kiosk</code> on the display device and enter the code shown.
          </p>

          <div className={styles.kioskPairBox}>
            <input
              type="text"
              value={kioskCode}
              onChange={(e) => setKioskCode(e.target.value.toUpperCase())}
              placeholder="Enter pairing code"
              className={styles.kioskInput}
              maxLength={6}
            />
            <button
              onClick={handlePairKiosk}
              className={styles.btnSecondary}
              disabled={actionLoading || kioskCode.trim().length < 6}
            >
              Pair
            </button>
          </div>

          {kioskSessions.length > 0 && (
            <div className={styles.kioskSessionsList}>
              <h3 className={styles.kioskSessionsTitle}>Paired Displays</h3>
              {kioskSessions.map(session => (
                <div key={session.id} className={styles.kioskSessionItem}>
                  <div className={styles.kioskSessionInfo}>
                    <span>Paired by {session.paired_by_name}</span>
                    <span className={styles.kioskSessionDate}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnpairKiosk(session.id)}
                    className={`${styles.btnSmall} ${styles.btnDanger}`}
                    disabled={actionLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Members Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Family Members</h2>

        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <Avatar profileImage={member.profile_image} avatarColor="#3B82F6" name={member.name} size={36} />
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
