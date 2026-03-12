export default function TextInput({ onInput }) {
  return (
    <textarea
      className="text-input"
      placeholder="Paste your text here..."
      onChange={(e) => onInput(e.target.value || null)}
      rows={6}
    />
  )
}
