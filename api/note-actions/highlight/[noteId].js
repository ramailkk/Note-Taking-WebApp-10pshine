const notesModel = require('../../_lib/notesModel');
const verifyToken = require('../../_lib/middleware');
const applyCors = require('../../_lib/cors');
const logger = require('../../_lib/logger');

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
