import { createContext, useContext, useState } from "react";

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNoteName, setSelectedNoteName] = useState(null);
  const [refreshNotes, setRefreshNotes] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);

  const resetNoteContext = () => {
    setSelectedNoteId(null);
    setSelectedNoteName(null);
    setRefreshNotes(false);
    setNotesLoading(true);
  };

  return (
    <NoteContext.Provider
      value={{
        selectedNoteId,
        setSelectedNoteId,
        selectedNoteName,
        setSelectedNoteName,
        refreshNotes,
        setRefreshNotes,
        notesLoading,
        setNotesLoading,
        resetNoteContext
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNote = () => useContext(NoteContext);
