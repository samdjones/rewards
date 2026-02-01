import React, { useState, useEffect, useRef } from 'react';
import { tasksAPI } from '../api/tasks';
import { childrenAPI } from '../api/children';
import Modal from '../components/Modal';
import styles from './TasksPage.module.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_value: '',
    category: '',
    repeat_schedule: 'none'
  });
  const [completeData, setCompleteData] = useState({ child_id: '', notes: '' });
  const [error, setError] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const dragNodeRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, childrenRes] = await Promise.all([
        tasksAPI.getAll(),
        childrenAPI.getAll()
      ]);
      setTasks(tasksRes.tasks);
      setChildren(childrenRes.children);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await tasksAPI.create({
        name: formData.name,
        description: formData.description,
        point_value: parseInt(formData.point_value),
        category: formData.category || null,
        repeat_schedule: formData.repeat_schedule
      });
      setShowModal(false);
      setFormData({ name: '', description: '', point_value: '', category: '', repeat_schedule: 'none' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await tasksAPI.complete(selectedTask.id, completeData.child_id, completeData.notes);
      setShowCompleteModal(false);
      setCompleteData({ child_id: '', notes: '' });
      setSelectedTask(null);
      alert('Task completed successfully!');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      point_value: task.point_value.toString(),
      category: task.category || '',
      repeat_schedule: task.repeat_schedule
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await tasksAPI.update(editingTask.id, {
        name: formData.name,
        description: formData.description,
        point_value: parseInt(formData.point_value),
        category: formData.category || null,
        repeat_schedule: formData.repeat_schedule
      });
      setShowEditModal(false);
      setEditingTask(null);
      setFormData({ name: '', description: '', point_value: '', category: '', repeat_schedule: 'none' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    dragNodeRef.current = e.target;
    e.target.classList.add(styles.dragging);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = async (e) => {
    e.target.classList.remove(styles.dragging);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e, taskId) => {
    e.preventDefault();
    if (taskId !== draggedTaskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the card entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTaskId(null);
    }
  };

  const handleDrop = async (e, targetTaskId) => {
    e.preventDefault();

    if (draggedTaskId === null || draggedTaskId === targetTaskId) {
      setDragOverTaskId(null);
      return;
    }

    // Reorder tasks locally first (optimistic update)
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    setTasks(newTasks);
    setDragOverTaskId(null);

    // Persist to server
    try {
      const taskIds = newTasks.map(t => t.id);
      await tasksAPI.reorder(taskIds);
    } catch (err) {
      // Revert on error
      loadData();
      alert('Failed to reorder tasks');
    }
  };

  const calculateDailyPoints = () => {
    const days = {
      Sat: 0, Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0
    };

    tasks.forEach(task => {
      const pts = task.point_value;
      if (task.repeat_schedule === 'daily') {
        Object.keys(days).forEach(day => days[day] += pts);
      } else if (task.repeat_schedule === 'weekdays') {
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(day => days[day] += pts);
      } else if (task.repeat_schedule === 'weekends') {
        ['Sat', 'Sun'].forEach(day => days[day] += pts);
      }
    });

    return days;
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.tasksPage}>
      <div className={styles.header}>
        <h2>Tasks</h2>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + Add Task
        </button>
      </div>

      {tasks.length > 0 && (
        <div className={styles.pointsSummary}>
          <h3>Available Points Per Day</h3>
          <div className={styles.daysGrid}>
            {Object.entries(calculateDailyPoints()).map(([day, pts]) => (
              <div key={day} className={styles.dayColumn}>
                <span className={styles.dayName}>{day}</span>
                <span className={styles.dayPoints}>{pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p>No tasks yet. Click "Add Task" to create one!</p>
        </div>
      ) : (
        <div className={styles.tasksList}>
          {tasks.map(task => (
            <div
              key={task.id}
              className={`${styles.taskCard} ${dragOverTaskId === task.id ? styles.dragOver : ''}`}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, task.id)}
            >
              <div className={styles.dragHandle}>
                <span className={styles.gripIcon}>&#8942;&#8942;</span>
              </div>
              <div className={styles.taskInfo}>
                <h3 className={styles.taskName}>{task.name}</h3>
                {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                <div className={styles.taskMeta}>
                  <span className={styles.points}>{task.point_value} pts</span>
                  {task.category && <span className={styles.category}>{task.category}</span>}
                  {task.repeat_schedule !== 'none' && (
                    <span className={styles.recurring}>
                      {task.repeat_schedule === 'daily' && 'Daily'}
                      {task.repeat_schedule === 'weekdays' && 'Weekdays'}
                      {task.repeat_schedule === 'weekends' && 'Weekends'}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.taskActions}>
                <button onClick={() => openCompleteModal(task)} className={styles.completeBtn}>
                  Complete
                </button>
                <button onClick={() => openEditModal(task)} className={styles.editBtn}>
                  Edit
                </button>
                <button onClick={() => handleDelete(task.id)} className={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Add Task">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Task Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="point_value">Point Value *</label>
              <input
                id="point_value"
                type="number"
                min="0"
                value={formData.point_value}
                onChange={(e) => setFormData({ ...formData, point_value: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Chores, Homework, Behavior"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="repeat_schedule">Repeat Schedule</label>
              <select
                id="repeat_schedule"
                value={formData.repeat_schedule}
                onChange={(e) => setFormData({ ...formData, repeat_schedule: e.target.value })}
              >
                <option value="none">One-time task</option>
                <option value="daily">Every day (Mon-Sun)</option>
                <option value="weekdays">Weekdays only (Mon-Fri)</option>
                <option value="weekends">Weekends only (Sat-Sun)</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>Add Task</button>
          </form>
        </Modal>
      )}

      {showCompleteModal && selectedTask && (
        <Modal onClose={() => setShowCompleteModal(false)} title={`Complete: ${selectedTask.name}`}>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleComplete} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="child">Select Child *</label>
              <select
                id="child"
                value={completeData.child_id}
                onChange={(e) => setCompleteData({ ...completeData, child_id: e.target.value })}
                required
              >
                <option value="">Choose a child...</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                rows="2"
                value={completeData.notes}
                onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
              />
            </div>

            <div className={styles.pointsInfo}>
              Will award {selectedTask.point_value} points
            </div>

            <button type="submit" className={styles.submitBtn}>Mark Complete</button>
          </form>
        </Modal>
      )}

      {showEditModal && editingTask && (
        <Modal onClose={() => { setShowEditModal(false); setEditingTask(null); }} title="Edit Task">
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleEdit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="edit_name">Task Name *</label>
              <input
                id="edit_name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_description">Description</label>
              <textarea
                id="edit_description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_point_value">Point Value *</label>
              <input
                id="edit_point_value"
                type="number"
                min="0"
                value={formData.point_value}
                onChange={(e) => setFormData({ ...formData, point_value: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_category">Category</label>
              <input
                id="edit_category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Chores, Homework, Behavior"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit_repeat_schedule">Repeat Schedule</label>
              <select
                id="edit_repeat_schedule"
                value={formData.repeat_schedule}
                onChange={(e) => setFormData({ ...formData, repeat_schedule: e.target.value })}
              >
                <option value="none">One-time task</option>
                <option value="daily">Every day (Mon-Sun)</option>
                <option value="weekdays">Weekdays only (Mon-Fri)</option>
                <option value="weekends">Weekends only (Sat-Sun)</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>Save Changes</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TasksPage;
