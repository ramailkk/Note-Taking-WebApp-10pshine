const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const getSlug = require('../_lib/getSlug');

// Everything under /api/tasks/* funnels here via vercel.json's rewrite.
// slug.length === 0 means the bare /api/tasks path.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const slug = getSlug(req);

  // Bare /api/tasks
  if (slug.length === 0) {
    if (req.method === 'GET') {
      try {
        const tasks = await tasksModel.getAllTasks(user.userId);
        return res.status(200).json({ tasks });
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({ error: 'Failed to fetch tasks' });
      }
    }
    if (req.method === 'POST') {
      try {
        const { taskText } = req.body;
        if (!taskText || taskText.trim() === '') {
          return res.status(400).json({ error: 'Task text is required' });
        }
        const task = await tasksModel.createTask(user.userId, taskText.trim());
        return res.status(201).json({ task });
      } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ error: 'Failed to create task' });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [first] = slug;

  // /api/tasks/all
  if (first === 'all' && req.method === 'DELETE') {
    try {
      const deletedCount = await tasksModel.deleteAllTasks(user.userId);
      return res.status(200).json({ message: `Deleted ${deletedCount} task(s)`, count: deletedCount });
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      return res.status(500).json({ error: 'Failed to delete tasks' });
    }
  }

  // /api/tasks/:id
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
