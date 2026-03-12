import { useState, useEffect, useRef } from 'react'
import { processText, gradeAnswer, fetchUrl, chatWithAI } from './api'
import { extractFromFile } from './utils/extractText'
import InputTabs from './components/InputTabs'
import StudyView from './components/StudyView'
import Chat from './components/Chat'

const STORAGE_KEY = 'readAndRecallState'

// Adds runtime quiz state to each section returned by the API
function initSections(sections) {
  return sections.map((section, i) => ({
    ...section,
    quizState: i === 0 ? 'reading' : 'locked', // only the first section is unlocked
    currentQuestion: 0,
    attempts: 0,        // attempts on the current question (resets per question)
    showExplanation: false,
  }))
}

// Read from localStorage once at startup to seed initial state
function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export default function App() {
  const [input, setInput] = useState(null)                 // { type: 'File'|'Text'|'URL', value }
  const [loadingStatus, setLoadingStatus] = useState(null) // null | 'extracting' | 'ocr' | 'processing'
  // Lazy initializers: the function is called only once on mount, not on every render
  const [status, setStatus] = useState(() => loadSaved()?.status ?? 'idle')
  const [sections, setSections] = useState(() => loadSaved()?.sections ?? [])
  const [finalQuiz, setFinalQuiz] = useState(() => loadSaved()?.finalQuiz ?? null)
  const [rawText, setRawText] = useState(() => loadSaved()?.rawText ?? '')
  const [chatHistory, setChatHistory] = useState(() => loadSaved()?.chatHistory ?? [])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const studyRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Persist session to localStorage whenever key state changes
  useEffect(() => {
    if (status !== 'idle') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, sections, finalQuiz, rawText, chatHistory }))
    }
  }, [status, sections, finalQuiz, rawText, chatHistory])

  async function handleStart() {
    if (!input) return
    setError(null)
    setSections([])
    setFinalQuiz(null)
    setRawText('')
    setChatHistory([])
    localStorage.removeItem(STORAGE_KEY)

    try {
      let text = ''
      if (input.type === 'File') {
        setLoadingStatus('extracting')
        text = await extractFromFile(input.value, (s) => setLoadingStatus(s))
      } else if (input.type === 'URL') {
        setLoadingStatus('extracting')
        text = await fetchUrl(input.value)
      } else {
        text = input.value
      }

      setRawText(text)
      setLoadingStatus('processing')
      const data = await processText(text)

      setSections(initSections(data.sections))
      setFinalQuiz({
        questions: data.finalQuiz,
        currentIndex: 0,
        answers: [],
        grades: [],
        grading: false,
      })
      setStatus('reading')
      setLoadingStatus(null)

      setTimeout(() => studyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoadingStatus(null)
    }
  }

  // Called when the user clicks "Start Quiz" on a section
  function handleStartQuiz(sectionIndex) {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, quizState: 'quizzing' } : s))
    )
  }

  // Called when the user clicks "Try Again" after a 1st wrong attempt
  function handleTryAgain(sectionIndex) {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, quizState: 'quizzing' } : s))
    )
  }

  // Called when the user selects a multiple choice option
  function handleAnswer(sectionIndex, selectedOption) {
    const newSections = sections.map((s, i) => {
      if (i !== sectionIndex) return s
      const section = { ...s }
      const question = section.questions[section.currentQuestion]
      const isCorrect = selectedOption === question.correct
      const isLastQuestion = section.currentQuestion === section.questions.length - 1

      if (isCorrect) {
        if (isLastQuestion) {
          section.quizState = 'passed'
        } else {
          section.currentQuestion++
          section.attempts = 0
        }
      } else if (section.attempts === 0) {
        // 1st wrong — reveal text so the user can re-read
        section.quizState = 'retry'
        section.attempts = 1
      } else {
        // 2nd wrong — show the correct answer and explanation
        section.showExplanation = true
      }
      return section
    })

    // Unlock the next section if the current one just passed
    const justPassed = newSections[sectionIndex].quizState === 'passed'
    if (justPassed && sectionIndex + 1 < newSections.length) {
      newSections[sectionIndex + 1] = { ...newSections[sectionIndex + 1], quizState: 'reading' }
    }

    setSections(newSections)

    // If every section is now passed, move to the final quiz
    if (newSections.every((s) => s.quizState === 'passed')) {
      setStatus('finalQuiz')
    }
  }

  // Called after the user reads the explanation on a 2nd wrong attempt
  function handleContinue(sectionIndex) {
    const newSections = sections.map((s, i) => {
      if (i !== sectionIndex) return s
      const section = { ...s }
      const isLastQuestion = section.currentQuestion === section.questions.length - 1
      section.showExplanation = false
      if (isLastQuestion) {
        section.quizState = 'passed'
      } else {
        section.currentQuestion++
        section.attempts = 0
      }
      return section
    })

    // Unlock the next section if the current one just passed
    const justPassed = newSections[sectionIndex].quizState === 'passed'
    if (justPassed && sectionIndex + 1 < newSections.length) {
      newSections[sectionIndex + 1] = { ...newSections[sectionIndex + 1], quizState: 'reading' }
    }

    setSections(newSections)

    if (newSections.every((s) => s.quizState === 'passed')) {
      setStatus('finalQuiz')
    }
  }

  function handleEndSession() {
    setSections([])
    setFinalQuiz(null)
    setStatus('idle')
    setInput(null)
    setError(null)
    setRawText('')
    setChatHistory([])
    setChatOpen(false)
    localStorage.removeItem(STORAGE_KEY)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resets all quiz state so the user can go through the same material again
  function handleRetry() {
    setSections((prev) =>
      prev.map((s, i) => ({
        ...s,
        quizState: i === 0 ? 'reading' : 'locked',
        currentQuestion: 0,
        attempts: 0,
        showExplanation: false,
      }))
    )
    setFinalQuiz((prev) => ({
      questions: prev.questions,
      currentIndex: 0,
      answers: [],
      grades: [],
      grading: false,
    }))
    setStatus('reading')
    setTimeout(() => studyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Called when the user submits an answer in the final quiz
  async function handleFinalAnswer(answer) {
    const question = finalQuiz.questions[finalQuiz.currentIndex]
    const currentIndex = finalQuiz.currentIndex
    setFinalQuiz((prev) => ({ ...prev, grading: true }))

    try {
      const { correct, feedback } = await gradeAnswer(question, answer)
      const isLast = currentIndex + 1 >= finalQuiz.questions.length

      setFinalQuiz((prev) => ({
        ...prev,
        answers: [...prev.answers, answer],
        grades: [...prev.grades, { correct, feedback }],
        currentIndex: prev.currentIndex + 1,
        grading: false,
      }))

      if (isLast) {
        setStatus('done')
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'You finished the final quiz! Feel free to use this chat to clear up any doubts about the material.',
          },
        ])
      }
    } catch (err) {
      setFinalQuiz((prev) => ({ ...prev, grading: false }))
      setError(err.message || 'Failed to grade answer.')
    }
  }

  async function handleSendChat(message) {
    const updated = [...chatHistory, { role: 'user', content: message }]
    setChatHistory(updated)
    setChatLoading(true)
    try {
      const reply = await chatWithAI(rawText, chatHistory, message)
      setChatHistory([...updated, { role: 'assistant', content: reply }])
    } catch (err) {
      setChatHistory([...updated, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const anyQuizActive = sections.some(
    (s) => s.quizState === 'quizzing' || s.quizState === 'retry'
  )
  const chatDisabled = anyQuizActive || status === 'finalQuiz'

  const loadingMessage = {
    extracting: 'Extracting text...',
    ocr: 'Running OCR — this may take a moment...',
    processing: 'Processing with AI...',
  }

  return (
    <div className="app-wrapper">
      <button className="theme-toggle" onClick={() => setDark((d) => !d)} title="Toggle dark mode">
        {dark ? '☀' : '☾'}
      </button>
      <button
        className={`chat-toggle ${chatOpen ? 'open' : ''}`}
        onClick={() => setChatOpen((o) => !o)}
        title="Toggle chat"
      >
        {chatOpen ? '✕' : '✦'}
      </button>

      <Chat
        open={chatOpen}
        history={chatHistory}
        onSend={handleSendChat}
        loading={chatLoading}
        disabled={chatDisabled}
        hasMaterial={status !== 'idle'}
      />

      <section className="home">
        <h1 className="app-title">
          <span className="accent">Read</span>&amp;Recall
        </h1>
        <p className="tagline">Study smarter. Remember more.</p>

        <InputTabs onInput={setInput} />

        <div className="how-it-works">
          <p className="how-it-works-label">How it works</p>
          <ol>
            <li>Upload your study material — PDF, text, or URL.</li>
            <li>Read each section. A short quiz appears at the end of every one.</li>
            <li>While answering, you won't be able to see the text. Read carefully.</li>
            <li>Wrong answer? Re-read the section and try once more.</li>
            <li>After all sections, a 10-question final recall test — no material visible.</li>
          </ol>
        </div>

        <button className="start-btn" onClick={handleStart} disabled={!input || loadingStatus !== null}>
          {loadingStatus ? loadingMessage[loadingStatus] : 'Start →'}
        </button>

        {error && <p className="error-msg">{error}</p>}
      </section>

      <div className="study-gap" />

      {sections.length > 0 && (
        <div ref={studyRef}>
          <StudyView
            sections={sections}
            status={status}
            finalQuiz={finalQuiz}
            onStartQuiz={handleStartQuiz}
            onAnswer={handleAnswer}
            onTryAgain={handleTryAgain}
            onContinue={handleContinue}
            onFinalAnswer={handleFinalAnswer}
            onRetry={handleRetry}
            onEndSession={handleEndSession}
          />
        </div>
      )}
    </div>
  )
}
