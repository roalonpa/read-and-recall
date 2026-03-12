import SectionQuiz from './SectionQuiz'

function renderContent(content) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h3 key={i}>{line.slice(3)}</h3>
    if (line.trim() === '') return null
    return <p key={i}>{line}</p>
  })
}

export default function Section({ section, index, total, onStartQuiz, onAnswer, onTryAgain, onContinue }) {
  const { title, content, questions, quizState, currentQuestion, showExplanation } = section

  if (quizState === 'locked') return null

  const showText = quizState === 'reading' || quizState === 'retry' || quizState === 'passed'
  const showQuiz = quizState === 'quizzing'

  return (
    <div className="section-card">
      <span className="section-counter">Section {index + 1} of {total}</span>

      {title && <h2 className="section-title">{title}</h2>}

      {showText && <div className="section-content">{renderContent(content)}</div>}

      {quizState === 'reading' && (
        <div className="quiz-trigger">
          <button className="start-quiz-btn" onClick={onStartQuiz}>Start Quiz</button>
        </div>
      )}

      {quizState === 'retry' && (
        <div className="retry-banner">
          <span className="retry-text">Read it again, then try once more.</span>
          <button className="try-again-btn" onClick={onTryAgain}>Try Again</button>
        </div>
      )}

      {showQuiz && (
        <SectionQuiz
          key={currentQuestion}
          question={questions[currentQuestion]}
          questionNumber={currentQuestion + 1}
          total={questions.length}
          showExplanation={showExplanation}
          onAnswer={onAnswer}
          onContinue={onContinue}
        />
      )}

      {quizState === 'passed' && (
        <span className="section-complete">✓ Section complete</span>
      )}
    </div>
  )
}
