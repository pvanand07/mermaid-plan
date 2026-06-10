import { useEffect, useState } from 'react'

export function useDebouncedPreview(code: string, delay = 300) {
  const [previewCode, setPreviewCode] = useState(code)

  useEffect(() => {
    const timer = setTimeout(() => setPreviewCode(code), delay)
    return () => clearTimeout(timer)
  }, [code, delay])

  return previewCode
}
