import { useDebouncedValue } from './useDebouncedValue'

export function useDebouncedPreview(code: string, delay = 300) {
  return useDebouncedValue(code, delay)
}
