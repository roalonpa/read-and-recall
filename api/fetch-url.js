module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'No URL provided.' })

    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
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
    res.status(500).json({ error: err.message || 'Failed to fetch URL.' })
  }
}
