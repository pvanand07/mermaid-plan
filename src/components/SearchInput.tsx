import { Search } from 'lucide-react'

interface SearchInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="search-input-wrapper">
      <Search size={16} className="search-input-icon icon-subtle" />
      <input
        type="text"
        placeholder={placeholder}
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
