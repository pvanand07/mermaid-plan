import { Menu } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

export function MobileMenuButton() {
  const { openMobile } = useSidebar()

  return (
    <button
      type="button"
      className="mobile-menu-btn"
      onClick={openMobile}
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  )
}
