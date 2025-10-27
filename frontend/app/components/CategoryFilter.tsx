'use client'

interface CategoryFilterProps {
  value: string
  onChange: (category: string) => void
}

const CATEGORIES = [
  'All',
  'Politics',
  'UFOs',
  'Crypto',
  'Health',
  'Sports',
  'Entertainment',
  'Science',
  'Technology',
  'Other',
]

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {CATEGORIES.map((category) => (
        <option key={category} value={category.toLowerCase()}>
          {category}
        </option>
      ))}
    </select>
  )
}
