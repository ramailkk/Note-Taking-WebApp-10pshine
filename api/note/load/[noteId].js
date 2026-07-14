const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { noteId } = req.query;

  try {
    const note = await notesModel.LoadHTMLByNoteID(noteId, user.userId);
    if (!note) {
      logger.warn({ noteId, userId: user.userId }, 'Note not found when fetching content');
      return res.status(404).json({ error: 'Note not found' });
    }
    logger.info({ noteId, userId: user.userId }, 'Note content fetched successfully');
    return res.status(200).json(note);
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error fetching note content');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
