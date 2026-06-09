import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SidebarProvider } from './context/SidebarContext'
import { MyDiagramsPage } from './pages/MyDiagramsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { EditorPage } from './pages/EditorPage'

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          <Route path="/" element={<MyDiagramsPage />} />
          <Route path="/diagrams" element={<Navigate to="/" replace />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/examples" element={<Navigate to="/templates" replace />} />
          <Route path="/import" element={<Navigate to="/" replace />} />
          <Route path="/trash" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
