// In development, call the backend directly to avoid Vite proxy timeout issues.
// In production, use the same origin (empty string = relative URL).
const BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''

export async function processText(text) {
  const res = await fetch(`${BASE}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to process text.')
  }
  return res.json()
}

export async function gradeAnswer(question, answer) {
  const res = await fetch(`${BASE}/api/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to grade answer.')
  }
  return res.json()
}

export async function chatWithAI(material, history, message) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material, history, message }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to get a response.')
  }
  const data = await res.json()
  return data.reply
}

export async function fetchUrl(url) {
  const res = await fetch(`${BASE}/api/fetch-url?url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch URL.')
  }
  const data = await res.json()
  return data.text
}
