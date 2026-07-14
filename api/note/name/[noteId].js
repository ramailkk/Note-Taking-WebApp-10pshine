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
  const { noteName } = req.body;

  if (!noteName) {
    return res.status(400).json({ error: 'Missing HTML content in request body.' });
  }

  try {
    const updated = await notesModel.SaveNewNameInNoteID(noteName, noteId, user.userId);
    if (!updated) {
      logger.warn({ noteId, userId: user.userId }, 'Note not found when updating name');
      return res.status(404).json({ error: 'Note not found' });
    }
    logger.info({ noteId, userId: user.userId, newName: noteName }, 'Note name updated successfully');
    return res.status(200).json({ message: 'Note name updated successfully.' });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error updating note name');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
