import React from "react";
import "./styles.css";
import { FaPlus, FaLock } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useNote } from "../Components/NoteContext.js";
import { useSide } from "../Components/SidebarContext";
import { useAuth } from "../Authentication/AuthContext";
import { API_BASE_URL } from '../App/config.js';
// Utility to strip HTML
const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const NoteCard = ({ note = {}, onClick, isAddCard = false, isLoading, notebookId }) => {
  const { setSelectedNoteId, setSelectedNoteName } = useNote();
  const { setActiveSection } = useSide();
  const { token } = useAuth();

  const navigate = useNavigate();

  const handleNewNote = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/note/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notebookId }),
      });
      if (!response.ok) throw new Error("Failed to create new note");
      const newNote = await response.json();
      const normalized = {
        id: newNote.id,
        note_name: newNote.note_name,
        updatedAt: newNote.updated_at,
      };

      setSelectedNoteId(normalized.id);
      setSelectedNoteName(normalized.note_name);
      const url = notebookId ? `/notes?notebookId=${notebookId}` : "/notes";
      navigate(url);
      // localStorage.setItem("activeSection", "notes");
      setActiveSection("notes");
    } catch (err) {
      console.error("Error creating new note:", err);
      alert("Failed to create new note");
    }
  };

  if (isAddCard) {
    return (
      <div className="note-card add-card" onClick={handleNewNote}>
        <div className="add-icon">
          <FaPlus />
        </div>
      </div>
    );
  }

  const handleNoteLoad = async () => {
    setSelectedNoteId(note.id);
    setSelectedNoteName(note.note_name);
    const url = notebookId ? `/notes?noteId=${note.id}&notebookId=${notebookId}` : "/notes";
    navigate(url);
    // localStorage.setItem("activeSection", "notes");
    setActiveSection("notes");
  };

  const plainText = stripHtml(note.content_html);
  const relativeTime = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
  });

  // Check if note is protected
  const isProtected = note.is_protected === 1 || note.is_protected === true;

  return (
    <div className="note-card slide-up" onClick={handleNoteLoad}>
      <h3 className="note-title">{note.note_name}</h3>
      {isProtected ? (
        <div className="note-protected-content">
          <div className="protected-icon"><FaLock /></div>
          <p className="protected-text">Protected Note - Click to view</p>
        </div>
      ) : (
        <p className="note-content">{plainText}</p>
      )}
      <div className="note-footer">
        <span className="note-date">{relativeTime}</span>
        <div className="note-actions">
          <button
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              // Edit functionality would go here
            }}
          ></button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
