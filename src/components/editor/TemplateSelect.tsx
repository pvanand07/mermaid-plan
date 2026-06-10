import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LayoutTemplate } from 'lucide-react'
import type { Template } from '../../data/types'
import { templates } from '../../data'
import { cn } from '../../lib/cn'
import './TemplateSelect.css'

interface TemplateSelectProps {
  onSelect: (template: Template) => void
}

export function TemplateSelect({ onSelect }: TemplateSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (template: Template) => {
    onSelect(template)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('template-select', open && 'template-select--open')}>
      <button
        type="button"
        className="template-select-trigger toolbar-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <LayoutTemplate size={14} className="icon-muted" />
        Template
        <ChevronDown size={14} className="icon-muted template-select-chevron" />
      </button>
      {open && (
        <div className="template-select-menu" role="menu">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-select-option"
              role="menuitem"
              onClick={() => handleSelect(template)}
            >
              <span className="template-select-option-name">{template.name}</span>
              <span className="template-select-option-desc">{template.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
