'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface ProposalCountdownProps {
  endTime: string | Date
}

export function ProposalCountdown({ endTime }: ProposalCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime
        const now = new Date()

        if (endDate > now) {
          const distance = formatDistanceToNow(endDate, { addSuffix: true })
          setTimeLeft(`Voting ends ${distance}`)
        } else {
          setTimeLeft('Voting ended')
        }
      } catch (error) {
        console.error('Error formatting countdown:', error)
        setTimeLeft('Invalid date')
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div className="text-sm text-gray-400">
      <svg
        className="inline w-4 h-4 mr-1"
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
      {timeLeft}
    </div>
  )
}
