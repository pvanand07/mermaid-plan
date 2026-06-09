import { useEffect, useState } from 'react'

export function useDebouncedPreview(code: string, autoRender: boolean, delay = 300) {
  const [previewCode, setPreviewCode] = useState(code)

  useEffect(() => {
    if (!autoRender) return
    const timer = setTimeout(() => setPreviewCode(code), delay)
    return () => clearTimeout(timer)
  }, [code, autoRender, delay])

  const renderNow = () => setPreviewCode(code)

  return { previewCode, setPreviewCode, renderNow }
}
