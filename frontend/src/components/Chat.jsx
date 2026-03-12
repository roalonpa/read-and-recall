import { useState, useRef, useEffect } from 'react'

export default function Chat({ open, history, onSend, loading, disabled, hasMaterial }) {
  const [message, setMessage] = useState('')
  const bottomRef = useRef(null)

  // Scroll to the latest message whenever history changes or the panel opens
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, open])

  function handleSubmit() {
    if (!message.trim() || loading || disabled) return
    onSend(message.trim())
    setMessage('')
  }

  return (
    <div className={`chat-panel ${open ? 'open' : ''}`}>
      <div className="chat-header">
        <p className="chat-title">Study Assistant</p>
      </div>

      <div className="chat-messages">
        {disabled ? (
          <p className="chat-placeholder">Chat is disabled during quizzes.</p>
        ) : !hasMaterial ? (
          <p className="chat-placeholder">
            Upload study material and press Start to use the chat.
          </p>
        ) : history.length === 0 ? (
          <p className="chat-placeholder">
            Ask anything about the material you're studying.
          </p>
        ) : (
          history.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {hasMaterial && !disabled && (
        <div className="chat-footer">
          <textarea
            className="chat-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask a question... (Enter to send)"
            rows={3}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!message.trim() || loading}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  )
}
