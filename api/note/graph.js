const notesModel = require('../_lib/notesModel');
const userModel = require('../_lib/userModel');
const verifyToken = require('../_lib/middleware');
const applyCors = require('../_lib/cors');
const logger = require('../_lib/logger');

// Uses Gemini API to analyze semantic relationships between notes.
// Checks cached data first (users.graph_meta_data) to avoid unnecessary API calls.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req, res);
  if (!user) return;

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
    if (notes.length === 0) {
      return res.status(200).json({ nodes: [], links: [] });
    }

    const unprotectedNotes = notes.filter((n) => n.is_protected == 0 || n.is_protected == null);
    const protectedNotesOnly = notes.filter((n) => n.is_protected == 1);

    if (unprotectedNotes.length === 0) {
      const protectedNodes = protectedNotesOnly.map((note) => ({
        id: note.id,
        label: note.note_name,
        topic: 'Protected',
        isProtected: true,
        preview: '🔒 Protected note',
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
      id: note.id,
      label: note.note_name,
      topic: 'Protected',
      subtopic: '',
      preview: '🔒 Protected note - excluded from AI analysis',
      isProtected: true,
    }));

    const allNodes = [...nodes, ...protectedNodes];

    logger.info({
      userId: user.userId,
      totalNotes: notes.length,
      unprotectedCount: unprotectedNotes.length,
      protectedCount: protectedNotesOnly.length,
      linksCount: links.length,
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
