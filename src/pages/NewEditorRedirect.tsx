import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { startNewDiagram } from '../lib/diagram/startNewDiagram'
import { normalizeFolderPath } from '../lib/folders/pathUtils'

export function NewEditorRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const folderPath = normalizeFolderPath(searchParams.get('folderPath') ?? '')
    void startNewDiagram(navigate, { folderPath })
  }, [navigate, searchParams])

  return (
    <AppLayout embedMobileMenu>
      <div className="editor-loading">Creating diagram…</div>
    </AppLayout>
  )
}
