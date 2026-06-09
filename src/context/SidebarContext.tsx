import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { SidebarContext } from './sidebar-context'

const STORAGE_KEY = 'sidebar-collapsed'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useLocalStorage(STORAGE_KEY, false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Close the mobile drawer when navigating (e.g. browser back/forward).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI to route changes
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleCollapsed: () => setCollapsed((value) => !value),
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
