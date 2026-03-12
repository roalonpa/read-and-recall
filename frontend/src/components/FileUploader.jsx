import { useState, useRef } from 'react'

export default function FileUploader({ onFileSelect }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      onFileSelect(file)
    } else {
      alert('Please upload a PDF file.')
    }
  }

  function handleDragOver(e) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }
  function handleInputChange(e) { handleFile(e.target.files[0]) }

  return (
    <div
      className={`drop-zone${dragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className="drop-zone-text">Drag and drop a PDF here, or</p>
      <label className="browse-label">
        browse files
        <input
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          ref={inputRef}
        />
      </label>
      {selectedFile && (
        <div className="file-selected">
          <span className="file-name">{selectedFile.name}</span>
          <button
            className="remove-btn"
            onClick={() => { setSelectedFile(null); onFileSelect(null); inputRef.current.value = '' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
