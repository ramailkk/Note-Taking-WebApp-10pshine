const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'No tasks provided' });
  }

  try {
    const createdTasks = [];
    for (const task of tasks) {
      if (task.text && task.text.trim()) {
        const newTask = await tasksModel.createTask(user.userId, task.text.trim());
        createdTasks.push(newTask);
      }
    }
    logger.info({ userId: user.userId, count: createdTasks.length }, 'Created tasks from extraction');
    return res.status(200).json({ message: `Created ${createdTasks.length} task(s)`, tasks: createdTasks });
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error creating extracted tasks');
    return res.status(500).json({ error: 'Failed to create tasks' });
  }
}
