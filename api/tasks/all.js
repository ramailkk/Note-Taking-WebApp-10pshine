const tasksModel = require('../_lib/tasksModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

// NOTE: this literal "all" path must resolve before the "[id]" dynamic
// route below for DELETE /api/tasks/all — Vercel's filesystem routing
// prefers a literal match over a dynamic one, so this works automatically
// as long as this file exists.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  try {
    const deletedCount = await tasksModel.deleteAllTasks(user.userId);
    return res.status(200).json({ message: `Deleted ${deletedCount} task(s)`, count: deletedCount });
  } catch (error) {
    console.error('Error deleting all tasks:', error);
    return res.status(500).json({ error: 'Failed to delete tasks' });
  }
}
