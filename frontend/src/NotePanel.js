import { useState } from "react";
import { FormControl } from "react-bootstrap";
import {
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";

// Format date as "Jun 20"
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

function NotePanel() {
  // Simulated notes
  const initialNotes = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    title: `Note ${i + 1}`,
    createdAt: new Date(2024, 0, 1 + i),
    updatedAt: new Date(2024, 5, Math.floor(Math.random() * 28) + 1),
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const cycleSortOption = () => {
    const options = ["az", "za", "newest", "oldest"];
    const nextIndex = (options.indexOf(sortOption) + 1) % options.length;
    setSortOption(options[nextIndex]);
  };

  const getSortIcon = () => {
    switch (sortOption) {
      case "az":
        return <FaSortAlphaDown style={{ cursor: "pointer" }} />;
      case "za":
        return <FaSortAlphaUp style={{ cursor: "pointer" }} />;
      case "newest":
        return <FaSortAmountDown style={{ cursor: "pointer" }} />;
      case "oldest":
        return <FaSortAmountUp style={{ cursor: "pointer" }} />;
      default:
        return null;
    }
  };

  const filteredNotes = initialNotes
    .filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "az") return a.title.localeCompare(b.title);
      if (sortOption === "za") return b.title.localeCompare(a.title);
      if (sortOption === "newest") return b.updatedAt - a.updatedAt;
      if (sortOption === "oldest") return a.updatedAt - b.updatedAt;
      return 0;
    });

  return (
    <div>
      <div
        className="d-flex flex-column bg-light vh-100 border-end"
        style={{ width: "180px" }}
      >
        {/* Title + sort icon */}
        <div className="d-flex justify-content-between align-items-center px-2 mb-2">
          <div className="fw-bold" style={{ fontSize: "1rem" }}>
            Notes
          </div>
          <div onClick={cycleSortOption} style={{ fontSize: "0.8rem" }}>
            {getSortIcon()}
          </div>
        </div>

        {/* Search input */}
        <div className="px-2 mb-2">
          <FormControl
            size="sm"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: "0.7rem" }}
          />
        </div>

        {/* Scrollable note list */}
        <div className="flex-grow-1 overflow-auto" style={{ fontSize: "0.6rem" }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="px-2 py-2 bg-white border"
              style={{ cursor: "pointer", whiteSpace: "normal" }}
              title={note.title}
            >
              <div
                className="fw-semibold text-truncate"
                style={{ fontSize: "0.65rem", lineHeight: "1rem" }}
              >
                {note.title}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: "0.6rem", lineHeight: "0.9rem" }}
              >
                {formatDate(note.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotePanel;
