'use client'

import { useState, useEffect, useMemo } from 'react'

interface OddsChartProps {
  marketId: number
  currentOdds: { yes: number; no: number }
}

type TimeRange = '24h' | '7d' | '30d' | 'all'

interface OddsDataPoint {
  timestamp: Date
  yesOdds: number
  noOdds: number
  volume: number
}

export function OddsChart({ marketId, currentOdds }: OddsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [loading, setLoading] = useState(false)
  const [oddsHistory, setOddsHistory] = useState<OddsDataPoint[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<OddsDataPoint | null>(null)

  // Simulate fetching historical odds data
  useEffect(() => {
    const fetchOddsHistory = async () => {
      setLoading(true)
      try {
        // In production, fetch from Supabase or API
        // For now, generate simulated data
        const data = generateSimulatedData(timeRange, currentOdds)
        setOddsHistory(data)
      } catch (error) {
        console.error('Failed to fetch odds history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOddsHistory()
  }, [marketId, timeRange, currentOdds])

  // Generate simulated historical data
  const generateSimulatedData = (range: TimeRange, current: typeof currentOdds): OddsDataPoint[] => {
    const points: OddsDataPoint[] = []
    const now = new Date()
    let numPoints = 24 // Default for 24h
    let hoursBack = 24

    switch (range) {
      case '7d':
        numPoints = 7 * 6 // Every 4 hours
        hoursBack = 7 * 24
        break
      case '30d':
        numPoints = 30 // Daily
        hoursBack = 30 * 24
        break
      case 'all':
        numPoints = 60 // Arbitrary for all time
        hoursBack = 60 * 24
        break
    }

    // Start from 50/50 and gradually move to current odds
    let yesOdds = 50
    let noOdds = 50
    let volume = 0

    for (let i = 0; i < numPoints; i++) {
      const timestamp = new Date(now.getTime() - (hoursBack - (i * hoursBack / numPoints)) * 60 * 60 * 1000)

      // Gradually move towards current odds with some randomness
      const progress = i / numPoints
      const targetYes = 50 + (current.yes - 50) * progress
      const targetNo = 50 + (current.no - 50) * progress

      // Add randomness
      yesOdds = targetYes + (Math.random() - 0.5) * 10
      noOdds = 100 - yesOdds

      // Ensure bounds
      yesOdds = Math.max(5, Math.min(95, yesOdds))
      noOdds = 100 - yesOdds

      // Simulate volume growth
      volume += Math.random() * 10000

      points.push({
        timestamp,
        yesOdds: Math.round(yesOdds * 10) / 10,
        noOdds: Math.round(noOdds * 10) / 10,
        volume
      })
    }

    // Add current point
    points.push({
      timestamp: now,
      yesOdds: current.yes,
      noOdds: current.no,
      volume: volume + Math.random() * 5000
    })

    return points
  }

  // Calculate chart dimensions and scaling
  const chartDimensions = useMemo(() => {
    const width = 100 // percentage
    const height = 300 // pixels
    const padding = { top: 20, right: 20, bottom: 40, left: 40 }

    return { width, height, padding }
  }, [])

  // Calculate SVG path for odds lines
  const calculatePath = (data: OddsDataPoint[], key: 'yesOdds' | 'noOdds') => {
    if (data.length === 0) return ''

    const { height, padding } = chartDimensions
    const chartHeight = height - padding.top - padding.bottom
    const chartWidth = 100 - padding.left - padding.right

    const xScale = (index: number) => (index / (data.length - 1)) * chartWidth + padding.left
    const yScale = (value: number) => height - padding.bottom - (value / 100) * chartHeight

    const pathData = data.map((point, i) => {
      const x = xScale(i)
      const y = yScale(point[key])
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')

    return pathData
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours < 1) return 'Now'
    if (hours < 24) return `${Math.floor(hours)}h ago`
    if (hours < 168) return `${Math.floor(hours / 24)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Handle mouse/touch interaction
  const handleChartInteraction = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    const svg = event.currentTarget
    const rect = svg.getBoundingClientRect()
    let clientX: number

    if ('touches' in event) {
      clientX = event.touches[0].clientX
    } else {
      clientX = event.clientX
    }

    const x = clientX - rect.left
    const chartWidth = rect.width - chartDimensions.padding.left - chartDimensions.padding.right
    const relativeX = (x - chartDimensions.padding.left) / chartWidth
    const index = Math.round(relativeX * (oddsHistory.length - 1))

    if (index >= 0 && index < oddsHistory.length) {
      setHoveredPoint(oddsHistory[index])
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-64 bg-white/10 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Odds History</h4>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-white/5 rounded-lg p-4">
        {oddsHistory.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No historical data available
          </div>
        ) : (
          <>
            {/* Hover Info */}
            {hoveredPoint && (
              <div className="absolute top-2 left-2 bg-black/80 rounded-lg p-2 z-10 pointer-events-none">
                <div className="text-xs text-gray-400 mb-1">
                  {formatDate(hoveredPoint.timestamp)}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">YES: {hoveredPoint.yesOdds}%</span>
                  <span className="text-red-400">NO: {hoveredPoint.noOdds}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Volume: ${(hoveredPoint.volume / 1000).toFixed(1)}K
                </div>
              </div>
            )}

            {/* SVG Chart */}
            <svg
              width="100%"
              height={chartDimensions.height}
              className="cursor-crosshair"
              onMouseMove={handleChartInteraction}
              onMouseLeave={() => setHoveredPoint(null)}
              onTouchMove={handleChartInteraction}
              onTouchEnd={() => setHoveredPoint(null)}
            >
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map(value => {
                const y = chartDimensions.height - chartDimensions.padding.bottom -
                  (value / 100) * (chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom)
                return (
                  <g key={value}>
                    <line
                      x1={chartDimensions.padding.left}
                      y1={y}
                      x2={100 - chartDimensions.padding.right}
                      y2={y}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={chartDimensions.padding.left - 5}
                      y={y + 4}
                      fill="rgba(255,255,255,0.4)"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {value}%
                    </text>
                  </g>
                )
              })}

              {/* YES Line */}
              <path
                d={calculatePath(oddsHistory, 'yesOdds')}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
                className="drop-shadow-lg"
              />

              {/* NO Line */}
              <path
                d={calculatePath(oddsHistory, 'noOdds')}
                fill="none"
                stroke="rgb(239, 68, 68)"
                strokeWidth="2"
                className="drop-shadow-lg"
              />

              {/* Data Points */}
              {oddsHistory.map((point, i) => {
                const { height, padding } = chartDimensions
                const chartHeight = height - padding.top - padding.bottom
                const chartWidth = 100 - padding.left - padding.right
                const x = (i / (oddsHistory.length - 1)) * chartWidth + padding.left
                const yYes = height - padding.bottom - (point.yesOdds / 100) * chartHeight
                const yNo = height - padding.bottom - (point.noOdds / 100) * chartHeight

                return (
                  <g key={i}>
                    <circle cx={x} cy={yYes} r="3" fill="rgb(34, 197, 94)" opacity="0.8" />
                    <circle cx={x} cy={yNo} r="3" fill="rgb(239, 68, 68)" opacity="0.8" />
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-300">YES Odds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-300">NO Odds</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Current Odds Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-green-400 text-sm mb-1">Current YES</div>
          <div className="text-2xl font-bold text-white">{currentOdds.yes}%</div>
          {oddsHistory.length > 1 && (
            <div className="text-xs text-gray-400 mt-1">
              {currentOdds.yes > oddsHistory[0].yesOdds ? '↑' : '↓'}
              {' '}
              {Math.abs(currentOdds.yes - oddsHistory[0].yesOdds).toFixed(1)}% from start
            </div>
          )}
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
          <div className="text-red-400 text-sm mb-1">Current NO</div>
          <div className="text-2xl font-bold text-white">{currentOdds.no}%</div>
          {oddsHistory.length > 1 && (
            <div className="text-xs text-gray-400 mt-1">
              {currentOdds.no > oddsHistory[0].noOdds ? '↑' : '↓'}
              {' '}
              {Math.abs(currentOdds.no - oddsHistory[0].noOdds).toFixed(1)}% from start
            </div>
          )}
        </div>
      </div>
    </div>
  )
}