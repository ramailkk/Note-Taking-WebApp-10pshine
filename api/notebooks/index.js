const notebooksModel = require('../_lib/notebooksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

// Handles exactly /api/notebooks (GET list, POST create).
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

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
