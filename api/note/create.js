const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const createNote = await notesModel.CreateNote(userId);

    return res.status(200).json({
      id: createNote.id,
      note_name: createNote.note_name,
      updated_at: createNote.updated_at,
      created_at: createNote.created_at,
    });
  } catch (err) {
    console.error('Error creating note:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
