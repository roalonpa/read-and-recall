const Anthropic = require('@anthropic-ai/sdk')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' })
  }

  try {
    const { material, history, message } = req.body

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a tutor helping a student understand the topic they are studying. Explain concepts clearly and directly, as a teacher would — not by quoting or referencing a source, but by explaining the ideas in your own words. Never say "the material", "the text", "the book", or any equivalent phrase. Do not frame answers as "according to..." or "the source says...". Just explain. Use the content below as your sole knowledge base: do not introduce facts, data, or concepts from outside it. You can reason, draw conclusions, and make connections that go beyond what is literally written, as long as you stay within the topic. Only decline to answer if the question has nothing to do with the subject. Write in plain prose. Do not use markdown: no bold, no bullet points, no headers, no symbols.\n\n---\n${material}`,
      messages,
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('/api/chat error:', err)
    res.status(500).json({ error: err.message || 'Failed to get a response.' })
  }
}
