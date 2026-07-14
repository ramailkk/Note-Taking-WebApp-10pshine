import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
import { useAuth } from '../Authentication/AuthContext';
import { API_BASE_URL } from '../App/config.js';
import './Settings.css';

function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const { token } = useAuth();

    // Profile state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Preferences state
    const [darkMode, setDarkMode] = useState(() => {
        // Initialize from localStorage
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });
    const [emailNotifications, setEmailNotifications] = useState(true);

    // Effect to toggle dark mode on body
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/user/info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username || '');
                    setEmail(data.email || '');
                    if (data.profile_picture) {
                        setProfilePic(data.profile_picture);
                    }
                }
            } catch (err) {
                console.error('Error loading user info:', err);
            }
        };
        fetchUserInfo();
    }, [token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });

        try {
            // Update profile picture if changed
            if (profilePic) {
                const picResponse = await fetch(`${API_BASE_URL}/user/picture`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ profilePicture: profilePic }),
                });
                if (!picResponse.ok) {
                    const data = await picResponse.json();
                    throw new Error(data.error || 'Failed to update profile picture');
                }
            }

            // Update username and email
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, email }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setProfileMessage({ type: 'error', text: err.message });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update password');
            }

            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.message });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="settings-container">
            <h1>Settings</h1>

            <div className="settings-tabs">
                <button
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    className={activeTab === 'password' ? 'active' : ''}
                    onClick={() => setActiveTab('password')}
                >
                    Password
                </button>
                <button
                    className={activeTab === 'preferences' ? 'active' : ''}
                    onClick={() => setActiveTab('preferences')}
                >
                    Preferences
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'profile' && (
                    <div className="settings-section">
                        <h2>Update Profile</h2>
                        {profileMessage.text && (
                            <div className={`message ${profileMessage.type}`}>
                                {profileMessage.text}
                            </div>
                        )}
                        <form className="settings-form" onSubmit={handleProfileUpdate}>
                            <div className="profile-picture-section">
                                <div className="profile-picture-preview">
                                    {profilePic ? (
                                        <img src={profilePic} alt="Profile" />
                                    ) : (
                                        <FaUserCircle className="placeholder-icon" />
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        id="profile-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="profile-upload" className="upload-btn">
                                        <FaCamera style={{ marginRight: '0.5rem' }} />
                                        Change Photo
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email"
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                Save Changes
                            </button>
                        </form>
                    </div>
                )}
                {activeTab === 'password' && (
                    <div className="settings-section">
                        <h2>Change Password</h2>
                        {passwordMessage.text && (
                            <div className={`message ${passwordMessage.type}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <form className="settings-form" onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                Update Password
                            </button>
                        </form>
                    </div>
                )}
                {activeTab === 'preferences' && (
                    <div className="settings-section">
                        <h2>Preferences</h2>
                        <div className="preference-item">
                            <div className="preference-info">
                                <h3>Dark Mode</h3>
                                <p>Enable dark theme for the application</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={() => setDarkMode(!darkMode)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="preference-item">
                            <div className="preference-info">
                                <h3>Email Notifications</h3>
                                <p>Receive email updates about your notes</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={emailNotifications}
                                    onChange={() => setEmailNotifications(!emailNotifications)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;