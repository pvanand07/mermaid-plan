import type { ReactNode } from 'react'
import { EditorContext, type EditorContextValue } from './editor-context'

export function EditorProvider({
  value,
  children,
}: {
  value: EditorContextValue
  children: ReactNode
}) {
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
