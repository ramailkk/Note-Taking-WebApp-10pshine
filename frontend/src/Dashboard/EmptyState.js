import React, { useState } from "react";
import { FiSearch, FiFileText } from "react-icons/fi"; // Feather icons
import { useNavigate } from "react-router-dom";
import { useNote } from "../Components/NoteContext.js";
import { useSide } from "../Components/SidebarContext";
import { useAuth } from "../Authentication/AuthContext";
import { API_BASE_URL} from '../App/config.js';
import "./styles.css";

const EmptyState = ({ searchTerm }) => {
  const isFiltered = searchTerm;
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
      setIsCreating(false);
    }
  };

  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon scale-in">
        {isFiltered ? <FiSearch size={128} /> : <FiFileText size={128} />}
      </div>

      <h3 className="empty-state-title slide-up">
        {isFiltered ? "No notes found" : "No notes yet"}
      </h3>

      <p className="empty-state-text slide-up">
        {isFiltered
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Create your first note to get started with your personal note collection."}
      </p>

      {!isFiltered && (
        <button
          className="create-note-btn slide-up"
          onClick={handleNewNote}
          disabled={isCreating}
        >
          {isCreating && <span className="nb-spinner" />}
          {isCreating ? "Creating..." : "Create New Note"}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
