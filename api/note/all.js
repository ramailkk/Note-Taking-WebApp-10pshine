const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    if (req.method === 'GET') {
      // GET /api/note/all — get all notes (id, name, timestamps only)
      const notes = await notesModel.findAllNotesByUserID(userId);

      const formattedNotes = notes.map((note) => ({
        id: note.id,
        note_name: note.note_name,
        updatedAt: note.updated_at,
        createdAt: note.created_at,
      }));

      return res.status(200).json(formattedNotes);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error fetching all user notes:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
