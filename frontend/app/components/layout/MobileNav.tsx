'use client'

import { Fragment } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, Transition } from '@headlessui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
)

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { connected } = useWallet()
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Markets', requiresAuth: false },
    { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
    { href: '/my-bets', label: 'My Bets', requiresAuth: true },
    { href: '/propose', label: 'Propose', requiresAuth: true },
    { href: '/vote', label: 'Vote', requiresAuth: true },
    { href: '/proposals', label: 'Proposals', requiresAuth: true },
    { href: '/leaderboard', label: 'Leaderboard', requiresAuth: false },
    { href: '/admin', label: 'Admin', requiresAuth: true },
  ]

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              {/* Slide-out panel */}
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-900 shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          Menu
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          onClick={onClose}
                        >
                          <span className="sr-only">Close panel</span>
                          {/* X Icon */}
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      <nav className="space-y-2">
                        {navLinks.map((link) => {
                          // Hide auth-required links when not connected
                          if (link.requiresAuth && !connected) return null

                          const isActive = pathname === link.href

                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={onClose}
                              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center ${
                                isActive
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {link.label}
                            </Link>
                          )
                        })}
                      </nav>
                    </div>

                    {/* Wallet Connect Button */}
                    <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-6 sm:px-6">
                      <div className="flex justify-center">
                        <WalletMultiButton className="!h-12 !min-w-[200px]" />
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
