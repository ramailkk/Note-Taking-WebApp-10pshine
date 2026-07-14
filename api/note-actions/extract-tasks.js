const notesModel = require('../_lib/notesModel');
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
