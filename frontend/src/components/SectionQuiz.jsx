import { useState } from 'react'

const LABELS = ['A', 'B', 'C', 'D']

// key=currentQuestion is set by the parent, forcing a remount per question
// so local state (selected, answered) resets automatically.
export default function SectionQuiz({ question, questionNumber, total, showExplanation, onAnswer, onContinue }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  if (showExplanation) {
    return (
      <div className="quiz-wrapper">
        <div className="explanation-box">
          <p className="explanation-label">Correct answer</p>
          <p className="explanation-answer">{question.options[question.correct]}</p>
          <p className="explanation-body">{question.explanation}</p>
          <button className="continue-btn" onClick={onContinue}>Continue</button>
        </div>
      </div>
    )
  }

  function handleSelect(optionIndex) {
    if (answered) return
    setSelected(optionIndex)
    setAnswered(true)
    // Brief visual feedback before the parent transitions state
    setTimeout(() => onAnswer(optionIndex), 380)
  }

  function getOptionClass(i) {
    if (!answered || selected !== i) return ''
    if (i === question.correct) return 'correct'
    return 'wrong'
  }

  return (
    <div className="quiz-wrapper">
      <p className="quiz-progress">Question {questionNumber} of {total}</p>
      <p className="quiz-question">{question.question}</p>
      <div className="quiz-options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            className={`option-btn ${getOptionClass(i)}`}
            onClick={() => handleSelect(i)}
            disabled={answered}
          >
            <span className="option-label">{LABELS[i]}</span>
            <span className="option-text">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
