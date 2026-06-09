import { Star } from 'lucide-react'
import { cn } from '../lib/cn'

interface StarButtonProps {
  starred: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function StarButton({ starred, onClick }: StarButtonProps) {
  return (
    <button type="button" className={cn('star-btn', starred && 'active')} onClick={onClick}>
      <Star size={16} fill={starred ? 'currentColor' : 'none'} />
    </button>
  )
}
