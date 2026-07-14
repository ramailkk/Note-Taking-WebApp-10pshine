const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

// Consolidated router for /api/tasks and /api/tasks/*.
// Combines what used to be 3 separate files (index, all, [id]) into a
// single serverless function so the deployment stays under Vercel's
// Hobby-plan function limit. Uses an OPTIONAL catch-all ([[...slug]]) so
// the bare /api/tasks route matches too.
//
// NOTE: the literal "all" segment (DELETE /api/tasks/all) is checked
// before the dynamic "[id]" behaviour below, mirroring the old filesystem
// routing where the literal file took priority over the dynamic one.

async function listOrCreate(req, res, user) {
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

async function deleteAll(req, res, user) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deletedCount = await tasksModel.deleteAllTasks(user.userId);
    return res.status(200).json({ message: `Deleted ${deletedCount} task(s)`, count: deletedCount });
  } catch (error) {
    console.error('Error deleting all tasks:', error);
    return res.status(500).json({ error: 'Failed to delete tasks' });
  }
}

async function updateOrDeleteOne(req, res, user, id) {
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

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

  const rawSlug = req.query.slug;
  const slug = rawSlug == null ? [] : Array.isArray(rawSlug) ? rawSlug : [rawSlug];
  const [first] = slug;

  if (slug.length === 0) return listOrCreate(req, res, user);
  if (first === 'all' && req.method === 'DELETE') return deleteAll(req, res, user);
  if (first) return updateOrDeleteOne(req, res, user, first);

  return res.status(404).json({ error: 'Not found' });
}
