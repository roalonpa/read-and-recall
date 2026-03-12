import { useState } from 'react'

export default function FinalQuiz({ questions, currentIndex, grades, grading, status, onSubmitAnswer, onRetry }) {
  const [answer, setAnswer] = useState('')
  const [acknowledged, setAcknowledged] = useState(0)

  // Summary screen
  if (status === 'done' && acknowledged >= questions.length) {
    const correct = grades.filter((g) => g.correct).length
    return (
      <div className="results-card">
        <p className="results-title">Final Quiz Complete</p>
        <div className="score-display">
          <span className="score-num">{correct}</span>
          <span className="score-denom"> / {questions.length}</span>
        </div>
        <hr className="results-divider" />
        {questions.map((q, i) => (
          <div key={i} className="result-item">
            <p className="result-q">Q{i + 1}: {q}</p>
            <div className="result-feedback">
              <span className={`result-icon ${grades[i].correct ? 'correct' : 'wrong'}`}>
                {grades[i].correct ? '✓' : '✗'}
              </span>
              <span className="result-text">{grades[i].feedback}</span>
            </div>
          </div>
        ))}
        <div className="result-actions">
          <button className="start-quiz-btn" onClick={onRetry}>Retry Quiz</button>
        </div>
      </div>
    )
  }

  // Feedback screen after grading
  if (grades.length > acknowledged) {
    const lastGrade = grades[grades.length - 1]
    const isLast = grades.length >= questions.length
    return (
      <div className="final-quiz-card">
        <div className={`feedback-card ${lastGrade.correct ? 'correct' : 'incorrect'}`}>
          <p className="feedback-icon">{lastGrade.correct ? '✓ Correct' : '✗ Incorrect'}</p>
          <p className="feedback-question">{questions[grades.length - 1]}</p>
          <p className="feedback-text">{lastGrade.feedback}</p>
        </div>
        <button className="next-btn" onClick={() => { setAcknowledged(grades.length); setAnswer('') }}>
          {isLast ? 'See Results →' : 'Next Question →'}
        </button>
      </div>
    )
  }

  function handleSubmit() {
    if (!answer.trim() || grading) return
    onSubmitAnswer(answer.trim())
  }

  return (
    <div className="final-quiz-card">
      <p className="final-quiz-title">Final Quiz</p>
      <p className="final-quiz-subtitle">No material visible — pure recall.</p>

      <p className="final-progress">Question {currentIndex + 1} of {questions.length}</p>
      <p className="final-question">{questions[currentIndex]}</p>

      <textarea
        className="final-answer-textarea"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={grading}
        rows={4}
        placeholder="Type your answer..."
      />
      <button className="submit-btn" onClick={handleSubmit} disabled={!answer.trim() || grading}>
        {grading ? 'Grading...' : 'Submit Answer'}
      </button>
    </div>
  )
}
