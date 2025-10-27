'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface VotingCountdownProps {
  endTime: string
}

export function VotingCountdown({ endTime }: VotingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    function updateCountdown() {
      try {
        const distance = formatDistanceToNow(new Date(endTime), { addSuffix: true })
        setTimeRemaining(distance)
      } catch (error) {
        console.error('Error formatting countdown:', error)
        setTimeRemaining('Invalid date')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div className="flex items-center gap-2 text-sm">
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-gray-300">
        Voting ends <span className="font-semibold text-white">{timeRemaining}</span>
      </span>
    </div>
  )
}
