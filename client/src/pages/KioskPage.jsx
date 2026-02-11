import React, { useState, useEffect, useRef, useCallback } from 'react';
import { kioskAPI } from '../api/kiosk';
import Avatar from '../components/Avatar';
import styles from './KioskPage.module.css';

const POLL_INTERVAL = 3000;
const REFRESH_INTERVAL = 30000;

const KioskPage = () => {
  const [state, setState] = useState('loading'); // loading, pairing, dashboard
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const pollRef = useRef(null);
  const refreshRef = useRef(null);
  const countdownRef = useRef(null);
  const sessionTokenRef = useRef('');

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
      setTimeout(requestCode, 5000);
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
      } catch (_err) {
        // Not paired yet, request a code
        requestCode();
      }
    };
    tryExistingSession();
  }, [requestCode]);

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
        }
      } catch (_err) {
        // Ignore poll errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [state, sessionToken]);

  // Auto-refresh dashboard data
  useEffect(() => {
    if (state !== 'dashboard') return;

    const refresh = async () => {
      try {
        const data = await kioskAPI.getDashboardData();
        setDashboardData(data);
        setFamilyName(data.family.name);
      } catch (_err) {
        // If auth fails, go back to pairing
        setState('loading');
        requestCode();
      }
    };

    refreshRef.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(refreshRef.current);
  }, [state, requestCode]);

  if (state === 'loading') {
    return <div className={styles.kiosk}><div className={styles.loading}>Loading...</div></div>;
  }

  if (state === 'pairing') {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
      <div className={styles.kiosk}>
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
  const { family, children, tasks, completions } = dashboardData || {};

  const today = new Date().toISOString().split('T')[0];

  const getTasksForToday = () => {
    if (!tasks) return [];
    const d = new Date(today + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return tasks.filter(task => {
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

  return (
    <div className={styles.kiosk}>
      <div className={styles.dashboardView}>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskPage;
