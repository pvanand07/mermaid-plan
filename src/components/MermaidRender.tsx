import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '../lib/cn'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 16,
    useMaxWidth: false,
  },
  sequence: {
    useMaxWidth: false,
  },
  mindmap: {
    useMaxWidth: false,
  },
})

export function MermaidRender({
  code,
  className = '',
  scale = 1,
  onRendered,
}: {
  code: string
  className?: string
  scale?: number
  onRendered?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const baseId = useId().replace(/:/g, '')
  const renderSeq = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current) return

      if (!code.trim()) {
        containerRef.current.innerHTML = ''
        setError(null)
        return
      }

      try {
        renderSeq.current += 1
        const id = `mermaid-${baseId}-${renderSeq.current}`
        const { svg, bindFunctions } = await mermaid.render(id, code)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          bindFunctions?.(containerRef.current)
          setError(null)

          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement instanceof SVGSVGElement) {
            svgElement.setAttribute('role', 'img')
            svgElement.style.maxWidth = 'none'
          }

          onRendered?.()
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Render failed')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code, baseId, onRendered])

  if (error) {
    return (
      <div className={cn('mermaid-render-error', className)}>
        {import.meta.env.DEV ? error : 'Preview unavailable'}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('mermaid-render', className)}
      style={
        scale === 1
          ? undefined
          : { transform: `scale(${scale})`, transformOrigin: 'center center' }
      }
    />
  )
}
