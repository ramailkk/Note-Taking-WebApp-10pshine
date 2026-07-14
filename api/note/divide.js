const notesModel = require('../_lib/notesModel');
const notebooksModel = require('../_lib/notebooksModel');
const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

// Divides a note into multiple notes under a new notebook, then deletes the original.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { originalNoteId, notebookName, sections } = req.body;

  if (!originalNoteId) {
    return res.status(400).json({ error: 'Original note ID is required' });
  }
  if (!notebookName || notebookName.trim().length === 0) {
    return res.status(400).json({ error: 'Notebook name is required' });
  }
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: 'At least one section is required' });
  }

  try {
    const originalNote = await notesModel.findNoteByUserID(user.userId, originalNoteId);
    if (!originalNote) {
      return res.status(404).json({ error: 'Original note not found' });
    }

    const newNotebook = await notebooksModel.createNotebook(user.userId, notebookName.trim());

    const createdNotes = [];
    for (const section of sections) {
      if (!section.title || !section.content) continue;
      const newNote = await notesModel.CreateNote(user.userId, newNotebook.id);
      await notesModel.SaveNewNameInNoteID(section.title, newNote.id, user.userId);
      await notesModel.SaveHTMLInNoteID(section.content, newNote.id, user.userId);
      createdNotes.push({ id: newNote.id, title: section.title });
    }

    await notesModel.DeleteNote(originalNoteId, user.userId);
    await userModel.clearGraphMetadata(user.userId);

    logger.info({
      userId: user.userId,
      originalNoteId,
      notebookId: newNotebook.id,
      notebookName: newNotebook.notebook_name,
      notesCreated: createdNotes.length,
    }, 'Note divided successfully');

    return res.status(200).json({
      message: 'Note divided successfully',
      notebook: { id: newNotebook.id, name: newNotebook.notebook_name },
      notes: createdNotes,
    });
  } catch (err) {
    logger.error({ err, userId: user.userId, originalNoteId }, 'Error dividing note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
