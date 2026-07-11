const getPool = require('./db');

const findNoteByUserID = async (userId, noteId) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM notes WHERE user_id = $1 AND id = $2',
    [userId, noteId]
  );
  return result.rows[0];
};

const findAllNotesByUserID = async (userId) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, note_name, updated_at, created_at FROM notes WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};

const findNoteByNoteID = async (noteId) => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
  return result.rows[0];
};

const CreateNote = async (userId) => {
  const pool = getPool();
  const result = await pool.query(
    'INSERT INTO notes (user_id) VALUES ($1) RETURNING id, note_name, updated_at, created_at',
    [userId]
  );
  return result.rows[0];
};

const LoadHTMLByNoteID = async (noteId, userId) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT content_html FROM notes WHERE id = $1 AND user_id = $2',
    [noteId, userId]
  );
  return result.rows[0];
};

const SaveHTMLInNoteID = async (htmlContent, noteId, userId) => {
  const pool = getPool();
  const result = await pool.query(
    'UPDATE notes SET content_html = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [htmlContent, noteId, userId]
  );
  return result.rows[0];
};

const SaveNewNameInNoteID = async (noteName, noteId, userId) => {
  const pool = getPool();
  const result = await pool.query(
    'UPDATE notes SET note_name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [noteName, noteId, userId]
  );
  return result.rows[0];
};

const DeleteNote = async (noteId, userId) => {
  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
    [noteId, userId]
  );
  return result.rows[0];
};

const findAllNotesByUserIDForDashboard = async (
  userId,
  { limit = 10, offset = 0, searchKeyword = '', sortBy = 'updated_at', order = 'DESC' }
) => {
  const validSortColumns = ['created_at', 'updated_at', 'note_name'];
  const validOrder = ['ASC', 'DESC'];

  if (!validSortColumns.includes(sortBy)) sortBy = 'updated_at';
  if (!validOrder.includes(order.toUpperCase())) order = 'DESC';

  const pool = getPool();
  const query = `
    SELECT id, note_name, content_html, updated_at, created_at
    FROM notes
    WHERE user_id = $1
      AND (note_name ILIKE $2 OR content_html ILIKE $2)
    ORDER BY ${sortBy} ${order}
    LIMIT $3 OFFSET $4
  `;

  const values = [userId, `%${searchKeyword}%`, limit, offset];
  const result = await pool.query(query, values);
  return result.rows;
};

const countFilteredNotes = async (userId, searchKeyword = '') => {
  const pool = getPool();
  const query = `
    SELECT COUNT(*) FROM notes
    WHERE user_id = $1 AND (note_name ILIKE $2 OR content_html ILIKE $2)
  `;
  const values = [userId, `%${searchKeyword}%`];
  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count);
};

module.exports = {
  findNoteByUserID,
  findAllNotesByUserID,
  findAllNotesByUserIDForDashboard,
  findNoteByNoteID,
  LoadHTMLByNoteID,
  SaveHTMLInNoteID,
  CreateNote,
  DeleteNote,
  SaveNewNameInNoteID,
  countFilteredNotes,
};
