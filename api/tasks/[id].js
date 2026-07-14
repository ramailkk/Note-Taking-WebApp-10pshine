const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const { isCompleted } = req.body;
      if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ error: 'isCompleted must be a boolean' });
      }
      const task = await tasksModel.updateTaskStatus(id, user.userId, isCompleted);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.status(200).json({ task });
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }
      const deletedTask = await tasksModel.deleteTask(taskId, user.userId);
      if (!deletedTask) return res.status(404).json({ error: 'Task not found' });
      return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
