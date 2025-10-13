import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProtectedData, updateProfile, deleteProfile, logoutUser, uploadProfileImage, removeProfileImage } from "../api";
import "./Profile.css";

const THEMES = [
  { 
    id: "warm", 
    name: "Warm Uplift", 
    description: "Cozy orange and coral tones",
    colors: ["#ff7856", "#ef6444", "#ff6b6b", "#ffa726"]
  },
  { 
    id: "calm", 
    name: "Calm Dawn", 
    description: "Peaceful blue and sky tones",
    colors: ["#6ab1ff", "#4d97e6", "#64b5f6", "#81c784"]
  },
  { 
    id: "mint", 
    name: "Mint Fresh", 
    description: "Refreshing green and mint tones",
    colors: ["#5acb99", "#42b184", "#66bb6a", "#81c784"]
  },
  { 
    id: "lavender", 
    name: "Lavender Dream", 
    description: "Soothing purple and lavender tones",
    colors: ["#9c88ff", "#8c7ae6", "#a29bfe", "#6c5ce7"]
  },
  { 
    id: "rose", 
    name: "Rose Garden", 
    description: "Gentle pink and rose tones",
    colors: ["#fd79a8", "#e84393", "#f8bbd9", "#f48fb1"]
  },
  { 
    id: "sunset", 
    name: "Sunset Glow", 
    description: "Warm sunset and amber tones",
    colors: ["#ff7675", "#fdcb6e", "#e17055", "#d63031"]
  }
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("theme") || "warm");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  const fetchUserProfile = async () => {
    try {
      const response = await getProtectedData();
      setUser(response.data.user);
      setEditForm({
        username: response.data.user.username || "",
        email: response.data.user.email || ""
      });
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load profile");
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: user.username || "",
      email: user.email || ""
    });
  };

  const handleSave = async () => {
    try {
      const response = await updateProfile(editForm);
      setUser(response.data.user);
      setIsEditing(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deleteProfile();
        navigate("/login");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete account");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      // Even if logout fails, redirect to login
      navigate("/login");
    }
  };

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await uploadProfileImage(formData);
      if (response.data.profileImage) {
        setUser(prev => ({ ...prev, profileImage: response.data.profileImage }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.profileImage) return;

    if (window.confirm("Are you sure you want to remove your profile image?")) {
      try {
        await removeProfileImage();
        setUser(prev => ({ ...prev, profileImage: null }));
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to remove image");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="profile">
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Top Nav */}
      <header className="topnav">
        <div className="container nav-inner">
          <a href="/" className="logo">
            <img src='/logo.jpeg' alt="logo" />
            CalmSpace
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="/home">Dashboard</a>
            <a href="/journal">Write a journal</a>
            <a href="/profile" className="active">Profile</a>
            <button onClick={handleLogout} className="nav-logout">Logout</button>
          </nav>
        </div>
      </header>

      <div className="container">
        <section className="profile-hero">
          <div className="profile-header">
            <h1 className="profile-title">Your Profile</h1>
            <p className="profile-sub">Manage your account settings and preferences</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="profile-card">
            <div className="profile-avatar">
              {user?.profileImage ? (
                <div className="avatar-container">
                  <img
                    src={`http://localhost:5001${user.profileImage}`}
                    alt="Profile"
                    className="avatar-image"
                  />
                  <div className="avatar-overlay">
                    <label htmlFor="image-upload" className="avatar-upload-btn">
                      📷
                    </label>
                    <button
                      onClick={handleRemoveImage}
                      className="avatar-remove-btn"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="avatar-container">
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="avatar-overlay">
                    <label htmlFor="image-upload" className="avatar-upload-btn">
                      📷
                    </label>
                  </div>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="upload-indicator">
                  <div className="spinner"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <div className="field">
                    <label htmlFor="username" className="label">Username</label>
                    <input
                      id="username"
                      type="text"
                      className="input"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="email" className="label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="input"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="profile-actions">
                    <button onClick={handleSave} className="btn btn-primary">
                      Save Changes
                    </button>
                    <button onClick={handleCancel} className="btn btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-details">
                  <div className="detail-item">
                    <span className="detail-label">Username</span>
                    <span className="detail-value">{user?.username || "Not set"}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{user?.email || "Not set"}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Account Status</span>
                    <span className={`detail-value status-${user?.isVerified ? 'verified' : 'pending'}`}>
                      {user?.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="profile-actions">
                    <button onClick={handleEdit} className="btn btn-primary">
                      Edit Profile
                    </button>
                    <button onClick={handleDelete} className="btn btn-danger">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-sections">
            <div className="section-card theme-selector">
              <h3>Choose Your Theme</h3>
              <p>Personalize your CalmSpace experience with beautiful color schemes.</p>
              <div className="theme-grid">
                {THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="theme-preview">
                      {theme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="color-swatch"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="theme-info">
                      <h4>{theme.name}</h4>
                      <p>{theme.description}</p>
                    </div>
                    {currentTheme === theme.id && (
                      <div className="theme-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h3>Account Security</h3>
              <p>Your account is protected with secure authentication and encryption.</p>
              <div className="security-features">
                <div className="security-item">
                  <span className="security-icon">🔒</span>
                  <span>End-to-end encryption</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">🛡️</span>
                  <span>JWT token authentication</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">📧</span>
                  <span>Email verification required</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3>Data Privacy</h3>
              <p>Your personal data and journal entries are kept private and secure.</p>
              <ul className="privacy-list">
                <li>Your data is never shared with third parties</li>
                <li>All communications are encrypted</li>
                <li>You have full control over your account</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} CalmSpace</p>
        </div>
      </footer>
    </div>
  );
}
