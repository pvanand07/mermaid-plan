import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AppLayout } from '../../components/AppLayout'

export function EditorErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'Diagram not found.'
      : error.statusText || 'Failed to load diagram.'
    : 'Failed to load diagram.'

  return (
    <AppLayout embedMobileMenu>
      <div className="editor-loading">{message}</div>
    </AppLayout>
  )
}
