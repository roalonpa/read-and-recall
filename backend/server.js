import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const client = new Anthropic()

app.use(cors({ origin: 'http://localhost:5173' }))

app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.path} (${req.headers['content-length'] ?? '?'} bytes)`)
  next()
})

app.use(express.json({ limit: '10mb' }))

// Claude sometimes wraps JSON in ```json ... ``` even when asked not to.
// This strips that wrapper before parsing.
function parseClaudeJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(match ? match[1].trim() : text.trim())
}

const PROCESS_PROMPT = `You are processing study material for a student. The input is raw text extracted from a PDF, image, or webpage. It may have formatting artifacts, scrambled multi-column text, or OCR errors.

Your tasks:
1. CLEAN: Rewrite the content as clear, continuous, readable prose. Fix any artifacts. Do not summarize or remove content — students need the full material.
2. STRUCTURE: Use markdown headings (## ) only where the material clearly shifts to a major new topic. Do not add headings just to break up text. Prefer flowing paragraphs.
3. SPLIT: Divide the material into logical sections. Aim for 4–12 sections based on length and topic structure. Each section should be coherent on its own.
4. QUIZ per section: For shorter sections write 3–5 multiple choice questions; for longer sections write 8–10. Questions must test only the content of that specific section. Each has 4 answer choices. Include a brief explanation of the correct answer.
5. FINAL QUIZ: Write exactly 10 open-answer questions covering the most important concepts from the entire document.

Return ONLY valid JSON — no markdown, no code block, no extra text:
{
  "sections": [
    {
      "title": "Section title, or null if no heading is appropriate",
      "content": "Full cleaned text of this section.",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Why this answer is correct."
        }
      ]
    }
  ],
  "finalQuiz": ["Question 1?", "Question 2?", "...10 total"]
}`

app.post('/api/process', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided.' })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: PROCESS_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const raw = message.content[0].text
    console.log('Claude raw response (first 300 chars):', raw.slice(0, 300))
    const json = parseClaudeJson(raw)
    res.json(json)
  } catch (err) {
    console.error('/api/process error:', err)
    res.status(500).json({ error: 'Failed to process text.' })
  }
})

app.post('/api/grade', async (req, res) => {
  try {
    const { question, answer } = req.body

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system:
        'Grade the student answer fairly. Accept answers that are substantively correct even if imperfectly worded. Return ONLY valid JSON: { "correct": true or false, "feedback": "1-2 sentences of feedback." }',
      messages: [
        {
          role: 'user',
          content: `Question: ${question}\nStudent's answer: ${answer}`,
        },
      ],
    })

    const json = parseClaudeJson(message.content[0].text)
    res.json(json)
  } catch (err) {
    console.error('/api/grade error:', err)
    res.status(500).json({ error: 'Failed to grade answer.' })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { material, history, message } = req.body

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a tutor helping a student understand the topic they are studying. Explain concepts clearly and directly, as a teacher would — not by quoting or referencing a source, but by explaining the ideas in your own words. Never say "the material", "the text", "the book", or any equivalent phrase. Do not frame answers as "according to..." or "the source says...". Just explain. Use the content below as your sole knowledge base: do not introduce facts, data, or concepts from outside it. You can reason, draw conclusions, and make connections that go beyond what is literally written, as long as you stay within the topic. Only decline to answer if the question has nothing to do with the subject. Write in plain prose. Do not use markdown: no bold, no bullet points, no headers, no symbols.\n\n---\n${material}`,
      messages,
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('/api/chat error:', err)
    res.status(500).json({ error: 'Failed to get a response.' })
  }
})

app.get('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.query
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const html = await response.text()
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    res.json({ text })
  } catch (err) {
    console.error('/api/fetch-url error:', err.message)
    res.status(500).json({ error: 'Failed to fetch URL.' })
  }
})

// Catch errors thrown by middleware (e.g. body-parser payload too large)
// Without this, Express resets the socket instead of sending a response,
// which causes "socket hang up" in the Vite proxy.
app.use((err, req, res, next) => {
  console.error('Express middleware error:', err.status, err.message)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

app.listen(3001, () => console.log('Backend running on http://localhost:3001'))
