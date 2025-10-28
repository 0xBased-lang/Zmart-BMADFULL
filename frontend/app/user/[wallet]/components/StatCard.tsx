interface StatCardProps {
  label: string
  value: string
  icon: string
  valueColor?: string
}

/**
 * Reusable stat display card
 * Displays a single statistic with icon, label, and value
 */
export function StatCard({
  label,
  value,
  icon,
  valueColor = 'text-white',
}: StatCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${valueColor}`}>
        {value}
      </div>
    </div>
  )
}
