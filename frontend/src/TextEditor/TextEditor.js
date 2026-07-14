import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import CustomToolbar from "./CustomToolbar";
import { useAuth } from "../Authentication/AuthContext";
import { useNote } from "../Components/NoteContext";
import { useToast } from "../Components/Toast";
import { useConfirm } from "../Components/ConfirmModal";
import { API_BASE_URL } from "../App/config";
import SettingsModule from "./SettingsModule";
import EditableHeading from "./EditableHeading";
import { FaLock, FaLockOpen } from "react-icons/fa";
import "./TextEditor.css";

const TextEditor = () => {

  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const initialRender = useRef(true);
  const [editorContent, setEditorContent] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [currentNotebookId, setCurrentNotebookId] = useState(null);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isDividing, setIsDividing] = useState(false);


  const { token } = useAuth();
  const { selectedNoteId, setSelectedNoteId } = useNote();
  const { selectedNoteName, setSelectedNoteName } = useNote();
  const selectedNoteIdRef = useRef(selectedNoteId);
  const { refreshNotes, setRefreshNotes } = useNote();
  const toast = useToast();
  const { confirm } = useConfirm();
  const autosave = useRef(false);

  // Expose current note ID to window for bot actions
  useEffect(() => {
    window.currentNoteId = selectedNoteId;
  }, [selectedNoteId]);


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

      // Expose Quill instance globally for bot actions
      window.quillInstance = quillInstance.current;
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

  // Load protection status when note changes
  useEffect(() => {
    const loadProtectionStatus = async () => {
      if (!selectedNoteId || !token) {
        setIsProtected(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/note/load/${selectedNoteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setIsProtected(data.is_protected || false);
      } catch (err) {
        console.error("Error loading protection status:", err);
        setIsProtected(false);
      }
    };

    loadProtectionStatus();
  }, [selectedNoteId, token]);

  // Fetch all notebooks for the dropdown
  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notebooks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setNotebooks(data.notebooks || []);
        }
      } catch (err) {
        console.error("Error fetching notebooks:", err);
      }
    };

    fetchNotebooks();
  }, [token]);

  // Load current notebook ID when note changes
  useEffect(() => {
    const loadNoteDetails = async () => {
      if (!selectedNoteId || !token) {
        setCurrentNotebookId(null);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/note/load/${selectedNoteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setCurrentNotebookId(data.notebook_id || null);
      } catch (err) {
        console.error("Error loading note details:", err);
      }
    };

    loadNoteDetails();
  }, [selectedNoteId, token]);


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

  // Handle notebook change
  const handleNotebookChange = async (e) => {
    const newNotebookId = e.target.value === "" ? null : parseInt(e.target.value);

    if (!selectedNoteId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/note/notebook/${selectedNoteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notebookId: newNotebookId }),
        }
      );

      if (response.ok) {
        setCurrentNotebookId(newNotebookId);
        setRefreshNotes(!refreshNotes);
      } else {
        toast.error("Failed to move note to notebook");
      }
    } catch (err) {
      console.error("Error moving note:", err);
      toast.error("Error moving note to notebook");
    }
  };

  const toggleProtection = async () => {
    if (!selectedNoteId) return;

    const confirmMsg = isProtected
      ? "Unprotect this note? It will be included in AI features again."
      : "Protect this note? Content will be encrypted and excluded from AI features.";

    const confirmed = await confirm({
      title: isProtected ? 'Unprotect Note?' : 'Protect Note?',
      message: confirmMsg,
      confirmText: isProtected ? 'Unprotect' : 'Protect',
      type: 'warning'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/note/protect/${selectedNoteId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isProtected: !isProtected }),
        }
      );

      if (response.ok) {
        setIsProtected(!isProtected);
        setRefreshNotes(!refreshNotes);
        toast.success(`Note ${!isProtected ? 'protected' : 'unprotected'} successfully!`);
      } else {
        toast.error("Failed to toggle protection");
      }
    } catch (err) {
      console.error("Error toggling protection:", err);
      toast.error("Error toggling protection");
    }
  };

  // AI Action: Highlight key points
  const handleHighlight = async () => {
    if (!selectedNoteId || isProtected || isHighlighting) return;

    setIsHighlighting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/note-actions/highlight/${selectedNoteId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.highlights && data.highlights.length > 0) {
        const quill = quillInstance.current;
        if (!quill) return;

        const content = quill.getText();
        let highlightCount = 0;

        for (const item of data.highlights) {
          const index = content.indexOf(item.text);
          if (index !== -1) {
            quill.formatText(index, item.text.length, {
              background: item.color || '#ffeb3b'
            });
            highlightCount++;
          }
        }

        toast.success(`✨ Highlighted ${highlightCount} key points!`);
      } else {
        toast.warning(data.error || "Could not find key points to highlight");
      }
    } catch (err) {
      console.error("Error highlighting:", err);
      toast.error("Error analyzing note for highlights");
    } finally {
      setIsHighlighting(false);
    }
  };

  // AI Action: Divide note into multiple notes
  const handleDivide = async () => {
    if (!selectedNoteId || isProtected || isDividing) return;

    const confirmed = await confirm({
      title: 'Divide Note?',
      message: 'Divide this note into multiple notes? The original note will be deleted.',
      confirmText: 'Divide',
      type: 'warning'
    });
    if (!confirmed) return;

    setIsDividing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/note-actions/divide/${selectedNoteId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`📑 Note divided into ${data.notes.length} notes!`);

        // Trigger refresh and clear selection
        setSelectedNoteId(null);
        setRefreshNotes(!refreshNotes);
        window.dispatchEvent(new CustomEvent('notes-updated'));
      } else {
        toast.error(data.error || "Failed to divide note");
      }
    } catch (err) {
      console.error("Error dividing note:", err);
      toast.error("Error dividing note");
    } finally {
      setIsDividing(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorContent],
  );

  // Show message when no note is selected
  if (!selectedNoteId) {
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
      <div className="editor-heading-bar">
        <EditableHeading value={selectedNoteName} onSave={handleSaveNoteName} />
        <div className="editor-actions">
          {notebooks.length > 0 && (
            <select
              className="notebook-selector"
              value={currentNotebookId || ""}
              onChange={handleNotebookChange}
              title="Move to notebook"
            >
              <option value="">No Notebook</option>
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.notebook_name}
                </option>
              ))}
            </select>
          )}
          {selectedNoteId && (
            <button
              className={`protection-toggle-btn ${isProtected ? 'protected' : ''}`}
              onClick={toggleProtection}
              title={isProtected ? "Unprotect Note" : "Protect Note"}
            >
              {isProtected ? <><FaLockOpen /> Protected</> : <><FaLock /> Protect</>}
            </button>
          )}
          {selectedNoteId && !isProtected && (
            <select
              className="magic-actions-dropdown"
              value=""
              onChange={(e) => {
                const action = e.target.value;
                if (action === 'highlight') handleHighlight();
                else if (action === 'divide') handleDivide();
                e.target.value = '';
              }}
              disabled={isHighlighting || isDividing}
              title="AI-powered actions for this note"
            >
              <option value="">{isHighlighting || isDividing ? 'Processing...' : 'Magic Actions'}</option>
              <option value="highlight">Highlight Key Points</option>
              <option value="divide">Divide into Notes</option>
            </select>
          )}
        </div>
      </div>
      <div className="editor-seperator"></div>
      <div ref={editorRef} className="editor-area" />
    </div>
  );
};

export default TextEditor;
