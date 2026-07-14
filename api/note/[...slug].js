const notesModel = require('../_lib/notesModel');
const notebooksModel = require('../_lib/notebooksModel');
const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const getSlug = require('../_lib/getSlug');
const logger = require('../_lib/logger');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const slug = getSlug(req, '/api/note');
  const [action, param] = slug;
  const method = req.method;

  const user = verifyToken(req, res);
  if (!user) return;

  if (action === 'save' && method === 'PUT') return saveNote(req, res, user, param);
  if (action === 'load' && method === 'GET') return loadNote(req, res, user, param);
  if (action === 'create' && method === 'POST') return createNote(req, res, user);
  if (action === 'remove' && method === 'DELETE') return removeNote(req, res, user, param);
  if (action === 'all' && method === 'GET') return allNotes(req, res, user);
  if (action === 'dashboard' && method === 'GET') return dashboard(req, res, user);
  if (action === 'name' && method === 'PUT') return renameNote(req, res, user, param);
  if (action === 'graph' && method === 'GET') return graph(req, res, user);
  if (action === 'protect' && method === 'POST') return protect(req, res, user, param);
  if (action === 'notebook' && method === 'PUT') return moveToNotebook(req, res, user, param);
  if (action === 'divide' && method === 'POST') return divide(req, res, user);

  return res.status(404).json({ error: 'Not found' });
}

async function saveNote(req, res, user, noteId) {
  const { ContentHTML } = req.body;
  if (!ContentHTML) {
    return res.status(400).json({ error: 'Missing HTML content in request body.' });
  }
  try {
    const updated = await notesModel.SaveHTMLInNoteID(ContentHTML, noteId, user.userId);
    if (!updated) return res.status(404).json({ error: 'Note not found' });
    logger.info({ noteId, userId: user.userId }, 'Note content updated successfully');
    return res.status(200).json({ message: 'Note content updated successfully.' });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error updating note content');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function loadNote(req, res, user, noteId) {
  try {
    const note = await notesModel.LoadHTMLByNoteID(noteId, user.userId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    logger.info({ noteId, userId: user.userId }, 'Note content fetched successfully');
    return res.status(200).json(note);
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error fetching note content');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createNote(req, res, user) {
  const { notebookId } = req.body || {};
  try {
    const created = await notesModel.CreateNote(user.userId, notebookId);
    const note = {
      id: created.id,
      note_name: created.note_name,
      updated_at: created.updated_at,
      created_at: created.created_at,
      notebook_id: created.notebook_id,
    };
    logger.info({ noteId: note.id, userId: user.userId, notebookId }, 'Note created');
    return res.status(200).json(note);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error creating new note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function removeNote(req, res, user, noteId) {
  try {
    const deleted = await notesModel.DeleteNote(noteId, user.userId);
    await userModel.clearGraphMetadata(user.userId);
    logger.info({ noteId, userId: user.userId }, 'Note deleted and graph cache cleared');
    return res.status(200).json({ message: 'Note delete successfully', note: deleted });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error deleting note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function allNotes(req, res, user) {
  try {
    const notes = await notesModel.findAllNotesByUserID(user.userId);
    const formatted = notes.map((note) => ({
      id: note.id,
      note_name: note.note_name,
      updatedAt: note.updated_at,
      createdAt: note.created_at,
    }));
    logger.info({ userId: user.userId, count: formatted.length }, 'Fetched all user notes');
    return res.status(200).json(formatted);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error fetching user notes');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function dashboard(req, res, user) {
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
    return res.status(200).json({ notes, page: parseInt(page), limit: parseInt(limit), totalCount });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function renameNote(req, res, user, noteId) {
  const { noteName } = req.body;
  if (!noteName) {
    return res.status(400).json({ error: 'Missing HTML content in request body.' });
  }
  try {
    const updated = await notesModel.SaveNewNameInNoteID(noteName, noteId, user.userId);
    if (!updated) return res.status(404).json({ error: 'Note not found' });
    logger.info({ noteId, userId: user.userId, newName: noteName }, 'Note name updated successfully');
    return res.status(200).json({ message: 'Note name updated successfully.' });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error updating note name');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function graph(req, res, user) {
  const { forceRegenerate } = req.query;
  try {
    if (!forceRegenerate) {
      const cachedGraph = await userModel.getGraphMetadata(user.userId);
      if (cachedGraph) {
        logger.info({ userId: user.userId }, 'Returning cached graph data');
        return res.status(200).json(cachedGraph);
      }
    }

    const notes = await notesModel.findAllNotesWithContentByUserID(user.userId);
    if (notes.length === 0) return res.status(200).json({ nodes: [], links: [] });

    const unprotectedNotes = notes.filter((n) => n.is_protected == 0 || n.is_protected == null);
    const protectedNotesOnly = notes.filter((n) => n.is_protected == 1);

    if (unprotectedNotes.length === 0) {
      const protectedNodes = protectedNotesOnly.map((note) => ({
        id: note.id, label: note.note_name, topic: 'Protected', isProtected: true, preview: '🔒 Protected note',
      }));
      return res.status(200).json({ nodes: protectedNodes, links: [] });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const notesForAnalysis = unprotectedNotes.map((note) => ({
      id: note.id,
      name: note.note_name,
      content: note.content_html ? note.content_html.replace(/<[^>]*>/g, ' ').substring(0, 500) : 'Empty note',
    }));

    const prompt = `Analyze these notes and identify their topics and relationships.

Notes:
${notesForAnalysis.map((note, idx) => `${idx + 1}. "${note.name}": ${note.content}`).join('\n\n')}

For each note, identify:
1. Primary topic/category (e.g., "Shopping", "Work", "Personal", "Finance", etc.)
2. Similarity scores with other notes (0.0 to 1.0, where 1.0 is very similar)

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "topics": [
    {"noteId": 1, "topic": "Shopping", "subtopic": "Groceries"},
    {"noteId": 2, "topic": "Shopping", "subtopic": "Hardware"}
  ],
  "relationships": [
    {"source": 1, "target": 2, "similarity": 0.75}
  ]
}

Rules:
- Only include relationships with similarity >= 0.3
- noteId should be 1-indexed (matching the list above)
- Be concise with topics (max 2 words)`;

    const result = await model.generateContent(prompt);
    let analysisText = result.response.text();
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseErr) {
      logger.error({ parseErr, analysisText }, 'Failed to parse Gemini response');
      const nodes = notes.map((note) => ({ id: note.id, label: note.note_name, topic: 'Uncategorized' }));
      return res.status(200).json({ nodes, links: [] });
    }

    const nodes = unprotectedNotes.map((note, idx) => {
      const topicInfo = analysis.topics?.find((t) => t.noteId === idx + 1) || {};
      return {
        id: note.id,
        label: note.note_name,
        topic: topicInfo.topic || 'Other',
        subtopic: topicInfo.subtopic || '',
        preview: notesForAnalysis[idx].content.substring(0, 100) + '...',
        isProtected: false,
      };
    });

    const links = (analysis.relationships || [])
      .map((rel) => {
        const sourceNote = unprotectedNotes[rel.source - 1];
        const targetNote = unprotectedNotes[rel.target - 1];
        if (!sourceNote || !targetNote) return null;
        return { source: sourceNote.id, target: targetNote.id, strength: rel.similarity };
      })
      .filter((link) => link !== null);

    const protectedNodes = protectedNotesOnly.map((note) => ({
      id: note.id, label: note.note_name, topic: 'Protected', subtopic: '',
      preview: '🔒 Protected note - excluded from AI analysis', isProtected: true,
    }));

    const allNodes = [...nodes, ...protectedNodes];

    logger.info({
      userId: user.userId, totalNotes: notes.length, unprotectedCount: unprotectedNotes.length,
      protectedCount: protectedNotesOnly.length, linksCount: links.length,
    }, 'Generated notes graph data');

    const graphData = { nodes: allNodes, links };
    await userModel.saveGraphMetadata(user.userId, graphData);
    logger.info({ userId: user.userId }, 'Saved graph metadata to database');

    return res.status(200).json(graphData);
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error generating notes graph');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function protect(req, res, user, noteId) {
  const { isProtected } = req.body;
  if (typeof isProtected !== 'boolean') {
    return res.status(400).json({ error: 'isProtected must be a boolean' });
  }
  try {
    const updatedNote = await notesModel.toggleNoteProtection(noteId, user.userId, isProtected);
    if (!updatedNote) return res.status(404).json({ error: 'Note not found' });
    await userModel.clearGraphMetadata(user.userId);
    logger.info({ noteId, userId: user.userId, isProtected }, 'Note protection toggled, graph cache cleared');
    return res.status(200).json({
      message: `Note ${isProtected ? 'protected' : 'unprotected'} successfully`,
      note: { id: updatedNote.id, note_name: updatedNote.note_name, is_protected: updatedNote.is_protected },
    });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error toggling note protection');
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}

async function moveToNotebook(req, res, user, noteId) {
  const { notebookId } = req.body;
  if (!notebookId) return res.status(400).json({ error: 'Notebook ID is required' });
  try {
    const updatedNote = await notesModel.moveNoteToNotebook(noteId, user.userId, notebookId);
    if (!updatedNote) return res.status(404).json({ error: 'Note not found' });
    logger.info({ noteId, userId: user.userId, notebookId }, 'Note moved to different notebook');
    return res.status(200).json({ note: updatedNote });
  } catch (err) {
    logger.error({ err, noteId, userId: user.userId }, 'Error moving note to notebook');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function divide(req, res, user) {
  const { originalNoteId, notebookName, sections } = req.body;
  if (!originalNoteId) return res.status(400).json({ error: 'Original note ID is required' });
  if (!notebookName || notebookName.trim().length === 0) {
    return res.status(400).json({ error: 'Notebook name is required' });
  }
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: 'At least one section is required' });
  }
  try {
    const originalNote = await notesModel.findNoteByUserID(user.userId, originalNoteId);
    if (!originalNote) return res.status(404).json({ error: 'Original note not found' });

    const newNotebook = await notebooksModel.createNotebook(user.userId, notebookName.trim());

    const createdNotes = [];
    for (const section of sections) {
      if (!section.title || !section.content) continue;
      const newNote = await notesModel.CreateNote(user.userId, newNotebook.id);
      await notesModel.SaveNewNameInNoteID(section.title, newNote.id, user.userId);
      await notesModel.SaveHTMLInNoteID(section.content, newNote.id, user.userId);
      createdNotes.push({ id: newNote.id, title: section.title });
    }

    await notesModel.DeleteNote(originalNoteId, user.userId);
    await userModel.clearGraphMetadata(user.userId);

    logger.info({
      userId: user.userId, originalNoteId, notebookId: newNotebook.id,
      notebookName: newNotebook.notebook_name, notesCreated: createdNotes.length,
    }, 'Note divided successfully');

    return res.status(200).json({
      message: 'Note divided successfully',
      notebook: { id: newNotebook.id, name: newNotebook.notebook_name },
      notes: createdNotes,
    });
  } catch (err) {
    logger.error({ err, userId: user.userId, originalNoteId }, 'Error dividing note');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
