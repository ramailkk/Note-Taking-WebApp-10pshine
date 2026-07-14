import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../App/config.js";
import { FaBook, FaCheck, FaTimes, FaEdit, FaTrash, FaBookOpen, FaExclamationTriangle } from "react-icons/fa";
import "./Notebooks.css";

const Notebooks = () => {
    const [notebooks, setNotebooks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    // Fetch notebooks on mount
    const fetchNotebooks = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notebooks`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setNotebooks(data.notebooks || []);
            } else {
                setError(data.error || "Failed to fetch notebooks");
            }
        } catch (err) {
            console.error("Error fetching notebooks:", err);
            setError("Failed to load notebooks");
        }
    }, [token]);

    useEffect(() => {
        fetchNotebooks();
    }, [fetchNotebooks]);

    // Create new notebook
    const handleCreateNotebook = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/notebooks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notebookName: "New Notebook" }),
            });

            const data = await response.json();

            if (response.ok) {
                setNotebooks((prev) => [data.notebook, ...prev]);
            } else {
                setError(data.error || "Failed to create notebook");
            }
        } catch (err) {
            console.error("Error creating notebook:", err);
            setError("Failed to create notebook");
        } finally {
            setIsLoading(false);
        }
    };

    // Start editing notebook name
    const handleStartEdit = (notebook) => {
        setEditingId(notebook.id);
        setEditingName(notebook.notebook_name);
    };

    // Save edited notebook name
    const handleSaveEdit = async (notebookId) => {
        if (!editingName.trim()) {
            setEditingId(null);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notebookName: editingName.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setNotebooks((prev) =>
                    prev.map((nb) => (nb.id === notebookId ? data.notebook : nb))
                );
                setEditingId(null);
            } else {
                setError(data.error || "Failed to update notebook");
            }
        } catch (err) {
            console.error("Error updating notebook:", err);
            setError("Failed to update notebook");
        }
    };

    // Delete notebook
    const handleDeleteNotebook = async (notebookId, notebookName) => {
        if (notebookName === "Uncategorized") {
            setError("Cannot delete the Uncategorized notebook");
            return;
        }

        if (!window.confirm(`Delete "${notebookName}"? All notes will be moved to Uncategorized.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotebooks((prev) => prev.filter((nb) => nb.id !== notebookId));
            } else {
                const data = await response.json();
                setError(data.error || "Failed to delete notebook");
            }
        } catch (err) {
            console.error("Error deleting notebook:", err);
            setError("Failed to delete notebook");
        }
    };

    // Navigate to notebook's notes view
    const handleOpenNotebook = (notebookId) => {
        navigate(`/notebooks/${notebookId}`);
    };

    return (
        <div className="notebooks-container">
            {/* Header */}
            <div className="notebooks-header">
                <h1 className="notebooks-heading fade-in">Notebooks</h1>
                <button
                    className="add-notebook-btn"
                    onClick={handleCreateNotebook}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "+ New Notebook"}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="notebooks-error">
                    <span><FaExclamationTriangle /> {error}</span>
                    <button onClick={() => setError(null)} className="error-close">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Notebooks Grid */}
            {notebooks.length > 0 ? (
                <div className="notebooks-grid">
                    {notebooks.map((notebook) => (
                        <div
                            key={notebook.id}
                            className="notebook-card"
                            onClick={() => editingId !== notebook.id && handleOpenNotebook(notebook.id)}
                        >
                            {editingId === notebook.id ? (
                                <div className="notebook-edit-mode" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        className="notebook-name-input"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") handleSaveEdit(notebook.id);
                                            if (e.key === "Escape") setEditingId(null);
                                        }}
                                        autoFocus
                                        maxLength={255}
                                    />
                                    <div className="edit-actions">
                                        <button
                                            className="save-btn"
                                            onClick={() => handleSaveEdit(notebook.id)}
                                        >
                                            <FaCheck />
                                        </button>
                                        <button className="cancel-btn" onClick={() => setEditingId(null)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="notebook-icon"><FaBook /></div>
                                    <h3 className="notebook-title">{notebook.notebook_name}</h3>
                                    <p className="notebook-note-count">
                                        {notebook.note_count} {notebook.note_count === 1 ? "note" : "notes"}
                                    </p>
                                    <div className="notebook-footer" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="rename-btn"
                                            onClick={() => handleStartEdit(notebook)}
                                            title="Rename notebook"
                                        >
                                            <FaEdit />
                                        </button>
                                        {notebook.notebook_name !== "Uncategorized" && (
                                            <button
                                                className="delete-notebook-btn"
                                                onClick={() => handleDeleteNotebook(notebook.id, notebook.notebook_name)}
                                                title="Delete notebook"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="notebooks-empty-state">
                    <div className="empty-state-icon"><FaBookOpen /></div>
                    <h3 className="empty-state-title">No notebooks yet</h3>
                    <p className="empty-state-text">
                        Create your first notebook to organize your notes!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Notebooks;
