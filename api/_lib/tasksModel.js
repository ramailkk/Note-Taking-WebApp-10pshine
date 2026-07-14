const { getPool } = require('./db');

const getAllTasks = async (userId) => {
  const { rows } = await getPool().query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const createTask = async (userId, taskText) => {
  const { rows } = await getPool().query(
    `INSERT INTO tasks (user_id, task_text) VALUES ($1, $2) RETURNING *`,
    [userId, taskText]
  );
  return rows[0];
};

const updateTaskStatus = async (taskId, userId, isCompleted) => {
  const { rows } = await getPool().query(
    `UPDATE tasks
     SET is_completed = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [isCompleted, taskId, userId]
  );
  return rows[0];
};

const deleteTask = async (taskId, userId) => {
  const { rows } = await getPool().query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
    [taskId, userId]
  );
  return rows[0];
};

const deleteAllTasks = async (userId) => {
  const result = await getPool().query('DELETE FROM tasks WHERE user_id = $1', [userId]);
  return result.rowCount;
};

module.exports = {
  getAllTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  deleteAllTasks,
};
