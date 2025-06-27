const pool = require("../db2");

// Get all deatils of a specfic notebook
const findNoteByUserID = async (userId, noteId) => {
  const result = await pool.query(
    "SELECT * FROM notes  Where user_id = $1 and id = $2",
    [userId, noteId]
  );
  return result.rows[0];
};

// Get all names and ids of book, but dont get the content
const findAllNotesByUserID = async (userId) => {
  const result = await pool.query(
    "SELECT note_name, title FROM notes WHERE user_id = $1",
    [userId]
  );
  return result.rows;
};

const findNoteByNoteID = async (noteId) => {
  const result = await pool.query("SELECT * FROM notes id = $1", [noteId]);
  return result.rows[0];
};

const CreateNote = async (userId) => {
  const result = await pool.query(
    "INSERT INTO notes (user_id) VALUES ($1) RETURNING *",
    [userId]
  );
  return result.rows[0];
};

const LoadHTMLByNoteID = async (noteId) => {
  const result = await pool.query(
    "SELECT content_html FROM notes WHERE id = $1",
    [noteId]
  );
  return result.rows[0];
};

const SaveHTMLInNoteID = async (noteId, htmlContent) => {
  const result = await pool.query(
    "UPDATE notes SET content_html = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [htmlContent, noteId]
  );
  return result.rows[0];
};

const DeleteNote = async (noteId) => {
  const result = await pool.query(
    "DELETE FROM notes Where id = $1 RETURNING *",
    [noteId]
  );
  return result.rows[0];
};

// const UpdateEditTimeOfNote = async (noteId) => {
//   const result = await pool.query(
//     "UPDATE notes SET updated_at = NOW() Where id = $1",
//     [noteId]
//   );
//   retur
// }

module.exports = {
  findNoteByUserID,
  findAllNotesByUserID,
  findNoteByNoteID,
  LoadHTMLByNoteID,
  SaveHTMLInNoteID,
  CreateNote,
  DeleteNote,
};
