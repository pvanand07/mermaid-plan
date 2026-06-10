import mermaid from 'mermaid'

let exportSeq = 0

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return cleaned || 'diagram'
}

export async function renderDiagramSvg(code: string): Promise<string> {
  if (!code.trim()) {
    throw new Error('Add diagram code before exporting.')
  }

  exportSeq += 1
  const id = `mermaid-export-${exportSeq}`
  const { svg } = await mermaid.render(id, code)
  return svg
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function getSvgDimensions(svgElement: SVGSVGElement): { width: number; height: number } {
  const viewBox = svgElement.viewBox?.baseVal
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height }
  }

  const width = Number.parseFloat(svgElement.getAttribute('width') ?? '')
  const height = Number.parseFloat(svgElement.getAttribute('height') ?? '')
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height }
  }

  return { width: 1200, height: 800 }
}

async function svgToPngBlob(svg: string, scale: number): Promise<Blob> {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const svgElement = doc.querySelector('svg')
  if (!(svgElement instanceof SVGSVGElement)) {
    throw new Error('Could not parse diagram SVG.')
  }

  const { width, height } = getSvgDimensions(svgElement)
  const serialized = new XMLSerializer().serializeToString(svgElement)
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(width * scale)
      canvas.height = Math.ceil(height * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Could not create image export.'))
        return
      }

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Could not create PNG export.'))
        }
      }, 'image/png')
    }
    image.onerror = () => reject(new Error('Could not render PNG export.'))
    image.src = dataUrl
  })
}

export async function downloadSvg(code: string, filename: string) {
  const svg = await renderDiagramSvg(code)
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`)
}

export async function downloadPng(code: string, filename: string) {
  const svg = await renderDiagramSvg(code)
  const blob = await svgToPngBlob(svg, 2)
  downloadBlob(blob, `${filename}.png`)
}

export async function downloadMermaid(code: string, filename: string) {
  if (!code.trim()) {
    throw new Error('Add diagram code before exporting.')
  }
  downloadBlob(new Blob([code], { type: 'text/plain;charset=utf-8' }), `${filename}.mmd`)
}

export async function copySvg(code: string) {
  const svg = await renderDiagramSvg(code)
  await navigator.clipboard.writeText(svg)
}

export async function copyMermaid(code: string) {
  if (!code.trim()) {
    throw new Error('Add diagram code before copying.')
  }
  await navigator.clipboard.writeText(code)
}
