const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { page = 1, limit = 10, search = '', sortBy = 'updated_at', order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const notes = await notesModel.findAllNotesByUserIDForDashboard(user.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      searchKeyword: search,
      sortBy,
      order,
    });
    const totalCount = await notesModel.countFilteredNotes(user.userId, search);

    return res.status(200).json({
      notes,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
