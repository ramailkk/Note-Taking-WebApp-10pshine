const { getPool } = require('./db');

const getAllNotebooks = async (userId) => {
  const { rows } = await getPool().query(
    `SELECT n.id, n.notebook_name, n.created_at, n.updated_at,
            COUNT(nt.id) AS note_count
     FROM notebooks n
     LEFT JOIN notes nt ON nt.notebook_id = n.id
     WHERE n.user_id = $1
     GROUP BY n.id, n.notebook_name, n.created_at, n.updated_at
     ORDER BY n.updated_at DESC`,
    [userId]
  );
  return rows;
};

const createNotebook = async (userId, notebookName) => {
  const { rows } = await getPool().query(
    `INSERT INTO notebooks (user_id, notebook_name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, notebookName || 'New Notebook']
  );
  return rows[0];
};

const updateNotebookName = async (notebookId, userId, newName) => {
  const { rows } = await getPool().query(
    `UPDATE notebooks
     SET notebook_name = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [newName, notebookId, userId]
  );
  return rows[0];
};

const deleteNotebook = async (notebookId, userId) => {
  const pool = getPool();

  let uncategorized = await pool.query(
    `SELECT id FROM notebooks WHERE user_id = $1 AND notebook_name = 'Uncategorized'`,
    [userId]
  );

  let uncategorizedId;
  if (uncategorized.rows.length === 0) {
    const created = await pool.query(
      `INSERT INTO notebooks (user_id, notebook_name) VALUES ($1, 'Uncategorized') RETURNING id`,
      [userId]
    );
    uncategorizedId = created.rows[0].id;
  } else {
    uncategorizedId = uncategorized.rows[0].id;
  }

  await pool.query(
    'UPDATE notes SET notebook_id = $1 WHERE notebook_id = $2 AND user_id = $3',
    [uncategorizedId, notebookId, userId]
  );

  const { rows } = await pool.query(
    'DELETE FROM notebooks WHERE id = $1 AND user_id = $2 RETURNING *',
    [notebookId, userId]
  );
  return rows[0];
};

const getNotebookWithNotes = async (notebookId, userId) => {
  const pool = getPool();
  const notebookResult = await pool.query(
    'SELECT * FROM notebooks WHERE id = $1 AND user_id = $2',
    [notebookId, userId]
  );

  if (notebookResult.rows.length === 0) return null;

  const notebook = notebookResult.rows[0];

  const notesResult = await pool.query(
    `SELECT id, note_name, updated_at, created_at, is_protected
     FROM notes
     WHERE notebook_id = $1 AND user_id = $2
     ORDER BY updated_at DESC`,
    [notebookId, userId]
  );

  notebook.notes = notesResult.rows;
  return notebook;
};

const getNotebookNoteCount = async (notebookId, userId) => {
  const { rows } = await getPool().query(
    'SELECT COUNT(*) AS count FROM notes WHERE notebook_id = $1 AND user_id = $2',
    [notebookId, userId]
  );
  return rows[0].count;
};

module.exports = {
  getAllNotebooks,
  createNotebook,
  updateNotebookName,
  deleteNotebook,
  getNotebookWithNotes,
  getNotebookNoteCount,
};
