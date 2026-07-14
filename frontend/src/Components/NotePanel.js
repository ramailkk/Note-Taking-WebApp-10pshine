import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaRegStickyNote,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortAmountDown,
  FaSortAmountUpAlt,
} from "react-icons/fa";
import "./NotePanel.css";

import { API_BASE_URL } from "../App/config";
import { useAuth } from "../Authentication/AuthContext";
import { useNote } from "./NoteContext";
// Format date as "x minutes/hours/days ago"
const formatDate = (date) => {
  const parsedDate = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - parsedDate) / 1000);

  if (diff < 5) return "just now";
  if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
  if (diff < 3600)
    return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? "s" : ""} ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? "s" : ""} ago`;
  if (diff < 2592000)
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? "s" : ""} ago`;
  if (diff < 31536000)
    return `${Math.floor(diff / 2592000)} month${Math.floor(diff / 2592000) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diff / 31536000)} year${Math.floor(diff / 31536000) !== 1 ? "s" : ""} ago`;
};

// Helper function to sort notes
const sortNotes = (notes, sortOption) => {
  return [...notes].sort((a, b) => {
    switch (sortOption) {
      case "latest":
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case "oldest":
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      case "a-z":
        return a.note_name.localeCompare(b.note_name);
      case "z-a":
        return b.note_name.localeCompare(a.note_name);
      default:
        return 0;
    }
  });
};

function NotePanel() {
  const location = useLocation();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [hasSelectedInitialNote, setHasSelectedInitialNote] = useState(false);

  const { selectedNoteId, setSelectedNoteId } = useNote();
  const { setSelectedNoteName } = useNote();
  const { refreshNotes, setRefreshNotes } = useNote();

  const { token } = useAuth();

  const [loading, setLoading] = useState(true); // NEW

  // Get notebookId from URL if present
  const searchParams = new URLSearchParams(location.search);
  const notebookId = searchParams.get('notebookId');

  useEffect(() => {
    const fetchNotes = async () => {

      if (!notes.length)
        setLoading(true);

      try {
        // If we have a notebookId, fetch notes for that notebook only
        const url = notebookId
          ? `${API_BASE_URL}/notebooks/${notebookId}/notes`
          : `${API_BASE_URL}/note/all`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch notes");

        const data = await response.json();

        // Extract notes array based on response structure
        const notesArray = notebookId ? data.notebook.notes : data;
        setNotes(notesArray);

        if (!hasSelectedInitialNote && notesArray.length > 0 && !selectedNoteId) {
          const sortedData = sortNotes(notesArray, sortOption);
          const firstNote = sortedData[0];
          setSelectedNoteId(firstNote.id);
          setSelectedNoteName(firstNote.note_name);
          setHasSelectedInitialNote(true);
        }
      } catch (err) {
        console.error("Error loading notes:", err);
      } finally {
        setLoading(false); // stop loading
      }
    };

    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    hasSelectedInitialNote,
    setSelectedNoteId,
    setSelectedNoteName,
    refreshNotes,
    sortOption,
    notebookId,
  ]);

  // Handle events from bot actions (e.g., note divided)
  useEffect(() => {
    const handleNoteDeleted = () => {
      setSelectedNoteId(null);
      setSelectedNoteName('');
      setHasSelectedInitialNote(false);
    };

    const handleNotesUpdated = () => {
      setRefreshNotes(prev => !prev);
    };

    window.addEventListener('note-deleted', handleNoteDeleted);
    window.addEventListener('notes-updated', handleNotesUpdated);

    return () => {
      window.removeEventListener('note-deleted', handleNoteDeleted);
      window.removeEventListener('notes-updated', handleNotesUpdated);
    };
  }, [setSelectedNoteId, setSelectedNoteName, setRefreshNotes]);

  const handleNewNote = async () => {
    if (isCreatingNote) return;
    setIsCreatingNote(true);

    try {
      const response = await fetch(`${API_BASE_URL}/note/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to create new note");

      const newNote = await response.json();
      const normalized = {
        id: newNote.id,
        note_name: newNote.note_name,
        updatedAt: newNote.updated_at,
      };

      setNotes((prev) => [normalized, ...prev]);
      setSelectedNoteId(normalized.id);
      setSelectedNoteName(normalized.note_name);
      setRefreshNotes((prev) => !prev); // toggle to re-run effect
    } catch (err) {
      console.error("Error creating new note:", err);
      alert("Failed to create new note");
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleNoteContext = (note) => {
    setSelectedNoteId(note.id);
    setSelectedNoteName(note.note_name);
  };

  const filteredNotes = notes.filter((note) =>
    note.note_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedNotes = sortNotes(filteredNotes, sortOption);

  // ICON + TOOLTIP HANDLING
  const sortOrderLabels = {
    latest: "Sort by Latest",
    oldest: "Sort by Oldest",
    "a-z": "Sort A → Z",
    "z-a": "Sort Z → A",
  };

  const getSortIcon = () => {
    switch (sortOption) {
      case "latest":
        return <FaSortAmountDown title={sortOrderLabels[sortOption]} />;
      case "oldest":
        return <FaSortAmountUpAlt title={sortOrderLabels[sortOption]} />;
      case "a-z":
        return <FaSortAlphaDown title={sortOrderLabels[sortOption]} />;
      case "z-a":
        return <FaSortAlphaUp title={sortOrderLabels[sortOption]} />;
      default:
        return <FaSortAmountDown />;
    }
  };

  const handleSortToggle = () => {
    const order = ["latest", "oldest", "a-z", "z-a"];
    const currentIndex = order.indexOf(sortOption);
    const nextIndex = (currentIndex + 1) % order.length;
    setSortOption(order[nextIndex]);
  };

  return (
    <div className="note-panel">
      <div className="note-panel-header">
        <h2 className="note-panel-title">Notes</h2>
      </div>

      <div className="note-panel-content">
        {/* Search + Sort */}
        <div className="note-panel-search-filter-row">
          <input
            type="text"
            className="note-panel-search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="note-panel-filter-controls">
            <button
              className="note-panel-sort-icon-button"
              onClick={handleSortToggle}
            >
              {getSortIcon()}
            </button>
          </div>
        </div>

        {/* New Note */}
        <div className="new-note-container">
          <button
            className="new-note-button"
            onClick={handleNewNote}
            disabled={isCreatingNote}
          >
            <FaRegStickyNote className="new-note-icon" />
            <span>{isCreatingNote ? "Creating..." : "New Note"}</span>
          </button>
        </div>

        {/* Notes List */}
        <div className="notes-list-container">
          {loading ? (
            <div className="note-placeholder-wrapper">
              {[...Array(8)].map((_, i) => (
                <div className="note-item placeholder" key={i}>
                  <div className="placeholder-title shimmer"></div>
                  <div className="placeholder-date shimmer"></div>
                </div>
              ))}
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="empty-state">
              <FaRegStickyNote className="empty-state-icon" />
              <div className="empty-state-text">
                {searchQuery ? "No notes found" : "No notes yet"}
              </div>
              <div className="empty-state-subtext">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first note to get started"}
              </div>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`note-item slide-up ${selectedNoteId === note.id ? "active" : ""}`}
                onClick={() => handleNoteContext(note)}
                note_name={note.note_name}
              >
                <div className="note-panel-item-title">{note.note_name}</div>
                <div className="note-panel-date">
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotePanel;
