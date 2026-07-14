const notesModel = require('../_lib/notesModel');
const notebooksModel = require('../_lib/notebooksModel');
const tasksModel = require('../_lib/tasksModel');
const userModel = require('../_lib/userModel');
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

  const slug = req.query.slug || [];
  const [action, param] = slug;

  if (action === 'highlight' && param) return highlight(req, res, user, param);
  if (action === 'divide' && param) return divide(req, res, user, param);
  if (action === 'extract-tasks') return extractTasks(req, res, user);
  if (action === 'create-tasks') return createTasks(req, res, user);

  return res.status(404).json({ error: 'Not found' });
}

async function highlight(req, res, user, noteId) {
  try {
    const note = await notesModel.LoadHTMLByNoteID(noteId, user.userId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.is_protected) return res.status(400).json({ error: 'Cannot analyze protected notes' });

    const cleanContent = note.content_html ? note.content_html.replace(/<[^>]*>/g, ' ').trim() : '';
    if (!cleanContent || cleanContent.length < 10) {
      return res.status(400).json({ error: 'Note content is too short to analyze' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const prompt = `Analyze this text and identify the most important phrases/sentences that should be highlighted.

Text:
${cleanContent}

Return ONLY a valid JSON array of objects with the exact text to highlight. Maximum 10 items.
Format: [{"text": "exact phrase to highlight", "color": "#ffeb3b"}, ...]

Rules:
- Use EXACT text from the document (must match character-for-character)
- Highlight key facts, important terms, conclusions, or action items
- Use yellow (#ffeb3b) for general highlights
- Use green (#a5d6a7) for positive/success items
- Use red (#ef9a9a) for warnings/important alerts
- Keep each highlight under 100 characters`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let highlights = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) highlights = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      logger.warn({ parseErr }, 'Failed to parse highlight suggestions');
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    logger.info({ userId: user.userId, noteId, highlightCount: highlights.length }, 'Generated highlight suggestions');
    return res.status(200).json({ highlights });
  } catch (err) {
    logger.error({ err, userId: user.userId, noteId }, 'Error getting highlight suggestions');
    return res.status(500).json({ error: 'Failed to analyze note' });
  }
}

async function divide(req, res, user, noteId) {
  try {
    const note = await notesModel.LoadHTMLByNoteID(noteId, user.userId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.is_protected) return res.status(400).json({ error: 'Cannot divide protected notes' });

    const noteDetails = await notesModel.findNoteByUserID(user.userId, noteId);
    const noteName = noteDetails?.note_name || 'Divided Note';

    const cleanContent = note.content_html ? note.content_html.replace(/<[^>]*>/g, ' ').trim() : '';
    if (!cleanContent || cleanContent.length < 50) {
      return res.status(400).json({ error: 'Note content is too short to divide' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const prompt = `Analyze this note content and divide it into logical sections.

Original Note Title: "${noteName}"
Content:
${cleanContent}

Return ONLY a valid JSON object with a suggested notebook name and sections.
Format:
{
  "notebook_name": "Suggested Notebook Name",
  "sections": [
    {"title": "Section 1 Title", "content": "<p>HTML formatted content for this section</p>"},
    {"title": "Section 2 Title", "content": "<p>HTML formatted content for this section</p>"}
  ]
}

Rules:
- Create 2-6 logical sections based on topics/themes
- Each section should have a descriptive title
- Preserve meaning but you can reorganize for clarity
- Wrap content in proper HTML tags (<p>, <ul>, <li>, etc.)
- The notebook name should describe the overall topic`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let divisionData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) divisionData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      logger.warn({ parseErr }, 'Failed to parse division suggestions');
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    if (!divisionData || !divisionData.sections || divisionData.sections.length === 0) {
      return res.status(500).json({ error: 'AI could not determine how to divide this note' });
    }

    const newNotebook = await notebooksModel.createNotebook(
      user.userId,
      divisionData.notebook_name || `${noteName} - Sections`
    );

    const createdNotes = [];
    for (const section of divisionData.sections) {
      if (!section.title || !section.content) continue;
      const newNote = await notesModel.CreateNote(user.userId, newNotebook.id);
      await notesModel.SaveNewNameInNoteID(section.title, newNote.id, user.userId);
      await notesModel.SaveHTMLInNoteID(section.content, newNote.id, user.userId);
      createdNotes.push({ id: newNote.id, title: section.title });
    }

    await notesModel.DeleteNote(noteId, user.userId);
    await userModel.clearGraphMetadata(user.userId);

    logger.info({
      userId: user.userId, originalNoteId: noteId, notebookId: newNotebook.id, notesCreated: createdNotes.length,
    }, 'Note divided successfully via toolbar action');

    return res.status(200).json({
      message: 'Note divided successfully',
      notebook: { id: newNotebook.id, name: newNotebook.notebook_name },
      notes: createdNotes,
    });
  } catch (err) {
    logger.error({ err, userId: user.userId, noteId }, 'Error dividing note');
    return res.status(500).json({ error: 'Failed to divide note' });
  }
}

async function extractTasks(req, res, user) {
  try {
    const notes = await notesModel.findAllNotesWithContentByUserID(user.userId);
    if (!notes || notes.length === 0) {
      return res.status(200).json({ tasks: [], message: 'No notes found to analyze' });
    }

    const unprotectedNotes = notes.filter((n) => !n.is_protected);
    if (unprotectedNotes.length === 0) {
      return res.status(200).json({ tasks: [], message: 'All notes are protected - cannot analyze' });
    }

    let notesContext = '';
    unprotectedNotes.forEach((note) => {
      const cleanContent = note.content_html
        ? note.content_html.replace(/<[^>]*>/g, ' ').trim().substring(0, 1000)
        : '';
      if (cleanContent.length > 10) {
        notesContext += `\nNote "${note.note_name}":\n${cleanContent}\n`;
      }
    });

    if (notesContext.length < 50) {
      return res.status(200).json({ tasks: [], message: "Notes don't contain enough content to extract tasks" });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const prompt = `Analyze these notes and identify any actionable tasks, to-dos, or action items that should be tracked.

Notes:
${notesContext}

Return ONLY a valid JSON object with the tasks found.
Format:
{
  "found": true,
  "tasks": [
    {"text": "Task description", "source": "Note name where this was found"},
    {"text": "Another task", "source": "Another note"}
  ]
}

If no actionable tasks are found, return:
{
  "found": false,
  "message": "No actionable tasks found in the notes"
}

Rules:
- Look for action items, deadlines, things to do, reminders
- Task text should be clear and actionable
- Maximum 10 tasks
- Be selective - only include genuine tasks, not general information`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let taskData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) taskData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      logger.warn({ parseErr }, 'Failed to parse task extraction response');
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    if (!taskData) {
      return res.status(200).json({ tasks: [], message: 'Could not analyze notes for tasks' });
    }
    if (!taskData.found || !taskData.tasks || taskData.tasks.length === 0) {
      return res.status(200).json({ tasks: [], message: taskData.message || 'No actionable tasks found in your notes' });
    }

    logger.info({ userId: user.userId, taskCount: taskData.tasks.length }, 'Extracted potential tasks from notes');
    return res.status(200).json({
      tasks: taskData.tasks,
      message: `Found ${taskData.tasks.length} potential task(s)`,
    });
  } catch (err) {
    logger.error({ err, userId: user.userId }, 'Error extracting tasks from notes');
    return res.status(500).json({ error: 'Failed to analyze notes for tasks' });
  }
}

async function createTasks(req, res, user) {
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
