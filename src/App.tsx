import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DiagramStoreProvider } from './context/DiagramStoreContext'
import { SidebarProvider } from './context/SidebarContext'
import { MyDiagramsPage } from './pages/MyDiagramsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { EditorPage } from './pages/EditorPage'

const redirects: Record<string, string> = {
  '/diagrams': '/',
  '/examples': '/templates',
  '/import': '/',
  '/trash': '/',
}

function App() {
  return (
    <BrowserRouter>
      <DiagramStoreProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<MyDiagramsPage />} />
            {Object.entries(redirects).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
          </Routes>
        </SidebarProvider>
      </DiagramStoreProvider>
    </BrowserRouter>
  )
}

export default App
