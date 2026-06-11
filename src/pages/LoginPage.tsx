import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <Logo />
          <h1>Sign in to Mermaid Studio</h1>
          <p>Create and edit diagrams with AI assistance.</p>
        </div>

        <div className="auth-actions">
          <a className="btn btn-primary auth-btn" href="/api/auth/login">
            Sign in
          </a>
          <a className="btn btn-secondary auth-btn" href="/api/auth/register">
            Create account
          </a>
        </div>

        <p className="auth-footer">
          Authentication is powered by{' '}
          <a href="https://kinde.com" target="_blank" rel="noreferrer">
            Kinde
          </a>
          .
        </p>
      </div>

      <p className="auth-back">
        <Link to="/">Back to app</Link>
      </p>
    </div>
  )
}
