import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AppLayout } from '../../components/AppLayout'

export function DbErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'Storage unavailable'
    : error instanceof Error
      ? error.message
      : 'Storage unavailable'

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container editor-loading">
          Storage unavailable — changes may not persist. {message}
        </div>
      </main>
    </AppLayout>
  )
}
