function renderContentToHtml(content) {
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      if (line.startsWith('## ')) return `<h3>${line.slice(3)}</h3>`
      return `<p>${line}</p>`
    })
    .join('')
}

export function exportSummary(sections, finalQuiz) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const score = finalQuiz.grades.filter((g) => g.correct).length

  // Section quizzes: only question text + correct answer
  const sectionsHtml = sections
    .map((section, i) => {
      const questionsHtml = section.questions
        .map(
          (q, qi) => `
          <div class="question">
            <p class="question-text">Q${qi + 1}. ${q.question}</p>
            <p class="question-answer">&#8594; ${q.options[q.correct]}</p>
          </div>`
        )
        .join('')

      return `
        <div class="section">
          <p class="section-label">Section ${i + 1}</p>
          ${section.title ? `<h2 class="section-title">${section.title}</h2>` : ''}
          <div class="section-content">${renderContentToHtml(section.content)}</div>
          <p class="quiz-label">Quiz — Correct Answers</p>
          ${questionsHtml}
        </div>`
    })
    .join('')

  // Final quiz: question + user answer + feedback
  const finalHtml = finalQuiz.questions
    .map((q, i) => {
      const grade = finalQuiz.grades[i]
      const answer = finalQuiz.answers[i] || '—'
      return `
        <div class="final-q">
          <p class="final-q-text">Q${i + 1}. ${q}</p>
          <div class="final-answer">${answer}</div>
          ${grade
            ? `<p class="final-feedback ${grade.correct ? 'correct' : 'incorrect'}">
                ${grade.correct ? '&#10003; Correct' : '&#10007; Incorrect'} &mdash; ${grade.feedback}
               </p>`
            : ''}
        </div>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Read&amp;Recall &mdash; Study Summary</title>
  <style>
    /* @page controls margins on every printed page */
    @page {
      margin: 2cm 2.2cm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* In browser preview, add padding so it looks like the printed version */
    @media screen {
      body {
        padding: 2cm 2.2cm;
      }
    }

    /* In print, @page handles all margins — no body padding needed */
    @media print {
      body {
        padding: 0;
      }
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #111;
    }

    h1 {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4pt;
    }

    .accent { color: #f97316; }

    .date {
      color: #888;
      font-size: 10pt;
      margin-bottom: 32pt;
    }

    /* ---- Sections ---- */
    .section {
      margin-bottom: 36pt;
      page-break-inside: avoid;
    }

    .section-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #f97316;
      margin-bottom: 5pt;
    }

    .section-title {
      font-size: 15pt;
      font-weight: 700;
      margin-bottom: 10pt;
    }

    .section-content p {
      margin-bottom: 8pt;
      color: #222;
    }

    .section-content h3 {
      font-size: 12pt;
      font-weight: 600;
      margin: 14pt 0 6pt;
    }

    /* ---- Section quiz (Q + correct answer only) ---- */
    .quiz-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #aaa;
      border-top: 1pt solid #ddd;
      padding-top: 10pt;
      margin: 16pt 0 10pt;
    }

    .question {
      margin-bottom: 10pt;
    }

    .question-text {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 3pt;
    }

    .question-answer {
      color: #16a34a;
      font-weight: 500;
      font-size: 11pt;
      padding-left: 12pt;
    }

    /* ---- Final quiz section ---- */
    .final-section {
      border-top: 2pt solid #f97316;
      padding-top: 24pt;
      margin-top: 40pt;
    }

    .final-title {
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 4pt;
    }

    .score {
      font-size: 30pt;
      font-weight: 700;
      color: #f97316;
      margin: 8pt 0 24pt;
      line-height: 1;
    }

    .score span {
      font-size: 16pt;
      font-weight: 400;
      color: #aaa;
    }

    .final-q {
      margin-bottom: 20pt;
      page-break-inside: avoid;
    }

    .final-q-text {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 5pt;
    }

    .final-answer {
      background: #f5f5f5;
      border-left: 3pt solid #ddd;
      padding: 6pt 10pt;
      color: #333;
      margin-bottom: 4pt;
      font-size: 11pt;
    }

    .final-feedback {
      font-size: 10pt;
      padding-left: 2pt;
    }

    .final-feedback.correct   { color: #16a34a; }
    .final-feedback.incorrect { color: #dc2626; }
  </style>
</head>
<body>
  <h1><span class="accent">Read</span>&amp;Recall &mdash; Study Summary</h1>
  <p class="date">${date}</p>

  ${sectionsHtml}

  <div class="final-section">
    <p class="final-title">Final Quiz</p>
    <div class="score">${score}<span> / ${finalQuiz.questions.length}</span></div>
    ${finalHtml}
  </div>
</body>
</html>`

  // Blob URL ensures the browser loads the document properly and
  // parses all CSS including @page rules — document.write() does not.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.addEventListener('load', () => {
      win.print()
      // Revoke the URL after a generous delay so the user can save
      setTimeout(() => URL.revokeObjectURL(url), 120000)
    })
  }
}
