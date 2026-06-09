import type { ReactNode } from 'react'
import { AppSidebar } from './AppSidebar'
import { MobileMenuButton } from './MobileMenuButton'
import { useSidebar } from '../context/SidebarContext'

interface AppLayoutProps {
  children: ReactNode
  /** When true, skip the mobile bar — caller renders MobileMenuButton in its own header */
  embedMobileMenu?: boolean
}

export function AppLayout({ children, embedMobileMenu = false }: AppLayoutProps) {
  const { mobileOpen, closeMobile } = useSidebar()

  return (
    <div className="app-layout">
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeMobile}
          aria-label="Close menu"
        />
      )}
      <AppSidebar />
      <div className="main-content">
        {!embedMobileMenu && (
          <div className="mobile-topbar">
            <MobileMenuButton />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
