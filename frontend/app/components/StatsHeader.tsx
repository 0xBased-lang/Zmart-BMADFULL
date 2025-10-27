'use client'

interface StatsHeaderProps {
  totalMarkets: number
  totalVolume: number
  totalUsers?: number
}

export function StatsHeader({ totalMarkets, totalVolume, totalUsers }: StatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
          Active Markets
        </p>
        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
          {totalMarkets}
        </p>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
          Total Volume (24h)
        </p>
        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
          ${totalVolume.toFixed(2)}
        </p>
      </div>

      {totalUsers !== undefined && (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
            Total Users
          </p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {totalUsers}
          </p>
        </div>
      )}
    </div>
  )
}
