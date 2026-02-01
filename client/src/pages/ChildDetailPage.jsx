import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { childrenAPI } from '../api/children';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ChildDetailPage.module.css';

const ChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [childRes, activityRes, statsRes] = await Promise.all([
        childrenAPI.getOne(id),
        childrenAPI.getActivity(id),
        childrenAPI.getStats(id)
      ]);
      setChild(childRes.child);
      setActivity(activityRes.activity);
      setStats(statsRes);
    } catch (err) {
      alert('Failed to load child data');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const handleResetPoints = async () => {
    if (!confirm(`Are you sure you want to reset ${child.name}'s points to zero? This will deduct ${child.current_points} points.`)) {
      return;
    }

    try {
      await childrenAPI.adjustPoints(id, -child.current_points, 'Points reset to zero');
      loadData();
    } catch (err) {
      alert('Failed to reset points');
    }
  };

  if (!child || !stats) {
    return <div className={styles.error}>Child not found</div>;
  }

  const chartData = stats.pointsOverTime.reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    points: item.points
  }));

  return (
    <div className={styles.detailPage}>
      <button onClick={() => navigate('/')} className={styles.backBtn}>
        ← Back to Dashboard
      </button>

      <div className={styles.header}>
        <div className={styles.avatar} style={{ backgroundColor: child.avatar_color }}>
          {child.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.headerInfo}>
          <h2>{child.name}</h2>
          {child.age && <p className={styles.age}>Age {child.age}</p>}
          <div className={styles.currentPoints}>
            <span className={styles.pointsValue}>{child.current_points}</span>
            <span className={styles.pointsLabel}>current points</span>
          </div>
          <button
            onClick={handleResetPoints}
            className={styles.resetBtn}
            disabled={child.current_points === 0}
          >
            Reset Points
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.stats.totalTasksCompleted}</div>
          <div className={styles.statLabel}>Tasks Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.stats.totalPointsEarned}</div>
          <div className={styles.statLabel}>Total Points Earned</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.stats.totalRewardsRedeemed}</div>
          <div className={styles.statLabel}>Rewards Redeemed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.stats.totalPointsSpent}</div>
          <div className={styles.statLabel}>Points Spent</div>
        </div>
      </div>

      {stats.badges.length > 0 && (
        <div className={styles.badgesSection}>
          <h3>Achievements</h3>
          <div className={styles.badges}>
            {stats.badges.map((badge, idx) => (
              <div key={idx} className={styles.badge}>
                <span className={styles.badgeIcon}>{badge.icon}</span>
                <span className={styles.badgeName}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className={styles.chartSection}>
          <h3>Points Earned Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="points" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.activitySection}>
        <h3>Recent Activity</h3>
        {activity.length === 0 ? (
          <p className={styles.noActivity}>No activity yet</p>
        ) : (
          <div className={styles.activityList}>
            {activity.map((item, idx) => (
              <div key={idx} className={styles.activityItem}>
                {item.type === 'completion' && (
                  <>
                    <div className={styles.activityIcon} style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                      ✓
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>Completed: {item.task_name}</div>
                      <div className={styles.activityMeta}>
                        +{item.points_earned} points • {new Date(item.completed_at).toLocaleString()}
                      </div>
                      {item.notes && <div className={styles.activityNotes}>{item.notes}</div>}
                    </div>
                  </>
                )}
                {item.type === 'redemption' && (
                  <>
                    <div className={styles.activityIcon} style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      🎁
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>Redeemed: {item.reward_name}</div>
                      <div className={styles.activityMeta}>
                        -{item.points_spent} points • {new Date(item.redeemed_at).toLocaleString()}
                      </div>
                      {item.notes && <div className={styles.activityNotes}>{item.notes}</div>}
                    </div>
                  </>
                )}
                {item.type === 'adjustment' && (
                  <>
                    <div className={styles.activityIcon} style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                      ±
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>Point Adjustment</div>
                      <div className={styles.activityMeta}>
                        {item.amount > 0 ? '+' : ''}{item.amount} points • {new Date(item.adjusted_at).toLocaleString()}
                      </div>
                      {item.reason && <div className={styles.activityNotes}>{item.reason}</div>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildDetailPage;
