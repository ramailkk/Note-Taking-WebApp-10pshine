import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../App/config.js";
import { useToast } from "../Components/Toast";
import { useConfirm } from "../Components/ConfirmModal";
import { FaTrash, FaExclamationTriangle, FaTimes, FaCheck } from "react-icons/fa";
import "./Tasks.css";

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const toast = useToast();
    const { confirm } = useConfirm();

    // Fetch tasks on mount
    const fetchTasks = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setTasks(data.tasks || []);
            } else {
                setError(data.error || "Failed to fetch tasks");
            }
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError("Failed to load tasks");
        }
    }, [token]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Add new task
    const handleAddTask = async (e) => {
        e.preventDefault();

        if (!newTaskText.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ taskText: newTaskText.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setTasks((prev) => [data.task, ...prev]);
                setNewTaskText("");
                toast.success("Task added!");
            } else {
                toast.error(data.error || "Failed to create task");
            }
        } catch (err) {
            console.error("Error creating task:", err);
            toast.error("Failed to create task");
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle task completion
    const handleToggleTask = async (taskId, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isCompleted: !currentStatus }),
            });

            const data = await response.json();

            if (response.ok) {
                setTasks((prev) =>
                    prev.map((task) =>
                        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
                    )
                );
            } else {
                toast.error(data.error || "Failed to update task");
            }
        } catch (err) {
            console.error("Error updating task:", err);
            toast.error("Failed to update task");
        }
    };

    // Delete task
    const handleDeleteTask = async (taskId) => {
        const confirmed = await confirm({
            title: 'Delete Task?',
            message: 'Are you sure you want to delete this task?',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setTasks((prev) => prev.filter((task) => task.id !== taskId));
                toast.success("Task deleted");
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete task");
            }
        } catch (err) {
            console.error("Error deleting task:", err);
            toast.error("Failed to delete task");
        }
    };

    // Delete all tasks
    const handleDeleteAllTasks = async () => {
        if (tasks.length === 0) return;

        const confirmed = await confirm({
            title: 'Delete All Tasks?',
            message: `Are you sure you want to delete all ${tasks.length} tasks? This cannot be undone.`,
            confirmText: 'Delete All',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/all`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTasks([]);
                toast.success(data.message || "All tasks deleted");
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete tasks");
            }
        } catch (err) {
            console.error("Error deleting all tasks:", err);
            toast.error("Failed to delete tasks");
        }
    };

    const completedCount = tasks.filter((t) => t.is_completed).length;
    const totalCount = tasks.length;

    return (
        <div className="tasks-container">
            <div className="tasks-header">
                <h1 className="tasks-heading fade-in">Your Tasks</h1>
                <div className="tasks-header-actions">
                    <span className="count-badge">
                        {completedCount} / {totalCount} completed
                    </span>
                    {tasks.length > 0 && (
                        <button
                            className="delete-all-btn"
                            onClick={handleDeleteAllTasks}
                            title="Delete all tasks"
                        >
                            <FaTrash /> Delete All
                        </button>
                    )}
                </div>
            </div>

            {/* Add Task Form */}
            <form className="add-task-form" onSubmit={handleAddTask}>
                <input
                    type="text"
                    className="task-input"
                    placeholder="Add a new task..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    disabled={isLoading}
                    maxLength={500}
                />
                <button
                    type="submit"
                    className="add-task-btn"
                    disabled={!newTaskText.trim() || isLoading}
                >
                    {isLoading ? "Adding..." : "Add Task"}
                </button>
            </form>

            {error && (
                <div className="tasks-error">
                    <span><FaExclamationTriangle /> {error}</span>
                    <button onClick={() => setError(null)} className="error-close">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Tasks List */}
            {tasks.length > 0 ? (
                <div className="tasks-list">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`task-item ${task.is_completed ? "completed" : ""}`}
                        >
                            <label className="task-checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={task.is_completed}
                                    onChange={() => handleToggleTask(task.id, task.is_completed)}
                                    className="task-checkbox"
                                />
                                <span className="checkbox-custom"></span>
                            </label>
                            <span className="task-text">{task.task_text}</span>
                            <button
                                className="delete-task-btn"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete task"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="tasks-empty-state">
                    <div className="empty-state-icon"><FaCheck /></div>
                    <h3 className="empty-state-title">No tasks yet</h3>
                    <p className="empty-state-text">
                        Add your first task above to get started!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Tasks;

