import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import CustomToolbar from "./CustomToolbar";
import { useAuth } from "../Authentication/AuthContext";
import { useNote } from "../Components/NoteContext";
import { API_BASE_URL } from "../App/config";
import SettingsModule from "./SettingsModule";
import EditableHeading from "./EditableHeading";
import "./TextEditor.css";

const TextEditor = () => {

  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const initialRender = useRef(true);
  const [editorContent, setEditorContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const { token } = useAuth();
  const { selectedNoteId, setSelectedNoteId } = useNote();
  const { selectedNoteName, setSelectedNoteName } = useNote();
  const selectedNoteIdRef = useRef(selectedNoteId);
  const { refreshNotes, setRefreshNotes } = useNote();
  const { notesLoading } = useNote();
  const autosave = useRef(false);
  const Font = Quill.import("formats/font");
  Font.whitelist = [
    "arial",
    "verdana",
    "georgia",
    "courier-new",
    "times-new-roman",
    "lucida",
    "impact",
    "tahoma",
    "trebuchet",
    "palatino",
    "monospace",
    "sans-serif",
    "serif",
  ];

  Quill.register(Font, true);

  const Parchment = Quill.import("parchment");
  const SizeStyle = new Parchment.Attributor.Style("size", "font-size", {
    scope: Parchment.Scope.INLINE,
  });

  Quill.register(SizeStyle, true);
  useEffect(() => {
    if (selectedNoteId && editorRef.current && !quillInstance.current) {
      quillInstance.current = null;
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }

      Quill.register("modules/settings", SettingsModule);
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: "#custom-toolbar",
          settings: true,
        },
        formats: [
          "font",
          "size",
          "color",
          "background",
          "bold",
          "italic",
          "underline",
          "strike",
          "align",
          "list",
          "link",
          "image",
          "blockquote",
          "code-block",
          "direction",
          "indent",
        ],
      });

      const undoButton = document.querySelector(".ql-undo");
      const redoButton = document.querySelector(".ql-redo");

      if (undoButton) {
        undoButton.addEventListener("click", () =>
          quillInstance.current.history.undo(),
        );
      }
      if (redoButton) {
        redoButton.addEventListener("click", () =>
          quillInstance.current.history.redo(),
        );
      }

      // Making sure that after "enter" options are still active and displayed
      var keyboard = quillInstance.current.getModule("keyboard");
      delete keyboard.bindings[13];
    }

    // Cleanup Quill instance when no note is selected
    if (!selectedNoteId && quillInstance.current) {
      quillInstance.current = null;
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }

    const handleDeleteNote = async () => {
      const idToDelete = selectedNoteIdRef.current;
      if (!idToDelete) return;
      try {
        await fetch(`${API_BASE_URL}/note/remove/${idToDelete}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setSelectedNoteId(null);
        // trigger a refetch
        setRefreshNotes((prev) => !prev);
      } catch (err) {
        console.error("Failed to delete note", err);
      }
    };

    const handleGetDocumentName = (e) => {
      window.dispatchEvent(
        new CustomEvent("document-name-response", {
          detail: {
            name: `${selectedNoteName}`,
          },
        }),
      );
    };
    const handleSave = () => {
      const idToSave = selectedNoteIdRef.current;
      if (!editorContent || !idToSave) return;
      const content = quillInstance.current.root.innerHTML;
      fetch(`${API_BASE_URL}/note/save/${idToSave}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({ ContentHTML: content }),
      });
      setRefreshNotes((prev) => !prev);
    };

    const handleChangeAutoSave = () => {
      autosave.current = !autosave.current;
      window.dispatchEvent(
        new CustomEvent("autosave-changed", {
          detail: autosave.current ? "On" : "Off",
        }),
      );
      if (autosave.current) handleSave();
    };

    window.addEventListener("auto-save", handleChangeAutoSave);
    window.addEventListener("manual-save", handleSave);
    window.addEventListener("delete-note", handleDeleteNote);
    window.addEventListener("get-document-name", handleGetDocumentName);
    return () => {
      window.removeEventListener("auto-save", handleChangeAutoSave);
      window.removeEventListener("manual-save", handleSave);
      window.removeEventListener("delete-note", handleDeleteNote);
      window.removeEventListener("get-document-name", handleGetDocumentName);
    };
  }, [
    selectedNoteId,
    setSelectedNoteId,
    token,
    editorContent,
    selectedNoteName,
    refreshNotes,
    setRefreshNotes
  ]);

  useEffect(() => {
    const quill = quillInstance.current;
    if (!quill) return;

    const handleChange = () => {
      const html = quill.root.innerHTML;
      setEditorContent(html);
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
    };
  }, [selectedNoteId]);

  useEffect(() => {
    selectedNoteIdRef.current = selectedNoteId;
  }, [selectedNoteId]);

  useEffect(() => {
    if (!selectedNoteId) return;
    const fetchNoteHTML = async () => {
      setNoteLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/note/load/${selectedNoteId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch notes");
        initialRender.current = true;
        const ContentHTML = await response.json();
        if (quillInstance.current) {
          quillInstance.current.root.innerHTML = ContentHTML.content_html; // set in Quill
        }
      } catch (err) {
        console.error("Error loading notes:", err);
      } finally {
        setNoteLoading(false);
      }
    };

    fetchNoteHTML();
  }, [selectedNoteId, token]);

  const handleSaveNoteName = async (newNoteName) => {
    setSelectedNoteName(newNoteName);

    try {
      await fetch(`${API_BASE_URL}/note/name/${selectedNoteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ noteName: newNoteName }),
      });
      // trigger a refetch
      setRefreshNotes((prev) => !prev); // toggle to re-run effect
    } catch (err) {
      console.error("Failed to update note title:", err);
    }
  };

  const handleSave = () => {
    if (!editorContent || !selectedNoteId) return;
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    fetch(`${API_BASE_URL}/note/save/${selectedNoteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ContentHTML: editorContent }),
    });
    setRefreshNotes((prev) => !prev);
  };

  // autosave on every keystroke
  useEffect(
    () => {
      if (!autosave.current) return;
      if (initialRender.current) {
        initialRender.current = false;
        return;
      }
      handleSave();
    },
    [editorContent],
    [autosave.current],
  );

  // Show message when no note is selected
  if (!selectedNoteId) {
    if (notesLoading) {
      return (
        <div className="editor-container">
          <div className="editor-skeleton" aria-busy="true" aria-label="Loading notes">
            <div className="skeleton-toolbar nb-skeleton" />
            <div className="skeleton-heading nb-skeleton" />
            <div className="skeleton-content nb-skeleton" />
          </div>
        </div>
      );
    }
    return (
      <div className="no-note-container">
        <div className="no-note-content">
          <h3>No Note Selected</h3>
          <p>Please select a note to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container slide-up">
      <div className="top-filler"> </div>
      <CustomToolbar quill={quillInstance.current} />
      <EditableHeading value={selectedNoteName} onSave={handleSaveNoteName} />
      <div className="editor-seperator"></div>
      <div ref={editorRef} className="editor-area" />
      {noteLoading && (
        <div className="editor-skeleton-overlay" aria-busy="true" aria-label="Loading note">
          <div className="skeleton-toolbar nb-skeleton" />
          <div className="skeleton-heading nb-skeleton" />
          <div className="skeleton-content nb-skeleton" />
        </div>
      )}
    </div>
  );
};

export default TextEditor;
