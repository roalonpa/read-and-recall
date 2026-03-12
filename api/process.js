import Anthropic from '@anthropic-ai/sdk'
import { parseClaudeJson, PROCESS_PROMPT } from './_utils.js'

const client = new Anthropic()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'No text provided.' })

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
    res.status(500).json({ error: 'Failed to process text.' })
  }
}
