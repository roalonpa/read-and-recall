// Shared across serverless functions. Prefixed with _ so Vercel
// does not treat this file as a route.

export function parseClaudeJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(match ? match[1].trim() : text.trim())
}

export const PROCESS_PROMPT = `You are processing study material for a student. The input is raw text extracted from a PDF, image, or webpage. It may have formatting artifacts, scrambled multi-column text, or OCR errors.

Your tasks:
1. CLEAN: Rewrite the content as clear, continuous, readable prose. Fix any artifacts. Do not summarize or remove content — students need the full material.
2. STRUCTURE: Use markdown headings (## ) only where the material clearly shifts to a major new topic. Do not add headings just to break up text. Prefer flowing paragraphs.
3. SPLIT: Divide the material into logical sections. Aim for 4–12 sections based on length and topic structure. Each section should be coherent on its own.
4. QUIZ per section: For shorter sections write 3–5 multiple choice questions; for longer sections write 8–10. Questions must test only the content of that specific section. Each has 4 answer choices. Include a brief explanation of the correct answer.
5. FINAL QUIZ: Write exactly 10 open-answer questions covering the most important concepts from the entire document.

Return ONLY valid JSON — no markdown, no code block, no extra text:
{
  "sections": [
    {
      "title": "Section title, or null if no heading is appropriate",
      "content": "Full cleaned text of this section.",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Why this answer is correct."
        }
      ]
    }
  ],
  "finalQuiz": ["Question 1?", "Question 2?", "...10 total"]
}`
