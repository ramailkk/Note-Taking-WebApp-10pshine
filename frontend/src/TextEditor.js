import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const TextEditor = () => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [savedHTML, setSavedHTML] = useState(''); // Stores saved content

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean'],
          ],
        },
      });
    }
  }, []);

  // Save the current content as HTML
  const handleSave = () => {
    const html = quillInstance.current.root.innerHTML;
    setSavedHTML(html); // You could also store this in localStorage
    console.log('Saved:', html);
  };

  // Load the saved HTML back into the editor
  const handleLoad = () => {
    if (savedHTML && quillInstance.current) {
      quillInstance.current.root.innerHTML = savedHTML;
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Rich Text Editor</h2>

      <div ref={editorRef} style={{ height: '300px', marginBottom: '1rem' }} />

      <button onClick={handleSave} style={{ marginRight: '1rem' }}>
        Save
      </button>

      <button onClick={handleLoad}>Restore</button>

      <h3 style={{ marginTop: '2rem' }}>Preview (Saved HTML):</h3>
      <div
        style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '100px' }}
        dangerouslySetInnerHTML={{ __html: savedHTML }}
      />
    </div>
  );
};

export default TextEditor;
