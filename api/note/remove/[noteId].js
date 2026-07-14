const notesModel = require('../../_lib/notesModel');
const userModel = require('../../_lib/userModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { noteId } = req.query;

  try {
    const deleted = await notesModel.DeleteNote(noteId, user.userId);
    await userModel.clearGraphMetadata(user.userId);
    logger.info({ noteId, userId: user.userId }, 'Note deleted and graph cache cleared');
    return res.status(200).json({ message: 'Note delete successfully', note: deleted });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error deleting note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
