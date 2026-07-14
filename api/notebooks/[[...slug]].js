const notebooksModel = require('../_lib/notebooksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

// Consolidated router for /api/notebooks and /api/notebooks/*.
// Combines what used to be 3 separate files (index, [id]/index,
// [id]/notes) into a single serverless function so the deployment stays
// under Vercel's Hobby-plan function limit. Uses an OPTIONAL catch-all
// ([[...slug]]) so the bare /api/notebooks route matches too.

async function listOrCreate(req, res, user) {
  if (req.method === 'GET') {
    try {
      const notebooks = await notebooksModel.getAllNotebooks(user.userId);
      logger.info({ userId: user.userId, count: notebooks.length }, 'Fetched all notebooks');
      return res.status(200).json({ notebooks });
    } catch (error) {
      logger.error({ error, userId: user.userId }, 'Error fetching notebooks');
      return res.status(500).json({ error: 'Failed to fetch notebooks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { notebookName } = req.body;
      const notebook = await notebooksModel.createNotebook(user.userId, notebookName || 'New Notebook');
      logger.info({ userId: user.userId, notebookId: notebook.id }, 'Created new notebook');
      return res.status(201).json({ notebook });
    } catch (error) {
      logger.error({ error, userId: user.userId }, 'Error creating notebook');
      return res.status(500).json({ error: 'Failed to create notebook' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function updateOrDelete(req, res, user, id) {
  if (req.method === 'PUT') {
    try {
      const { notebookName } = req.body;
      if (!notebookName || notebookName.trim() === '') {
        return res.status(400).json({ error: 'Notebook name is required' });
      }
      const notebook = await notebooksModel.updateNotebookName(id, user.userId, notebookName.trim());
      if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
      logger.info({ userId: user.userId, notebookId: id }, 'Updated notebook name');
      return res.status(200).json({ notebook });
    } catch (error) {
      logger.error({ error, userId: user.userId }, 'Error updating notebook');
      return res.status(500).json({ error: 'Failed to update notebook' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const notebooks = await notebooksModel.getAllNotebooks(user.userId);
      const notebookToDelete = notebooks.find((n) => n.id === parseInt(id));
      if (notebookToDelete && notebookToDelete.notebook_name === 'Uncategorized') {
        return res.status(400).json({ error: 'Cannot delete the Uncategorized notebook' });
      }

      const deletedNotebook = await notebooksModel.deleteNotebook(id, user.userId);
      if (!deletedNotebook) return res.status(404).json({ error: 'Notebook not found' });

      logger.info({ userId: user.userId, notebookId: id }, 'Deleted notebook, notes moved to Uncategorized');
      return res.status(200).json({ message: 'Notebook deleted successfully. Notes moved to Uncategorized.' });
    } catch (error) {
      logger.error({ error, userId: user.userId }, 'Error deleting notebook');
      return res.status(500).json({ error: 'Failed to delete notebook' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function notesForNotebook(req, res, user, id) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notebook = await notebooksModel.getNotebookWithNotes(id, user.userId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
    logger.info({ userId: user.userId, notebookId: id, noteCount: notebook.notes.length }, 'Fetched notebook with notes');
    return res.status(200).json({ notebook });
  } catch (error) {
    logger.error({ error, userId: user.userId }, 'Error fetching notebook');
    return res.status(500).json({ error: 'Failed to fetch notebook' });
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const rawSlug = req.query.slug;
  const slug = rawSlug == null ? [] : Array.isArray(rawSlug) ? rawSlug : [rawSlug];
  const [id, second] = slug;

  if (slug.length === 0) return listOrCreate(req, res, user);
  if (id && second === 'notes') return notesForNotebook(req, res, user, id);
  if (id && !second) return updateOrDelete(req, res, user, id);

  return res.status(404).json({ error: 'Not found' });
}
