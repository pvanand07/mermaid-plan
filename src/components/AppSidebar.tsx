import { Link, useLocation } from 'react-router-dom'
import { useStartNewDiagram } from '../hooks/useStartNewDiagram'
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  LayoutTemplate,
  Plus,
  Settings,
  Star,
} from 'lucide-react'
import { useSidebar } from '../hooks/useSidebar'
import { cn } from '../lib/cn'
import { Logo } from './Logo'
import { AuthNav } from './AuthNav'

const navItems = [
  { label: 'My Diagrams', icon: LayoutGrid, path: '/' },
  { label: 'Templates', icon: LayoutTemplate, path: '/templates' },
]

export function AppSidebar() {
  const location = useLocation()
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile, isMobile } = useSidebar()
  const { startNewDiagram, creating } = useStartNewDiagram()
  const showCollapsed = collapsed && !isMobile

  return (
    <aside
      className={cn('sidebar', showCollapsed && 'collapsed', mobileOpen && 'mobile-open')}
    >
      <div className="sidebar-header">
        <div className="logo">
          <Logo />
          <div className="logo-text">
            <h2>Mermaid Studio</h2>
            <span>Diagram workspace</span>
          </div>
        </div>
        <button
          type="button"
          className="icon-btn sidebar-toggle"
          onClick={toggleCollapsed}
          aria-label={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!showCollapsed}
        >
          {showCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-cta">
        <button
          type="button"
          className="new-diagram-btn"
          title={showCollapsed ? 'New Diagram' : undefined}
          disabled={creating}
          onClick={() => {
            closeMobile()
            void startNewDiagram()
          }}
        >
          <Plus size={16} />
          <span className="sidebar-label">New Diagram</span>
        </button>
      </div>

      <nav className="sidebar-content sidebar-nav">
        {navItems.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/' || location.pathname === '/diagrams'
              : location.pathname.startsWith(item.path)
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path === '/' ? '/' : item.path}
              className={cn('sidebar-nav-item', active && 'active')}
              title={showCollapsed ? item.label : undefined}
              onClick={closeMobile}
            >
              <Icon size={16} className="nav-icon" />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-note">
        <div className="sidebar-note-title">
          <Star size={16} className="icon-subtle" />
          <span className="sidebar-label">Favorites</span>
        </div>
        <p className="sidebar-label">Star your favorite templates for quick access.</p>
      </div>

      <div className="sidebar-footer">
        <AuthNav collapsed={showCollapsed} />

        <div className="sidebar-footer-links">
          <button
            type="button"
            className="sidebar-footer-link"
            title={showCollapsed ? 'Settings' : undefined}
          >
            <Settings size={16} />
            <span className="sidebar-label">Settings</span>
          </button>
          <button
            type="button"
            className="sidebar-footer-link"
            title={showCollapsed ? 'Help & Feedback' : undefined}
          >
            <HelpCircle size={16} />
            <span className="sidebar-label">Help & Feedback</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
