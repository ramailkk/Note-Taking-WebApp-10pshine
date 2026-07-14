const notebooksModel = require('../../_lib/notebooksModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const { id } = req.query;

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
