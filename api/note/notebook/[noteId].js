const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { noteId } = req.query;
  const { notebookId } = req.body;

  if (!notebookId) {
    return res.status(400).json({ error: 'Notebook ID is required' });
  }

  try {
    const updatedNote = await notesModel.moveNoteToNotebook(noteId, user.userId, notebookId);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    logger.info({ noteId, userId: user.userId, notebookId }, 'Note moved to different notebook');
    return res.status(200).json({ note: updatedNote });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error moving note to notebook');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
