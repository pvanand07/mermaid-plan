import { Code2 } from 'lucide-react'

export function ImportCodeButton() {
  return (
    <button type="button" className="btn btn-secondary">
      <Code2 size={16} />
      Import Mermaid code
    </button>
  )
}
