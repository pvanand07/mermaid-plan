import { createBrowserRouter, Navigate, redirect } from 'react-router-dom'
import { emptyEditorCode } from './data'
import { SidebarProvider } from './context/SidebarContext'
import { ensureDbReady } from './lib/db/ensureDbReady'
import { createDiagram, getDiagram } from './lib/db/diagramRepository'
import { normalizeFolderPath } from './lib/folders/pathUtils'
import { EditorPage } from './pages/EditorPage'
import { DbErrorPage } from './pages/errors/DbErrorPage'
import { EditorErrorPage } from './pages/errors/EditorErrorPage'
import { MyDiagramsPage } from './pages/MyDiagramsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { AppShell } from './App'

async function rootLoader() {
  await ensureDbReady()
  return null
}

async function newDiagramLoader({ request }: { request: Request }) {
  await ensureDbReady()
  const url = new URL(request.url)
  const folderPath = normalizeFolderPath(url.searchParams.get('folderPath') ?? '')
  const record = await createDiagram({
    title: 'Untitled',
    mermaidCode: emptyEditorCode,
    folderPath,
  })
  return redirect(`/editor/${record.id}`)
}

async function diagramLoader({ params }: { params: { id?: string } }) {
  await ensureDbReady()
  const id = params.id
  if (!id) {
    throw new Response('Diagram not found.', { status: 404, statusText: 'Diagram not found.' })
  }
  const record = await getDiagram(id)
  if (!record) {
    throw new Response('Diagram not found.', { status: 404, statusText: 'Diagram not found.' })
  }
  return record
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SidebarProvider>
        <AppShell />
      </SidebarProvider>
    ),
    loader: rootLoader,
    errorElement: <DbErrorPage />,
    children: [
      { index: true, element: <MyDiagramsPage /> },
      { path: 'diagrams', element: <Navigate to="/" replace /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'editor', loader: newDiagramLoader },
      {
        path: 'editor/:id',
        loader: diagramLoader,
        errorElement: <EditorErrorPage />,
        element: <EditorPage />,
      },
    ],
  },
])
