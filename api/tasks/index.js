const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

// Handles exactly /api/tasks (GET list, POST create). Vercel matches this
// literal file before ever considering the [...slug].js catch-all in this
// same folder, so there's no ambiguity for the bare path.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = verifyToken(req, res);
  if (!user) return;

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
