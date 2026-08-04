import React, { useState } from "react";
import "./styles.css";
import { FaPlus } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useNote } from "../Components/NoteContext.js";
import { useSide } from "../Components/SidebarContext";
import { useAuth } from "../Authentication/AuthContext";
import { API_BASE_URL} from '../App/config.js';
// Utility to strip HTML
const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const NoteCard = ({ note = {}, onClick, isAddCard = false, isLoading}) => {
  const { selectedNoteId, setSelectedNoteId, setSelectedNoteName } = useNote();
  const { activeSection, setActiveSection } = useSide();
  const { token } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  const handleNewNote = async () => {
    if (isCreating) return;
    setIsCreating(true);
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

      setSelectedNoteId(normalized.id);
      setSelectedNoteName(normalized.note_name);
      navigate("/notes");
      // localStorage.setItem("activeSection", "notes");
      setActiveSection("notes");
    } catch (err) {
      console.error("Error creating new note:", err);
      alert("Failed to create new note");
    } finally {
      setIsCreating(false);
    }
  };

  if (isAddCard) {
    return (
      <div
        className={`note-card add-card ${isCreating ? "add-card-busy" : ""}`}
        onClick={isCreating ? undefined : handleNewNote}
        aria-disabled={isCreating}
      >
        <div className="add-icon">
          {isCreating ? <span className="nb-spinner nb-spinner--lg" /> : <FaPlus />}
        </div>
      </div>
    );
  }

  const handleNoteLoad = async () => {
    setSelectedNoteId(note.id);
    setSelectedNoteName(note.note_name);
    navigate("/notes");
    // localStorage.setItem("activeSection", "notes");
    setActiveSection("notes");
  };

  const plainText = stripHtml(note.content_html);
  const relativeTime = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
  });

  return (
    <div className="note-card slide-up" onClick={handleNoteLoad}>
      <h3 className="note-title">{note.note_name}</h3>
      <p className="note-content">{plainText}</p>
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
