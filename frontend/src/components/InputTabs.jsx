import { useState } from 'react'
import FileUploader from './FileUploader'
import TextInput from './TextInput'
import UrlInput from './UrlInput'

const TABS = [
  { label: 'File', type: 'File' },
  { label: 'Pasted Text', type: 'Text' },
  { label: 'URL', type: 'URL' },
]

export default function InputTabs({ onInput }) {
  const [activeTab, setActiveTab] = useState(0)

  function handleTabChange(index) {
    setActiveTab(index)
    onInput(null)
  }

  return (
    <div className="input-tabs">
      <div className="tabs-header">
        {TABS.map((tab, i) => (
          <button
            key={tab.type}
            className={`tab-btn${activeTab === i ? ' active' : ''}`}
            onClick={() => handleTabChange(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 0 && (
          <FileUploader
            onFileSelect={(file) => onInput(file ? { type: 'File', value: file } : null)}
          />
        )}
        {activeTab === 1 && (
          <TextInput
            onInput={(text) => onInput(text ? { type: 'Text', value: text } : null)}
          />
        )}
        {activeTab === 2 && (
          <UrlInput
            onInput={(url) => onInput(url ? { type: 'URL', value: url } : null)}
          />
        )}
      </div>
    </div>
  )
}
