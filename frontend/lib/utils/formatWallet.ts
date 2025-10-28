/**
 * Truncate wallet address to readable format
 * Format: ${first4}...${last4}
 *
 * @param wallet - Full Solana wallet address
 * @returns Truncated wallet address
 */
export function formatWallet(wallet: string): string {
  if (!wallet) return ''
  if (wallet.length <= 8) return wallet
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
}

/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
