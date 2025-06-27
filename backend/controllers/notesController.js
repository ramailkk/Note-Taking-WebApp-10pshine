const notesModel = require("../models/notesModel");

const updateNoteContent = async (req, res) => {
  const { noteId } = req.params;
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res
      .status(400)
      .json({ error: "Missing HTML content in request body." });
  }
  try {
    const updatedNote = await notesModel.SaveHTMLInNoteID(noteId, htmlContent);

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({
      message: "Note content updated successfully.",
      note: updatedNote,
    });
  } catch (err) {
    console.error("Error updating note content:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getNoteContent = async (req, res) => {
  const { noteId } = req.params;

  try {
    const getNote = await notesModel.LoadHTMLByNoteID(noteId);

    if (!getNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({
      message: "Note found successfully",
      note: getNote,
    });
  } catch (err) {
    console.error("Error updating note content:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const createNewNote = async (req, res) => {
  const { userId } = req.params;

  try {
    const createNote = await notesModel.CreateNote(userId);

    res.status(200).json({
      message: "Note created successfully",
      note: createNote,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
};
const deleteNote = async (req,res) => {
    const { noteId } = req.params;

    try {
    const  deleteNote = await notesModel.DeleteNote(noteId);

    res.status(200).json({
      message: "Note delete successfully",
      note: deleteNote,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
}
module.exports = {
  updateNoteContent,
  getNoteContent,
  createNewNote,
  deleteNote,
};
