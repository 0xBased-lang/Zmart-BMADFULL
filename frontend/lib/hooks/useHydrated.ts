import { useEffect, useState } from 'react'

/**
 * Hook to detect when component has hydrated on client
 * Useful for testing to ensure client-side JavaScript has executed
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}
