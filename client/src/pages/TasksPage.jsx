import React, { useState, useEffect } from 'react';
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    point_value: '',
    category: '',
    is_recurring: false
  });
  const [completeData, setCompleteData] = useState({ child_id: '', notes: '' });
  const [error, setError] = useState('');

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
        is_recurring: formData.is_recurring
      });
      setShowModal(false);
      setFormData({ name: '', description: '', point_value: '', category: '', is_recurring: false });
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

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p>No tasks yet. Click "Add Task" to create one!</p>
        </div>
      ) : (
        <div className={styles.tasksList}>
          {tasks.map(task => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskInfo}>
                <h3 className={styles.taskName}>{task.name}</h3>
                {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                <div className={styles.taskMeta}>
                  <span className={styles.points}>{task.point_value} pts</span>
                  {task.category && <span className={styles.category}>{task.category}</span>}
                  {task.is_recurring && <span className={styles.recurring}>Recurring</span>}
                </div>
              </div>
              <div className={styles.taskActions}>
                <button onClick={() => openCompleteModal(task)} className={styles.completeBtn}>
                  Complete
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

            <div className={styles.checkboxGroup}>
              <input
                id="is_recurring"
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              />
              <label htmlFor="is_recurring">Recurring task</label>
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
    </div>
  );
};

export default TasksPage;
