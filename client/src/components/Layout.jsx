import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Kids Reward Tracker</h1>
          {user && (
            <div className={styles.userInfo}>
              <span>Hi, {user.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {user && (
        <nav className={styles.nav}>
          <Link to="/" className={isActive('/') ? styles.activeLink : ''}>Dashboard</Link>
          <Link to="/tasks" className={isActive('/tasks') ? styles.activeLink : ''}>Tasks</Link>
          <Link to="/rewards" className={isActive('/rewards') ? styles.activeLink : ''}>Rewards</Link>
        </nav>
      )}

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
