import { Search } from 'lucide-react'

interface SearchInputProps {
  placeholder: string
}

export function SearchInput({ placeholder }: SearchInputProps) {
  return (
    <div className="search-input-wrapper">
      <Search size={16} className="search-input-icon icon-subtle" />
      <input type="text" placeholder={placeholder} className="search-input" />
    </div>
  )
}
