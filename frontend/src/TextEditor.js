import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import CustomToolbar from "./CustomToolbar";

const TextEditor = () => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  const [savedHTML, setSavedHTML] = useState("");     // Last saved version
  const [editorContent, setEditorContent] = useState(""); // Current editor text

  // Setup fonts and sizes
  const Font = Quill.import("formats/font");
  Font.whitelist = [
    "arial", "verdana", "georgia", "courier-new",
    "times-new-roman", "lucida", "impact", "tahoma",
    "trebuchet", "palatino", "monospace", "sans-serif", "serif"
  ];
  Quill.register(Font, true);

  const Size = Quill.import("formats/size");
  Size.whitelist = [
    "10px", "12px", "14px", "16px", "18px", "24px", "32px", "48px"
  ];
  Quill.register(Size, true);

  // Initialize Quill once
  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: "#custom-toolbar",
        },
        formats: [
          "font", "size", "color", "background",
          "bold", "italic", "underline", "strike",
          "align", "list", "link", "image"
        ]
      });

      // Format application fix
      quillInstance.current.on("selection-change", (range) => {
        if (range && range.length === 0) {
          const format = quillInstance.current.getFormat(range.index - 1);
          Object.entries(format).forEach(([key, value]) => {
            quillInstance.current.format(key, value);
          });
        }
      });

      // Track live content
      quillInstance.current.on("text-change", () => {
        const html = quillInstance.current.root.innerHTML;
        setEditorContent(html);
      });
    }
  }, []);

  // Debounced autosave (2 seconds)
  useEffect(() => {
    if (!editorContent) return;

    const timeout = setTimeout(() => {
      console.log("🔄 Autosaving...");
      setSavedHTML(editorContent); // Replace with API call if needed
    }, 2000);

    return () => clearTimeout(timeout);
  }, [editorContent]);

  // Save before closing tab or refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (quillInstance.current) {
        const html = quillInstance.current.root.innerHTML;
        console.log("💾 Forced save on unload:", html);
        // Use sendBeacon if saving to backend
        // navigator.sendBeacon("/api/save", JSON.stringify({ htmlContent: html }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div style={{
      padding: "1rem",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box"
    }}>
      <h2>#Note_Name API#</h2>

      <CustomToolbar />

      <div
        ref={editorRef}
        style={{
          height: "calc(100vh - 250px)",
          marginBottom: "1rem",
          width: "100%",
          maxWidth: "100%",
          overflow: "auto"
        }}
      />
    </div>
  );
};

export default TextEditor;
