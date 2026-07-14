const { getPool } = require('./db');
const encryption = require('./encryption');

const findNoteByUserID = async (userId, noteId) => {
  const { rows } = await getPool().query(
    'SELECT * FROM notes WHERE user_id = $1 AND id = $2',
    [userId, noteId]
  );
  return rows[0];
};

const findAllNotesByUserID = async (userId) => {
  const { rows } = await getPool().query(
    'SELECT id, note_name, updated_at, created_at FROM notes WHERE user_id = $1',
    [userId]
  );
  return rows;
};

const findNoteByNoteID = async (noteId) => {
  const { rows } = await getPool().query('SELECT * FROM notes WHERE id = $1', [noteId]);
  return rows[0];
};

const CreateNote = async (userId, notebookId = null) => {
  const { rows } = await getPool().query(
    `INSERT INTO notes (user_id, notebook_id)
     VALUES ($1, $2)
     RETURNING id, note_name, updated_at, created_at, notebook_id`,
    [userId, notebookId]
  );
  return rows[0];
};

const LoadHTMLByNoteID = async (noteId, userId) => {
  const { rows } = await getPool().query(
    'SELECT content_html, is_protected, encryption_iv, notebook_id FROM notes WHERE id = $1 AND user_id = $2',
    [noteId, userId]
  );

  if (rows.length === 0) return null;
  const note = rows[0];

  if (note.is_protected && note.content_html) {
    try {
      const encryptedData = note.content_html.slice(0, -32);
      const authTag = note.content_html.slice(-32);
      const decrypted = encryption.decryptContent(encryptedData, note.encryption_iv, authTag, userId);
      return { content_html: decrypted, is_protected: true, notebook_id: note.notebook_id };
    } catch (err) {
      throw new Error('Failed to decrypt protected note');
    }
  }

  return { content_html: note.content_html, is_protected: note.is_protected || false, notebook_id: note.notebook_id };
};

const SaveHTMLInNoteID = async (htmlContent, noteId, userId) => {
  const pool = getPool();

  const checkResult = await pool.query(
    'SELECT is_protected FROM notes WHERE id = $1 AND user_id = $2',
    [noteId, userId]
  );
  const note = checkResult.rows[0];
  if (!note) throw new Error('Note not found');

  let contentToSave = htmlContent;
  let ivToSave = null;

  if (note.is_protected) {
    const { encryptedData, iv, authTag } = encryption.encryptContent(htmlContent, userId);
    contentToSave = encryptedData + authTag;
    ivToSave = iv;
  }

  const { rows } = await pool.query(
    `UPDATE notes
     SET content_html = $1,
         encryption_iv = COALESCE($2, encryption_iv),
         updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [contentToSave, ivToSave, noteId, userId]
  );
  return rows[0];
};

const SaveNewNameInNoteID = async (noteName, noteId, userId) => {
  const { rows } = await getPool().query(
    `UPDATE notes
     SET note_name = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [noteName, noteId, userId]
  );
  return rows[0];
};

const DeleteNote = async (noteId, userId) => {
  const { rows } = await getPool().query(
    'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
    [noteId, userId]
  );
  return rows[0];
};

const findAllNotesByUserIDForDashboard = async (
  userId,
  { limit = 10, offset = 0, searchKeyword = '', sortBy = 'updated_at', order = 'DESC' }
) => {
  const validSortColumns = ['created_at', 'updated_at', 'note_name'];
  const validOrder = ['ASC', 'DESC'];
  if (!validSortColumns.includes(sortBy)) sortBy = 'updated_at';
  if (!validOrder.includes(order.toUpperCase())) order = 'DESC';

  // sortBy/order are validated against a whitelist above (not user input
  // interpolated directly), so this is safe from injection.
  const query = `
    SELECT id, note_name, content_html, updated_at, created_at, is_protected
    FROM notes
    WHERE user_id = $1
      AND (note_name ILIKE $2 OR content_html ILIKE $2)
    ORDER BY ${sortBy} ${order}
    OFFSET $3 LIMIT $4
  `;

  const { rows } = await getPool().query(query, [userId, `%${searchKeyword}%`, offset, limit]);
  return rows;
};

const countFilteredNotes = async (userId, searchKeyword = '') => {
  const { rows } = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM notes
     WHERE user_id = $1
       AND (note_name ILIKE $2 OR content_html ILIKE $2)`,
    [userId, `%${searchKeyword}%`]
  );
  return parseInt(rows[0].count, 10);
};

const findAllNotesWithContentByUserID = async (userId) => {
  const { rows } = await getPool().query(
    `SELECT id, note_name, content_html, updated_at, created_at, is_protected
     FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
};

const toggleNoteProtection = async (noteId, userId, isProtected) => {
  const pool = getPool();

  const noteResult = await pool.query(
    'SELECT content_html, is_protected, encryption_iv FROM notes WHERE id = $1 AND user_id = $2',
    [noteId, userId]
  );
  const note = noteResult.rows[0];
  if (!note) throw new Error('Note not found');

  let contentToSave = note.content_html;
  let ivToSave = null;

  if (isProtected && !note.is_protected) {
    const { encryptedData, iv, authTag } = encryption.encryptContent(note.content_html || '', userId);
    contentToSave = encryptedData + authTag;
    ivToSave = iv;
  } else if (!isProtected && note.is_protected) {
    if (note.content_html && note.encryption_iv) {
      const encryptedData = note.content_html.slice(0, -32);
      const authTag = note.content_html.slice(-32);
      contentToSave = encryption.decryptContent(encryptedData, note.encryption_iv, authTag, userId);
    } else {
      contentToSave = '';
    }
    ivToSave = null;
  }

  const { rows } = await pool.query(
    `UPDATE notes
     SET is_protected = $1, content_html = $2, encryption_iv = $3, updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [isProtected, contentToSave, ivToSave, noteId, userId]
  );
  return rows[0];
};

const moveNoteToNotebook = async (noteId, userId, notebookId) => {
  const { rows } = await getPool().query(
    `UPDATE notes
     SET notebook_id = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [notebookId, noteId, userId]
  );
  return rows[0];
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
  findAllNotesWithContentByUserID,
  toggleNoteProtection,
  moveNoteToNotebook,
};
