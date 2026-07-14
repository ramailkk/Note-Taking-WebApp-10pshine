const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const getSlug = require('../_lib/getSlug');

// Handles /api/tasks/all (DELETE) and /api/tasks/:id (PATCH, DELETE).
// A request with zero extra segments (/api/tasks) never reaches this file —
// Vercel routes it to the literal index.js in this same folder instead.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const slug = getSlug(req, '/api/tasks');
  const [first] = slug;

  if (first === 'all' && req.method === 'DELETE') {
    try {
      const deletedCount = await tasksModel.deleteAllTasks(user.userId);
      return res.status(200).json({ message: `Deleted ${deletedCount} task(s)`, count: deletedCount });
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      return res.status(500).json({ error: 'Failed to delete tasks' });
    }
  }

  // Anything else with exactly one segment is treated as a task id.
  if (slug.length === 1) {
    const id = first;

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
        if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });
        const deletedTask = await tasksModel.deleteTask(taskId, user.userId);
        if (!deletedTask) return res.status(404).json({ error: 'Task not found' });
        return res.status(200).json({ message: 'Task deleted successfully' });
      } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ error: 'Failed to delete task' });
      }
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
