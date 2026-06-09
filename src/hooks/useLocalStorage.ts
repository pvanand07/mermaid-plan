import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : stored === 'true'
  } catch {
    return fallback
  }
}

export function useLocalStorage(
  key: string,
  initial: boolean,
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState(() => readStoredBoolean(key, initial))

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value))
    } catch {
      // ignore storage errors
    }
  }, [key, value])

  return [value, setValue]
}
