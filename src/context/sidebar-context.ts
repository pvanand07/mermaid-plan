import { createContext } from 'react'

export type SidebarContextValue = {
  collapsed: boolean
  toggleCollapsed: () => void
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
  isMobile: boolean
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)
