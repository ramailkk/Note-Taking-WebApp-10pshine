import { useState } from "react";

function NotePanel() {
  const notes = Array.from({ length: 100 }, (_, i) => `Note ${i + 1}`);
  const [activeSection, setActiveSection] = useState('Home');

  return (
    <div>
      <div
        className="d-flex flex-column bg-light vh-100 border-end"
        style={{ width: '120px' }}
      >
        {/* Title */}
        <div className="text-center mb-3 fw-bold" style={{ fontSize: '1rem' }}>
          Notes
        </div>

        <div className=""></div>


        {/* Scrollable note list */}
        <div
          className="flex-grow-1 overflow-auto "
          style={{ fontSize: '0.6rem' }}
        >
          {notes.map((note, index) => (
            <div
              key={index}
              className="px-1 py-2 bg-white border text-truncate "
              style={{ cursor: 'pointer' }}
              title={note}
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotePanel;