export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 32 : 36
  return (
    <div
      className="logo-icon"
      style={{ width: dim, height: dim, fontSize: size === 'sm' ? 14 : 16 }}
    >
      M
    </div>
  )
}
