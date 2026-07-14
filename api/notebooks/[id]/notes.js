const notebooksModel = require('../../_lib/notebooksModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { id } = req.query;

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
