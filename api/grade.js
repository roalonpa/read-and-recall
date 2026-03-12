import Anthropic from '@anthropic-ai/sdk'
import { parseClaudeJson } from './_utils.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables.' })
  }

  try {
    const { question, answer } = req.body

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system:
        'Grade the student answer fairly. Accept answers that are substantively correct even if imperfectly worded. Return ONLY valid JSON: { "correct": true or false, "feedback": "1-2 sentences of feedback." }',
      messages: [{ role: 'user', content: `Question: ${question}\nStudent's answer: ${answer}` }],
    })

    const json = parseClaudeJson(message.content[0].text)
    res.json(json)
  } catch (err) {
    console.error('/api/grade error:', err)
    res.status(500).json({ error: err.message || 'Failed to grade answer.' })
  }
}
