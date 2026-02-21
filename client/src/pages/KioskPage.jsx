import React, { useState, useEffect, useRef, useCallback } from 'react';
import { kioskAPI } from '../api/kiosk';
import Avatar from '../components/Avatar';
import styles from './KioskPage.module.css';

const POLL_INTERVAL = 3000;
const REFRESH_INTERVAL = 30000;
const PHOTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VERSION_CHECK_INTERVAL = 60000; // 1 minute

const WMO_EMOJI = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const getWeatherEmoji = (code) => WMO_EMOJI[code] ?? '🌡️';

const formatHourLabel = (isoTime) => {
  const d = new Date(isoTime);
  const h = d.getHours();
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

const KioskPage = () => {
  const [state, setState] = useState('loading'); // loading, pairing, dashboard
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [busTimesData, setBusTimesData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showingPhoto, setShowingPhoto] = useState(false);
  const [photoFade, setPhotoFade] = useState(true);
  const pollRef = useRef(null);
  const refreshRef = useRef(null);
  const countdownRef = useRef(null);
  const sessionTokenRef = useRef('');
  const requestCodeRef = useRef(null);

  const requestCode = useCallback(async () => {
    try {
      // Pass existing session token so code refresh keeps the same session
      const data = await kioskAPI.generateCode(sessionTokenRef.current || undefined);
      setCode(data.code);
      setSessionToken(data.session_token);
      sessionTokenRef.current = data.session_token;
      setExpiresAt(new Date(data.expires_at));
      setState('pairing');
    } catch (_err) {
      // Retry after a delay
      setTimeout(() => requestCodeRef.current(), 5000);
    }
  }, []);

  useEffect(() => { requestCodeRef.current = requestCode; }, [requestCode]);

  const loadPhotos = useCallback(async () => {
    try {
      const data = await kioskAPI.getPhotos();
      setPhotos(data.photos || []);
    } catch (_err) {
      // Photos are non-critical
    }
  }, []);

  // Try to load dashboard data (in case we're already paired via cookie)
  useEffect(() => {
    const tryExistingSession = async () => {
      try {
        const data = await kioskAPI.getDashboardData();
        setDashboardData(data);
        setFamilyName(data.family.name);
        setState('dashboard');
        kioskAPI.getWeather().then(setWeatherData).catch(() => {});
        kioskAPI.getBusTimes().then(setBusTimesData).catch(() => {});
        loadPhotos();
      } catch (_err) {
        // Not paired yet, request a code
        requestCode();
      }
    };
    tryExistingSession();
  }, [requestCode, loadPhotos]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'pairing' || !expiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        requestCode();
      }
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => clearInterval(countdownRef.current);
  }, [state, expiresAt, requestCode]);

  // Poll for pairing status
  useEffect(() => {
    if (state !== 'pairing' || !sessionToken) return;

    const poll = async () => {
      try {
        const data = await kioskAPI.checkStatus(sessionToken);
        if (data.paired) {
          setFamilyName(data.family_name);
          // Load dashboard data
          const dashData = await kioskAPI.getDashboardData();
          setDashboardData(dashData);
          setState('dashboard');
          kioskAPI.getWeather().then(setWeatherData).catch(() => {});
          kioskAPI.getBusTimes().then(setBusTimesData).catch(() => {});
          loadPhotos();
        }
      } catch (_err) {
        // Ignore poll errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [state, sessionToken, loadPhotos]);

  // Auto-refresh dashboard data and photos when settings change
  const prevSlideshowSettingsRef = useRef('');

  useEffect(() => {
    if (state !== 'dashboard') return;

    const refresh = async () => {
      try {
        const data = await kioskAPI.getDashboardData();
        setDashboardData(data);
        setFamilyName(data.family.name);
        kioskAPI.getWeather().then(setWeatherData).catch(() => {});
        kioskAPI.getBusTimes().then(setBusTimesData).catch(() => {});

        // Re-fetch photos/bus when settings change
        const settingsKey = `${data.family?.slideshow_mode}|${data.family?.slideshow_include_avatars}|${data.family?.bus_stop_atco_code}|${data.family?.bus_route_filter}`;
        if (prevSlideshowSettingsRef.current && prevSlideshowSettingsRef.current !== settingsKey) {
          loadPhotos();
        }
        prevSlideshowSettingsRef.current = settingsKey;
      } catch (_err) {
        // If auth fails, go back to pairing
        setState('loading');
        requestCode();
      }
    };

    refreshRef.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(refreshRef.current);
  }, [state, requestCode, loadPhotos]);

  // Refresh photos periodically
  useEffect(() => {
    if (state !== 'dashboard') return;

    const interval = setInterval(loadPhotos, PHOTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [state, loadPhotos]);

  // Auto-reload when app is redeployed (detects changed asset hashes in index.html)
  const indexHtmlRef = useRef(null);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch('/', { cache: 'no-store' });
        const html = await res.text();
        if (indexHtmlRef.current === null) {
          indexHtmlRef.current = html;
        } else if (indexHtmlRef.current !== html) {
          window.location.reload();
        }
      } catch (_err) {
        // Network error, skip
      }
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Photo cycling effect
  const slideshowMode = dashboardData?.family?.slideshow_mode || 'off';
  const slideshowInterval = (dashboardData?.family?.slideshow_interval || 30) * 1000;

  useEffect(() => {
    if (state !== 'dashboard' || slideshowMode === 'off' || photos.length === 0) return;

    const tick = () => {
      // Fade out
      setPhotoFade(false);

      setTimeout(() => {
        if (slideshowMode === 'fullscreen') {
          setShowingPhoto(prev => {
            if (prev) {
              // Was showing photo, go back to dashboard, advance index
              setCurrentPhotoIndex(i => (i + 1) % photos.length);
            }
            return !prev;
          });
        } else {
          // dedicated mode: just advance photo
          setCurrentPhotoIndex(i => (i + 1) % photos.length);
        }
        // Fade in
        setPhotoFade(true);
      }, 400);
    };

    const interval = setInterval(tick, slideshowInterval);
    return () => clearInterval(interval);
  }, [state, slideshowMode, slideshowInterval, photos.length]);

  // Clamp photo index when photos array changes
  const safePhotoIndex = photos.length > 0 ? currentPhotoIndex % photos.length : 0;

  if (state === 'loading') {
    return <div className={styles.kiosk}><div className={styles.versionLabel}>v{__APP_VERSION__}</div><div className={styles.loading}>Loading...</div></div>;
  }

  if (state === 'pairing') {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
      <div className={styles.kiosk}>
        <div className={styles.versionLabel}>v{__APP_VERSION__}</div>
        <div className={styles.pairingView}>
          <h1 className={styles.pairingTitle}>Kiosk Display</h1>
          <p className={styles.pairingInstructions}>
            Enter this code in Family Settings to pair this display
          </p>
          <div className={styles.codeDisplay}>
            {code.split('').map((char, i) => (
              <span key={i} className={styles.codeChar}>{char}</span>
            ))}
          </div>
          <div className={styles.timer}>
            Code expires in {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  const { family, children, tasks, completions, deductions } = dashboardData || {};

  const today = new Date().toISOString().split('T')[0];

  const getTasksForToday = () => {
    if (!tasks) return [];
    const d = new Date(today + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHolidayMode = family?.holiday_mode;

    return tasks.filter(task => {
      if (isHolidayMode) {
        if (task.repeat_schedule === 'daily') return true;
        if (task.repeat_schedule === 'holidays') return true;
        if (task.repeat_schedule === 'weekdays') return false;
        if (task.repeat_schedule === 'weekends') return false;
        if (task.repeat_schedule === 'none') return true;
        return false;
      }
      if (task.repeat_schedule === 'holidays') return false;
      if (task.repeat_schedule === 'daily') return true;
      if (task.repeat_schedule === 'weekdays' && !isWeekend) return true;
      if (task.repeat_schedule === 'weekends' && isWeekend) return true;
      if (task.repeat_schedule === 'none') return true;
      return false;
    });
  };

  const completionMap = {};
  if (completions) {
    completions.forEach(c => {
      const key = `${c.task_id}-${c.child_id}`;
      completionMap[key] = (completionMap[key] || 0) + 1;
    });
  }

  const getDailyPoints = (childId) => {
    let points = 0;
    getTasksForToday().forEach(task => {
      const count = completionMap[`${task.id}-${childId}`] || 0;
      points += task.point_value * count;
    });
    return points;
  };

  const tasksForToday = getTasksForToday();
  const currentPhoto = photos.length > 0 ? photos[safePhotoIndex] : null;

  // Fullscreen photo mode
  if (slideshowMode === 'fullscreen' && showingPhoto && currentPhoto) {
    return (
      <div className={styles.kiosk}>
        <div className={styles.versionLabel}>v{__APP_VERSION__}</div>
        <div className={`${styles.fullscreenPhoto} ${photoFade ? styles.fadeIn : styles.fadeOut}`}>
          <img
            src={currentPhoto.image_data}
            alt={currentPhoto.caption || 'Family photo'}
            className={styles.fullscreenImage}
          />
          {currentPhoto.caption && (
            <div className={styles.photoCaption}>{currentPhoto.caption}</div>
          )}
        </div>
      </div>
    );
  }

  const dashboardContent = (
    <>
      {(!children || children.length === 0) ? (
        <div className={styles.emptyState}>No kids added yet</div>
      ) : tasksForToday.length === 0 ? (
        <div className={styles.emptyState}>No tasks scheduled for today</div>
      ) : (
        <div className={styles.taskGrid} style={{ '--child-count': children.length }}>
          <div className={styles.gridHeader}>
            <div className={styles.familyCol}>
              <Avatar
                profileImage={family?.profile_image}
                avatarColor="#6366f1"
                name={family?.name || 'F'}
                size={72}
              />
              <span className={styles.familyName}>{familyName}</span>
              <span className={styles.dateDisplay}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {children.map(child => (
              <div key={child.id} className={styles.childCol}>
                <Avatar profileImage={child.profile_image} avatarColor={child.avatar_color} name={child.name} size={72} />
                <span className={styles.childName} style={{ color: child.avatar_color }}>{child.name}</span>
                <span className={styles.childDailyPts}>{getDailyPoints(child.id)} pts today</span>
                <span className={styles.childTotalPts}>{child.current_points} pts total</span>
              </div>
            ))}
          </div>
          {tasksForToday.map(task => (
            <div key={task.id} className={styles.gridRow}>
              <div className={styles.taskCell}>
                <span className={styles.taskName}>{task.name}</span>
                <span className={styles.taskPts}>{task.point_value} pts</span>
              </div>
              {children.map(child => {
                const count = completionMap[`${task.id}-${child.id}`] || 0;
                return (
                  <div key={child.id} className={styles.statusCell}>
                    {task.repeat_schedule === 'none' ? (
                      count > 0 ? (
                        <span className={styles.completedBadge}>x{count}</span>
                      ) : (
                        <span className={styles.pendingBadge}>-</span>
                      )
                    ) : (
                      count > 0 ? (
                        <span className={styles.checkMark}>&#10003;</span>
                      ) : (
                        <span className={styles.pendingMark}>&#9675;</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {deductions && deductions.length > 0 && (
            <>
              <div className={styles.deductionsSeparator}>
                <span className={styles.deductionsSeparatorLabel}>Deductions</span>
              </div>
              {deductions.map(d => (
                <div key={d.id} className={styles.deductionRow}>
                  <div className={styles.taskCell}>
                    <span className={styles.deductionReason}>{d.reason || 'Point deduction'}</span>
                  </div>
                  {children.map(child => (
                    <div key={child.id} className={styles.statusCell}>
                      {d.child_id === child.id && (
                        <span className={styles.deductionBadge}>{d.amount} pts</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {weatherData?.enabled && weatherData.hours?.length > 0 && (
        <div className={styles.weatherStrip}>
          <span className={styles.weatherLocation}>{weatherData.location}</span>
          {weatherData.hours
            .filter((_, i) => i % 3 === 0)
            .slice(0, 8)
            .map((hour) => (
              <div key={hour.time} className={styles.weatherHour}>
                <span className={styles.weatherTime}>{formatHourLabel(hour.time)}</span>
                <span className={styles.weatherEmoji}>{getWeatherEmoji(hour.weatherCode)}</span>
                <span className={styles.weatherTemp}>{hour.temp}°</span>
                {hour.precipProb > 20 && (
                  <span className={styles.weatherPrecip}>{hour.precipProb}%</span>
                )}
              </div>
            ))}
        </div>
      )}
      {busTimesData?.enabled && busTimesData.departures?.length > 0 && (
        <div className={styles.busStrip}>
          <span className={styles.busStopName}>{busTimesData.stop_name}</span>
          {busTimesData.departures.map((dep, i) => (
            <div key={i} className={styles.busDeparture}>
              <span className={styles.busLine}>{dep.line}</span>
              <span className={styles.busDirection}>{dep.direction}</span>
              <span className={styles.busTime}>{dep.best_departure_estimate}</span>
              {dep.status === 'live' && <span className={styles.busLive}>LIVE</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );

  // Dedicated (side panel) mode
  if (slideshowMode === 'dedicated' && photos.length > 0 && currentPhoto) {
    return (
      <div className={styles.kiosk}>
        <div className={styles.versionLabel}>v{__APP_VERSION__}</div>
        <div className={styles.splitView}>
          <div className={styles.dashboardPane}>
            {dashboardContent}
          </div>
          <div className={styles.photoPane}>
            <img
              src={currentPhoto.image_data}
              alt={currentPhoto.caption || 'Family photo'}
              className={`${styles.slideshowImage} ${photoFade ? styles.fadeIn : styles.fadeOut}`}
            />
            {currentPhoto.caption && (
              <div className={styles.photoCaption}>{currentPhoto.caption}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal mode (off or no photos)
  return (
    <div className={styles.kiosk}>
      <div className={styles.versionLabel}>v{__APP_VERSION__}</div>
      <div className={styles.dashboardView}>
        {dashboardContent}
      </div>
    </div>
  );
};

export default KioskPage;
