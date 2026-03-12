export async function extractFromFile(file, onStatus) {
  // Dynamic imports: these libraries are only downloaded when this function
  // is actually called, not on every page load.
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  // Try native text extraction first (works for digital PDFs)
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1).then((page) => page.getTextContent())
    )
  )
  const text = pages
    .flatMap((page) => page.items.map((item) => item.str))
    .join(' ')
    .trim()

  // If we got meaningful text, return it
  if (text.length > 100) return text

  // Otherwise fall back to OCR (scanned PDFs or image-only pages)
  onStatus?.('ocr')

  const canvases = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      const page = await pdf.getPage(i + 1)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      return canvas
    })
  )

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['eng', 'spa'])
  const results = []
  for (const canvas of canvases) {
    results.push(await worker.recognize(canvas))
  }
  await worker.terminate()

  return results
    .map((r) => r.data.text)
    .join('\n')
    .trim()
}
