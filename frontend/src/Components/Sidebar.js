import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaHome,
  FaStickyNote,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaScroll } from "react-icons/fa";
import "./sidebar.css";
import { useAuth } from "../Authentication/AuthContext";
import { useSide } from "./SidebarContext"
import { API_BASE_URL } from "../App/config.js";

function Sidebar() {

  const {activeSection, setActiveSection} = useSide();

  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [userLoading, setUserLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = (name) => {
    setActiveSection(name);
    navigate(`/${name}`);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user info");
        const data = await response.json();

        setUsername(data.username);
      } catch (err) {
        console.error("Error loading user info:", err);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserInfo();
  }, [token]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <FaScroll
          className={`logo-icon ${activeSection === "home" ? "active" : ""}`}
          onClick={() => handleNavigation("home")}
        ></FaScroll>
      </div>

      <div className="sidebar-content">
        {/* User Profile Section */}
        <div className="user-profile" onClick={() => navigate("/user")}>
          <div className="avatar-container">
            <FaUserCircle className="user-avatar" />
          </div>
          <div className="user-info">
            {userLoading ? (
              <span className="nb-skeleton user-name-skeleton" aria-label="Loading username" />
            ) : (
              <div className="user-name">{username}</div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <div className="menu-label">MENU</div>
          <ul>
            <li
              className={`nav-item ${activeSection === "home" ? "active" : ""}`}
              onClick={() => handleNavigation("home")}
            >
              <div className="nav-item-content">
                <FaHome className="nav-icon" />
                <span>Home</span>
              </div>
              {activeSection === "home" && (
                <div className="active-indicator"></div>
              )}
            </li>
            <li
              className={`nav-item ${activeSection === "notes" ? "active" : ""}`}
              onClick={() => handleNavigation("notes")}
            >
              <div className="nav-item-content">
                <FaStickyNote className="nav-icon" />
                <span>Notes</span>
              </div>
              {activeSection === "notes" && (
                <div className="active-indicator"></div>
              )}
            </li>
          </ul>
        </nav>
        {/* Logout Button */}
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
