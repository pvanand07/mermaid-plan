import { useEffect, useRef } from 'react'

export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: unknown[],
  delayMs: number,
): void {
  const effectRef = useRef(effect)

  useEffect(() => {
    effectRef.current = effect
  })

  useEffect(() => {
    let cleanup: void | (() => void)

    const timer = setTimeout(() => {
      cleanup = effectRef.current()
    }, delayMs)

    return () => {
      clearTimeout(timer)
      if (typeof cleanup === 'function') cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
