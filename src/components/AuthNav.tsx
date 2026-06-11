import { ChevronRight, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/cn'

interface AuthNavProps {
  collapsed?: boolean
}

export function AuthNav({ collapsed = false }: AuthNavProps) {
  const { loading, authEnabled, authenticated, user } = useAuth()

  if (!loading && authenticated && authEnabled) {
    const displayName =
      [user?.givenName, user?.familyName].filter(Boolean).join(' ') || user?.email || 'Account'

    return (
      <div className={cn('pro-tip-card', collapsed && 'auth-card--collapsed')}>
        <div className="pro-tip-header">
          {user?.picture ? (
            <img className="auth-avatar" src={user.picture} alt="" />
          ) : (
            <User size={16} className="icon-primary" />
          )}
          <span className="sidebar-label auth-user-name">{displayName}</span>
        </div>
        {user?.email && !collapsed && <p className="sidebar-label">{user.email}</p>}
        <a
          className="pro-tip-action"
          href="/api/auth/logout"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={14} />
          <span className="sidebar-label">Sign out</span>
        </a>
      </div>
    )
  }

  const loginHref = authEnabled ? '/api/auth/login' : '/login'

  return (
    <div className={cn('pro-tip-card', collapsed && 'auth-card--collapsed')}>
      <div className="pro-tip-header">
        <LogIn size={16} className="icon-primary" />
        <span className="sidebar-label">Sign in</span>
      </div>
      <p className="sidebar-label">Sign in to save your diagrams and use AI features.</p>
      <a
        className="pro-tip-action"
        href={loginHref}
        title={collapsed ? 'Sign in' : undefined}
        aria-busy={loading}
      >
        <span className="sidebar-label">{loading ? 'Loading…' : 'Sign in'}</span>
        {!loading && <ChevronRight size={14} />}
      </a>
    </div>
  )
}
