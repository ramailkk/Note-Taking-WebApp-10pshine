const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  try {
    const notes = await notesModel.findAllNotesByUserID(user.userId);
    const formatted = notes.map((note) => ({
      id: note.id,
      note_name: note.note_name,
      updatedAt: note.updated_at,
      createdAt: note.created_at,
    }));
    logger.info({ userId: user.userId, count: formatted.length }, 'Fetched all user notes');
    return res.status(200).json(formatted);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error fetching user notes');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
