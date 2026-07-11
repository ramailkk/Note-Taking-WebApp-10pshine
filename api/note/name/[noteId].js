const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;
  const { noteId } = req.query;
  const { noteName } = req.body;

  if (!noteName) {
    return res.status(400).json({ error: 'Missing note name in request body.' });
  }

  try {
    const updatedNote = await notesModel.SaveNewNameInNoteID(noteName, noteId, userId);

    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.status(200).json({ message: 'Note name updated successfully.' });
  } catch (err) {
    console.error('Error updating note name:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
