const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");

//save html into Note
router.put("/save/:noteId", notesController.updateNoteContent);
// load html from note
router.get("/load/:noteId", notesController.getNoteContent);
// create new note
router.post("/create/:userId", notesController.createNewNote);
// delete note
router.delete("/remove/:noteId", notesController.deleteNote);

module.exports = router;
