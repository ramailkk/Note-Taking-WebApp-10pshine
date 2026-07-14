import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../App/config.js";
import NotesGrid from "../Dashboard/NotesGrid";
import "./NotebookNotes.css";

const NotebookNotes = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notebook, setNotebook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    const fetchNotebookWithNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/notebooks/${id}/notes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setNotebook(data.notebook);
            } else {
                setError(data.error || "Failed to load notebook");
            }
        } catch (err) {
            console.error("Error fetching notebook:", err);
            setError("Failed to load notebook");
        } finally {
            setIsLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        fetchNotebookWithNotes();
    }, [fetchNotebookWithNotes]);

    // Create new note in this notebook
    const handleCreateNote = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/note/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notebookId: id }),
            });

            const data = await response.json();

            if (response.ok) {
                // Navigate to notes editor with the new note and notebook context
                navigate(`/notes?noteId=${data.id}&notebookId=${id}`);
            } else {
                setError(data.error || "Failed to create note");
            }
        } catch (err) {
            console.error("Error creating note:", err);
            setError("Failed to create note");
        }
    };

    if (isLoading) {
        return (
            <div className="notebook-notes-container">
                <div className="loading-state">Loading...</div>
            </div>
        );
    }

    if (error || !notebook) {
        return (
            <div className="notebook-notes-container">
                <div className="error-state">
                    <p>⚠️ {error || "Notebook not found"}</p>
                    <button onClick={() => navigate("/notebooks")} className="back-btn">
                        ← Back to Notebooks
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="notebook-notes-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate("/notebooks")}>
                    Notebooks
                </span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{notebook.notebook_name}</span>
            </div>

            {/* Header */}
            <div className="notebook-notes-header">
                <div>
                    <h1 className="notebook-notes-heading fade-in">{notebook.notebook_name}</h1>
                    <p className="notebook-notes-count">
                        {notebook.notes.length} {notebook.notes.length === 1 ? "note" : "notes"}
                    </p>
                </div>
                <button className="add-note-btn" onClick={handleCreateNote}>
                    + New Note
                </button>
            </div>

            {/* Notes Grid */}
            {notebook.notes.length > 0 ? (
                <NotesGrid filteredAndSortedNotes={notebook.notes} gridGap={24} notebookId={id} />
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3 className="empty-state-title">No notes in this notebook yet</h3>
                    <p className="empty-state-text">
                        Create a note from the Notes tab and move it to this notebook!
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotebookNotes;
