import Section from './Section'
import FinalQuiz from './FinalQuiz'

export default function StudyView({
  sections,
  status,
  finalQuiz,
  onStartQuiz,
  onAnswer,
  onTryAgain,
  onContinue,
  onFinalAnswer,
  onRetry,
  onEndSession,
}) {
  return (
    <div>
      {status !== 'finalQuiz' && sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          index={i}
          total={sections.length}
          onStartQuiz={() => onStartQuiz(i)}
          onAnswer={(optionIndex) => onAnswer(i, optionIndex)}
          onTryAgain={() => onTryAgain(i)}
          onContinue={() => onContinue(i)}
        />
      ))}

      {(status === 'finalQuiz' || status === 'done') && finalQuiz && (
        <FinalQuiz
          questions={finalQuiz.questions}
          currentIndex={finalQuiz.currentIndex}
          grades={finalQuiz.grades}
          grading={finalQuiz.grading}
          status={status}
          onSubmitAnswer={onFinalAnswer}
          onRetry={onRetry}
        />
      )}

      <div className="end-session-row">
        <button className="end-session-btn" onClick={onEndSession}>End Session</button>
      </div>
    </div>
  )
}
