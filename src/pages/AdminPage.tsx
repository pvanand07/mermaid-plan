import { BarChart3, RefreshCw, Users } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { PageHeader } from '../components/PageHeader'
import { useAdminDashboard } from '../hooks/useAdmin'

function formatUsd(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function AdminPage() {
  const { loading, error, analytics, users, plans, refresh, updateUserPlan } = useAdminDashboard()

  const maxDailyRequests = Math.max(...(analytics?.usage.daily.map((d) => d.requests) ?? [1]), 1)

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container admin-page">
          <PageHeader
            title="Admin"
            subtitle="User management and AI usage analytics."
            actions={
              <button type="button" className="btn btn-secondary" onClick={() => void refresh()} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : undefined} />
                Refresh
              </button>
            }
          />

          {error && <div className="admin-error">{error}</div>}

          {analytics && (
            <>
              <section className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-label">
                    <Users size={16} />
                    Total users
                  </div>
                  <div className="admin-stat-value">{formatNumber(analytics.users.total)}</div>
                  <div className="admin-stat-meta">
                    {formatNumber(analytics.users.registered)} registered ·{' '}
                    {formatNumber(analytics.users.anonymous)} anonymous
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">
                    <BarChart3 size={16} />
                    Requests this month
                  </div>
                  <div className="admin-stat-value">{formatNumber(analytics.usage.requestsMonth)}</div>
                  <div className="admin-stat-meta">
                    {formatNumber(analytics.usage.requestsToday)} today
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-label">Cost this month</div>
                  <div className="admin-stat-value">{formatUsd(analytics.usage.costMonthUsd)}</div>
                  <div className="admin-stat-meta">
                    {formatNumber(analytics.usage.tokensMonth)} tokens
                  </div>
                </div>
              </section>

              <div className="admin-panels">
                <section className="admin-panel">
                  <h2>Usage (30 days)</h2>
                  <div className="admin-chart">
                    {analytics.usage.daily.map((point) => (
                      <div key={point.day} className="admin-chart-row">
                        <span className="admin-chart-label">{point.day.slice(5)}</span>
                        <div className="admin-chart-bar-wrap">
                          <div
                            className="admin-chart-bar"
                            style={{ width: `${(point.requests / maxDailyRequests) * 100}%` }}
                          />
                        </div>
                        <span className="admin-chart-value">{point.requests}</span>
                      </div>
                    ))}
                    {analytics.usage.daily.length === 0 && (
                      <p className="admin-empty">No usage recorded yet.</p>
                    )}
                  </div>
                </section>

                <section className="admin-panel">
                  <h2>Users by plan</h2>
                  <ul className="admin-plan-list">
                    {analytics.users.byPlan.map((item) => (
                      <li key={item.planId}>
                        <span>{item.planName}</span>
                        <strong>{formatNumber(item.count)}</strong>
                      </li>
                    ))}
                  </ul>

                  <h3>Top spenders (month)</h3>
                  <ul className="admin-top-users">
                    {analytics.usage.topUsersByCost.map((user) => (
                      <li key={user.userId}>
                        <div>
                          <strong>{user.displayName}</strong>
                          <span>{user.email ?? user.userId.slice(0, 8)}</span>
                        </div>
                        <div className="admin-top-user-stats">
                          <span>{formatUsd(user.monthCostUsd)}</span>
                          <span>{formatNumber(user.monthRequests)} req</span>
                        </div>
                      </li>
                    ))}
                    {analytics.usage.topUsersByCost.length === 0 && (
                      <li className="admin-empty">No usage yet.</li>
                    )}
                  </ul>
                </section>
              </div>
            </>
          )}

          <section className="admin-panel admin-users-panel">
            <h2>Users</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Month requests</th>
                    <th>Month cost</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const name =
                      [user.givenName, user.familyName].filter(Boolean).join(' ') ||
                      user.email ||
                      (user.isAnonymous ? 'Anonymous' : 'User')

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-user-cell">
                            <strong>{name}</strong>
                            <span>{user.isAnonymous ? 'Guest session' : user.email ?? user.id.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-plan-select"
                            value={user.planId}
                            onChange={(e) => void updateUserPlan(user.id, e.target.value)}
                          >
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{formatNumber(user.monthRequests)}</td>
                        <td>{formatUsd(user.monthCostUsd)}</td>
                        <td>{formatDate(user.lastSeenAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!loading && users.length === 0 && <p className="admin-empty">No users found.</p>}
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  )
}
