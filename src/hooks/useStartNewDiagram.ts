import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  startNewDiagram,
  type StartNewDiagramInput,
} from '../lib/diagram/startNewDiagram'

export function useStartNewDiagram() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const createAndOpen = useCallback(
    async (input?: StartNewDiagramInput) => {
      if (creating) return
      setCreating(true)
      try {
        return await startNewDiagram(navigate, input)
      } finally {
        setCreating(false)
      }
    },
    [creating, navigate],
  )

  return { startNewDiagram: createAndOpen, creating }
}
