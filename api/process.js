import Anthropic from '@anthropic-ai/sdk'
import { parseClaudeJson, PROCESS_PROMPT } from './_utils.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables.' })
  }

  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'No text provided.' })

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: PROCESS_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const raw = message.content[0].text
    const json = parseClaudeJson(raw)
    res.json(json)
  } catch (err) {
    console.error('/api/process error:', err)
    res.status(500).json({ error: err.message || 'Failed to process text.' })
  }
}
