const notesModel = require('../../_lib/notesModel');
const userModel = require('../../_lib/userModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { noteId } = req.query;
  const { isProtected } = req.body;

  if (typeof isProtected !== 'boolean') {
    return res.status(400).json({ error: 'isProtected must be a boolean' });
  }

  try {
    const updatedNote = await notesModel.toggleNoteProtection(noteId, user.userId, isProtected);
    if (!updatedNote) {
      logger.warn({ noteId, userId: user.userId }, 'Note not found when toggling protection');
      return res.status(404).json({ error: 'Note not found' });
    }

    await userModel.clearGraphMetadata(user.userId);
    logger.info({ noteId, userId: user.userId, isProtected }, 'Note protection toggled, graph cache cleared');

    return res.status(200).json({
      message: `Note ${isProtected ? 'protected' : 'unprotected'} successfully`,
      note: { id: updatedNote.id, note_name: updatedNote.note_name, is_protected: updatedNote.is_protected },
    });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error toggling note protection');
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}
