import { useState } from 'react'

export default function UrlInput({ onInput }) {
  const [error, setError] = useState(null)

  function isValidUrl(value) {
    try { new URL(value); return true } catch { return false }
  }

  function handleChange(e) {
    const value = e.target.value
    if (value === '') { setError(null); onInput(null) }
    else if (isValidUrl(value)) { setError(null); onInput(value) }
    else { setError('Please enter a valid URL.'); onInput(null) }
  }

  return (
    <div>
      <input
        type="text"
        className="url-input"
        placeholder="Paste a URL here..."
        onChange={handleChange}
      />
      {error && <p className="url-error">{error}</p>}
    </div>
  )
}
