import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadsAPI } from "../api/uploads";
import Avatar from "./Avatar";
import ImageUpload from "./ImageUpload";
import styles from "./Layout.module.css";

const Layout = ({ children }) => {
  const { user, logout, hasFamily, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  const handleUserImageUpload = async (file) => {
    try {
      setUploading(true);
      await uploadsAPI.uploadUserImage(file);
      await refreshUser();
    } catch (_err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUserImageRemove = async () => {
    try {
      setUploading(true);
      await uploadsAPI.removeUserImage();
      await refreshUser();
    } catch (_err) {
      alert("Failed to remove image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Kids Reward Tracker</h1>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.profileButton} ref={dropdownRef}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <Avatar
                    profileImage={user.profile_image}
                    avatarColor="#ffffff"
                    name={user.name}
                    size={32}
                  />
                  <span>Hi, {user.name}</span>
                </button>
                {showProfileDropdown && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileDropdownContent}>
                      <ImageUpload
                        currentImage={user.profile_image}
                        onUpload={handleUserImageUpload}
                        onRemove={handleUserImageRemove}
                        uploading={uploading}
                      />
                    </div>
                  </div>
                )}
              </div>
              {user.family && (
                <span className={styles.familyName}>{user.family.name}</span>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {user && hasFamily && (
        <nav className={styles.nav}>
          <Link to="/" className={isActive("/") ? styles.activeLink : ""}>
            Dashboard
          </Link>
          <Link
            to="/kids"
            className={isActive("/kids") ? styles.activeLink : ""}
          >
            Kids
          </Link>
          <Link
            to="/tasks"
            className={isActive("/tasks") ? styles.activeLink : ""}
          >
            Tasks
          </Link>
          <Link
            to="/rewards"
            className={isActive("/rewards") ? styles.activeLink : ""}
          >
            Rewards
          </Link>
          <Link
            to="/family/settings"
            className={isActive("/family/settings") ? styles.activeLink : ""}
          >
            Family
          </Link>
        </nav>
      )}

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <span className={styles.version}>v{__APP_VERSION__}</span>
      </footer>
    </div>
  );
};

export default Layout;
