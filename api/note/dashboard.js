const notesModel = require('../_lib/notesModel');
const verifyToken = require('../_lib/middleware');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const userId = user.userId;
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'updated_at',
    order = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const notes = await notesModel.findAllNotesByUserIDForDashboard(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      searchKeyword: search,
      sortBy,
      order,
    });

    const totalCount = await notesModel.countFilteredNotes(userId, search);

    return res.status(200).json({
      notes,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
    });
  } catch (err) {
    console.error('Error fetching dashboard notes:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
