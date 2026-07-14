import React from "react";
import NoteCard from "./NoteCard";
import "./styles.css";

const NotesGrid = ({ filteredAndSortedNotes, gridGap, notebookId }) => {
  return (
    <div
      className="notes-grid"
      style={{ gap: `${gridGap}px` }}
    >
      {filteredAndSortedNotes.map((note, index) => (
        <div key={`${note.id}-${index}`} className="note-wrapper">
          <NoteCard
            note={note}
            notebookId={notebookId}
            onClick={() => console.log("Note clicked:", note.id)}
          />
        </div>
      ))}

      {/* Dummy Add Note Card */}
      <div className="note-wrapper">
        <NoteCard
          isAddCard={true}
          notebookId={notebookId}
          onClick={() => console.log("Add new note")}
        />
      </div>
    </div>
  );
};

export default NotesGrid;
