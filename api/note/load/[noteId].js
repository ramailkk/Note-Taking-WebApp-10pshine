const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;
  const { noteId } = req.query;

  try {
    if (req.method === 'GET') {
      // GET /api/note/load/[noteId] — load note HTML content
      const note = await notesModel.LoadHTMLByNoteID(noteId, userId);
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      return res.status(200).json(note);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error loading note content:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
