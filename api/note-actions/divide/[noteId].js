const notesModel = require('../../_lib/notesModel');
const notebooksModel = require('../../_lib/notebooksModel');
const userModel = require('../../_lib/userModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

// AI-assisted version: asks Gemini to suggest how to split the note before creating anything.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

  const { noteId } = req.query;

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
      userId: user.userId,
      originalNoteId: noteId,
      notebookId: newNotebook.id,
      notesCreated: createdNotes.length,
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
