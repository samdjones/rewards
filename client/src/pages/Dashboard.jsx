import React, { useState, useEffect, useCallback } from 'react';
import { childrenAPI } from '../api/children';
import { tasksAPI } from '../api/tasks';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isToday = selectedDate === getToday();
  const isYesterday = selectedDate === getYesterday();

  const loadData = useCallback(async () => {
    try {
      const [childrenData, tasksData] = await Promise.all([
        childrenAPI.getAll(),
        tasksAPI.getAll()
      ]);
      setChildren(childrenData.children);
      setTasks(tasksData.tasks);
    } catch (_err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompletions = useCallback(async () => {
    try {
      const data = await tasksAPI.getCompletionsForDate(selectedDate);
      const completionMap = {};
      data.completions.forEach(c => {
        completionMap[`${c.task_id}-${c.child_id}`] = true;
      });
      setCompletedTasks(completionMap);
    } catch (_err) {
      console.error('Failed to load completions');
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tasks.length > 0) {
      loadCompletions();
    }
  }, [tasks, loadCompletions]);

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll();
      setChildren(data.children);
    } catch (_err) {
      setError('Failed to load data');
    }
  };

  const getTasksForDate = (date) => {
    const d = new Date(date + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCurrentDay = date === getToday();

    return tasks.filter(task => {
      if (task.repeat_schedule === 'daily') return true;
      if (task.repeat_schedule === 'weekdays' && !isWeekend) return true;
      if (task.repeat_schedule === 'weekends' && isWeekend) return true;
      if (task.repeat_schedule === 'none' && isCurrentDay) return true;
      return false;
    });
  };

  const handleToggleComplete = async (taskId, childId) => {
    const key = `${taskId}-${childId}`;

    try {
      if (completedTasks[key]) {
        await tasksAPI.uncompleteForDate(taskId, childId, selectedDate);
        setCompletedTasks(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        await tasksAPI.completeForDate(taskId, childId, selectedDate);
        setCompletedTasks(prev => ({ ...prev, [key]: true }));
      }
      loadChildren();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  const getDailyPointsForChild = (childId) => {
    let points = 0;
    getTasksForDate(selectedDate).forEach(task => {
      if (completedTasks[`${task.id}-${childId}`]) {
        points += task.point_value;
      }
    });
    return points;
  };

  const formatDateDisplay = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const tasksForDate = getTasksForDate(selectedDate);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Dashboard</h2>
      </div>

      <div className={styles.dateSelector}>
        <button
          className={`${styles.dateBtn} ${isYesterday ? styles.activeDateBtn : ''}`}
          onClick={() => setSelectedDate(getYesterday())}
        >
          Yesterday
        </button>
        <button
          className={`${styles.dateBtn} ${isToday ? styles.activeDateBtn : ''}`}
          onClick={() => setSelectedDate(getToday())}
        >
          Today
        </button>
      </div>

      <div className={styles.currentDate}>
        {formatDateDisplay(selectedDate)}
      </div>

      {children.length === 0 ? (
        <div className={styles.empty}>
          <p>No kids added yet. Go to the Kids tab to add your first kid!</p>
        </div>
      ) : tasksForDate.length === 0 ? (
        <div className={styles.empty}>
          <p>No tasks scheduled for {isToday ? 'today' : 'this day'}. Go to the Tasks tab to add recurring tasks!</p>
        </div>
      ) : (
        <div className={styles.todaysTasks}>
          <h3>{isToday ? "Today's Tasks" : "Tasks"}</h3>
          <div className={styles.taskMatrix} style={{ '--child-count': children.length }}>
            <div className={styles.taskMatrixHeader}>
              <div className={styles.taskNameHeader}>Task</div>
              {children.map(child => (
                <div key={child.id} className={styles.childHeader}>
                  <span style={{ color: child.avatar_color }}>{child.name}</span>
                  <span className={styles.dailyPoints}>{getDailyPointsForChild(child.id)} points</span>
                </div>
              ))}
            </div>
            {tasksForDate.map(task => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskName}>
                  {task.name}
                  <span className={styles.taskPoints}>{task.point_value} pts</span>
                </div>
                {children.map(child => (
                  <div key={child.id} className={styles.taskCheckbox}>
                    <input
                      type="checkbox"
                      checked={!!completedTasks[`${task.id}-${child.id}`]}
                      onChange={() => handleToggleComplete(task.id, child.id)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
