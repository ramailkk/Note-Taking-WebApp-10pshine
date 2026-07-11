const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;
  const { noteId } = req.query;

  try {
    const deletedNote = await notesModel.DeleteNote(noteId, userId);

    return res.status(200).json({
      message: 'Note deleted successfully',
      note: deletedNote,
    });
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
