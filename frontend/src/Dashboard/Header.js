import React, { useMemo, useState } from "react";
import "./styles.css";
import { API_BASE_URL } from "../App/config";
import { useAuth } from "../Authentication/AuthContext";
import { useToast } from "../Components/Toast";

const Header = ({ userName, viewMode, setViewMode }) => {
  const { token } = useAuth();
  const toast = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const dayGreetings = [
    "Good morning,",
    "Welcome back,",
    "Top of the morning,",
    "Hello again,",
    "Hey there,"
  ];

  const nightGreetings = [
    "Good evening,",
    "Welcome back,",
    "Evening vibes,",
    "Hello again,",
    "Hey there,"
  ];

  const generalGreetings = [
    "Welcome back,",
    "Glad to see you,",
    "You're back!",
    "Welcome aboard,",
    "Nice to have you back,"
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const greeting = useMemo(() => {
    const time = getTimeOfDay();
    const pool = [...generalGreetings, ...(time === "day" ? dayGreetings : nightGreetings)];
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExtractTasks = async () => {
    setIsExtracting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/note-actions/extract-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.tasks && data.tasks.length > 0) {
          setExtractedTasks(data.tasks);
          setSelectedTasks(data.tasks.map((_, i) => i)); // Select all by default
          setShowTaskModal(true);
        } else {
          toast.info(data.message || "No tasks found in your notes");
        }
      } else {
        toast.error(data.error || "Failed to extract tasks");
      }
    } catch (err) {
      console.error("Error extracting tasks:", err);
      toast.error("Error analyzing notes");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateTasks = async () => {
    const tasksToCreate = selectedTasks.map(i => extractedTasks[i]);

    try {
      const response = await fetch(`${API_BASE_URL}/note-actions/create-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: tasksToCreate }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ ${data.message}`);
        setShowTaskModal(false);
        setExtractedTasks([]);
        setSelectedTasks([]);
      } else {
        toast.error(data.error || "Failed to create tasks");
      }
    } catch (err) {
      console.error("Error creating tasks:", err);
      toast.error("Error creating tasks");
    }
  };

  const toggleTaskSelection = (index) => {
    setSelectedTasks(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleMagicAction = (action) => {
    if (action === 'extract-tasks') handleExtractTasks();
  };

  return (
    <>
      <div className="dashboard-header">
        <h1 className="welcome-heading fade-in">{greeting} {userName}</h1>
        <div className="header-actions">
          {/* Magic Actions Dropdown */}
          <select
            className="magic-actions-dropdown-header"
            value=""
            onChange={(e) => {
              const action = e.target.value;
              if (action) handleMagicAction(action);
              e.target.value = '';
            }}
            disabled={isExtracting}
          >
            <option value="">{isExtracting ? '⏳ Analyzing...' : '✨ Magic Actions'}</option>
            <option value="extract-tasks">📋 Extract Tasks from Notes</option>
          </select>

          {setViewMode && (
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞ Grid
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
                title="Graph View"
              >
                🕸️ Network
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Extraction Modal */}
      {showTaskModal && (
        <div className="task-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <div className="task-modal-header">
              <h2>📋 Found Potential Tasks</h2>
              <button className="task-modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            <p className="task-modal-subtitle">Select tasks to add to your task list:</p>
            <div className="task-modal-list">
              {extractedTasks.map((task, index) => (
                <label key={index} className="task-modal-item">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(index)}
                    onChange={() => toggleTaskSelection(index)}
                  />
                  <div className="task-modal-item-content">
                    <span className="task-text">{task.text}</span>
                    <span className="task-source">From: {task.source}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="task-modal-actions">
              <button className="task-modal-cancel" onClick={() => setShowTaskModal(false)}>
                Cancel
              </button>
              <button
                className="task-modal-confirm"
                onClick={handleCreateTasks}
                disabled={selectedTasks.length === 0}
              >
                Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

