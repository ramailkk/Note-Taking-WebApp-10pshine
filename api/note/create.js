const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { notebookId } = req.body || {};

  try {
    const created = await notesModel.CreateNote(user.userId, notebookId);
    const note = {
      id: created.id,
      note_name: created.note_name,
      updated_at: created.updated_at,
      created_at: created.created_at,
      notebook_id: created.notebook_id,
    };
    logger.info({ noteId: note.id, userId: user.userId, notebookId }, 'Note created');
    return res.status(200).json(note);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error creating new note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
