import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api";

const ProfileDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      // Even if logout fails, redirect to login
      navigate("/login");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        {user?.profileImage ? (
          <img
            src={`http://localhost:5001${user.profileImage}`}
            alt="Profile"
            className="profile-avatar-img"
          />
        ) : (
          <div className="profile-avatar-placeholder">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <div className="profile-info">
              {user?.profileImage ? (
                <img
                  src={`http://localhost:5001${user.profileImage}`}
                  alt="Profile"
                  className="profile-dropdown-avatar"
                />
              ) : (
                <div className="profile-dropdown-avatar-placeholder">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="profile-details">
                <div className="profile-name">{user?.username || "User"}</div>
                <div className="profile-email">{user?.email || ""}</div>
              </div>
            </div>
          </div>

          <div className="profile-dropdown-divider"></div>

          <div className="profile-dropdown-actions">
            <button
              className="profile-dropdown-item"
              onClick={handleProfileClick}
            >
              <span className="profile-dropdown-icon">👤</span>
              <span>Profile</span>
            </button>
            
            <button
              className="profile-dropdown-item"
              onClick={handleLogout}
            >
              <span className="profile-dropdown-icon">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
