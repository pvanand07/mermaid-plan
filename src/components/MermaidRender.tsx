import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cleanupMermaidRenderElement } from '../lib/mermaid/cleanup'
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
  onError,
}: {
  code: string
  className?: string
  scale?: number
  onRendered?: () => void
  onError?: (message: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const baseId = useId().replace(/:/g, '')
  const renderSeq = useRef(0)
  const onRenderedRef = useRef(onRendered)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onRenderedRef.current = onRendered
  }, [onRendered])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current) return

      setError(null)
      onErrorRef.current?.(null)
      containerRef.current.innerHTML = ''

      if (!code.trim()) {
        return
      }

      renderSeq.current += 1
      const id = `mermaid-${baseId}-${renderSeq.current}`

      try {
        const { svg, bindFunctions } = await mermaid.render(id, code)
        cleanupMermaidRenderElement(id)

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          bindFunctions?.(containerRef.current)

          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement instanceof SVGSVGElement) {
            svgElement.setAttribute('role', 'img')
            svgElement.style.maxWidth = 'none'
          }

          onRenderedRef.current?.()
        }
      } catch (e) {
        cleanupMermaidRenderElement(id)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = ''
          const message = e instanceof Error ? e.message : 'Render failed'
          setError(message)
          onErrorRef.current?.(message)
        }
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [code, baseId])

  return (
    <div className={cn('mermaid-render-host', className)}>
      <div
        ref={containerRef}
        className={cn('mermaid-render', error && 'mermaid-render--hidden')}
        style={
          scale === 1
            ? undefined
            : { transform: `scale(${scale})`, transformOrigin: 'center center' }
        }
        aria-hidden={error ? true : undefined}
      />
      {error && (
        <div className="mermaid-render-error" role="alert">
          <p className="mermaid-render-error-title">Could not render diagram</p>
          <p className="mermaid-render-error-detail">
            {import.meta.env.DEV ? error : 'Check the diagram syntax and try again.'}
          </p>
        </div>
      )}
    </div>
  )
}
