import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
})

let renderId = 0

export function MermaidRender({
  code,
  className = '',
  scale = 1,
}: {
  code: string
  className?: string
  scale?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current || !code.trim()) return

      try {
        renderId += 1
        const id = `mermaid-${renderId}`
        const { svg } = await mermaid.render(id, code)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setError(null)
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
  }, [code])

  if (error) {
    return (
      <div className={`mermaid-render-error ${className}`}>
        Preview unavailable
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-render ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    />
  )
}
