'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope)

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to reload
                  console.log('[PWA] New version available! Please reload.')
                  // Future: Show toast notification to user
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error)
        })

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed')
      })
    }

    // Handle PWA install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null

    interface BeforeInstallPromptEvent extends Event {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      console.log('[PWA] Install prompt available')
      // Future: Show custom install button in UI
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Log successful install
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App successfully installed')
      deferredPrompt = null
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return null // This component doesn't render anything
}
