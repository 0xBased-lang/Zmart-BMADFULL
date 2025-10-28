/**
 * Wallet Mock Fixture
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Provides wallet automation by mocking Phantom wallet interface.
 * Injects window.solana object to simulate wallet connection, signing, and transactions.
 */

import { Page } from '@playwright/test';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';

/**
 * Test wallet configuration with known keypairs for deterministic testing
 */
export const TEST_WALLETS = {
  // Primary test wallet (used for most tests)
  USER1: {
    publicKey: '11111111111111111111111111111111',
    privateKey: new Uint8Array(64), // In real implementation, use actual keypair
    name: 'Test User 1',
  },
  // Secondary test wallet (for multi-user scenarios)
  USER2: {
    publicKey: '22222222222222222222222222222222',
    privateKey: new Uint8Array(64),
    name: 'Test User 2',
  },
  // Admin test wallet (for admin-only operations)
  ADMIN: {
    publicKey: 'AdminAdminAdminAdminAdminAdminAd',
    privateKey: new Uint8Array(64),
    name: 'Test Admin',
  },
};

/**
 * Mock Phantom wallet interface
 */
export interface MockWallet {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction>(transactions: T[]): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

/**
 * Creates a mock Phantom wallet object for testing
 *
 * @param wallet - Test wallet configuration to use
 * @param options - Mock behavior options
 * @returns Mock wallet object
 */
export function createMockWallet(
  wallet: typeof TEST_WALLETS.USER1,
  options: {
    autoApprove?: boolean; // Auto-approve all transactions
    rejectConnection?: boolean; // Simulate connection rejection
    rejectTransactions?: boolean; // Simulate transaction rejection
  } = {}
): MockWallet {
  const {
    autoApprove = true,
    rejectConnection = false,
    rejectTransactions = false,
  } = options;

  let connected = false;
  let currentPublicKey: PublicKey | null = null;

  return {
    isPhantom: true,
    publicKey: currentPublicKey,

    async connect() {
      if (rejectConnection) {
        throw new Error('User rejected the connection request');
      }

      connected = true;
      currentPublicKey = new PublicKey(wallet.publicKey);
      this.publicKey = currentPublicKey;

      return { publicKey: currentPublicKey };
    },

    async disconnect() {
      connected = false;
      currentPublicKey = null;
      this.publicKey = null;
    },

    async signTransaction<T extends Transaction>(transaction: T): Promise<T> {
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      if (rejectTransactions) {
        throw new Error('User rejected the transaction');
      }

      // In a real implementation, would actually sign the transaction
      // For E2E tests, we just return the transaction as-is (mocked)
      return transaction;
    },

    async signAllTransactions<T extends Transaction>(
      transactions: T[]
    ): Promise<T[]> {
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      if (rejectTransactions) {
        throw new Error('User rejected the transactions');
      }

      // Mock signing all transactions
      return transactions;
    },

    async signMessage(message: Uint8Array) {
      if (!connected) {
        throw new Error('Wallet not connected');
      }

      // Mock message signing
      return { signature: new Uint8Array(64) };
    },
  };
}

/**
 * Injects mock Phantom wallet into page before navigation
 *
 * This function uses page.addInitScript() to inject the wallet mock
 * before the page loads, ensuring window.solana is available immediately.
 *
 * @param page - Playwright page object
 * @param wallet - Test wallet to use (defaults to USER1)
 * @param options - Mock behavior options
 *
 * @example
 * ```typescript
 * await mockPhantomWallet(page);
 * await page.goto('/');
 * await page.click('button:has-text("Connect Wallet")');
 * ```
 */
export async function mockPhantomWallet(
  page: Page,
  wallet: typeof TEST_WALLETS.USER1 = TEST_WALLETS.USER1,
  options: {
    autoApprove?: boolean;
    rejectConnection?: boolean;
    rejectTransactions?: boolean;
  } = {}
) {
  await page.addInitScript(
    ({ walletPublicKey, autoApprove, rejectConnection, rejectTransactions }) => {
      // Create mock wallet that will be injected into window.solana
      let connected = false;
      let publicKey: any = null;

      (window as any).solana = {
        isPhantom: true,
        publicKey: publicKey,

        connect: async function () {
          if (rejectConnection) {
            throw new Error('User rejected the connection request');
          }

          connected = true;
          publicKey = { toString: () => walletPublicKey };
          this.publicKey = publicKey;

          // Dispatch connect event for wallet adapter listeners
          window.dispatchEvent(new Event('solana:connect'));

          return { publicKey };
        },

        disconnect: async function () {
          connected = false;
          publicKey = null;
          this.publicKey = null;

          window.dispatchEvent(new Event('solana:disconnect'));
        },

        signTransaction: async function (tx: any) {
          if (!connected) {
            throw new Error('Wallet not connected');
          }

          if (rejectTransactions) {
            throw new Error('User rejected the transaction');
          }

          // Mock transaction signature
          return tx;
        },

        signAllTransactions: async function (txs: any[]) {
          if (!connected) {
            throw new Error('Wallet not connected');
          }

          if (rejectTransactions) {
            throw new Error('User rejected the transactions');
          }

          return txs;
        },

        signMessage: async function (msg: Uint8Array) {
          if (!connected) {
            throw new Error('Wallet not connected');
          }

          return { signature: new Uint8Array(64) };
        },
      };

      // Auto-connect if requested
      if (autoApprove && !rejectConnection) {
        (window as any).solana.connect();
      }
    },
    {
      walletPublicKey: wallet.publicKey,
      autoApprove: options.autoApprove ?? true,
      rejectConnection: options.rejectConnection ?? false,
      rejectTransactions: options.rejectTransactions ?? false,
    }
  );
}

/**
 * Simulates wallet connection flow in UI
 *
 * Waits for "Connect Wallet" button, clicks it, and verifies connection.
 *
 * @param page - Playwright page object
 */
export async function connectWalletInUI(page: Page) {
  // Wait for connect button to be visible
  const connectButton = page.locator(
    'button:has-text("Connect Wallet"), button:has-text("Connect")'
  );
  await connectButton.waitFor({ state: 'visible', timeout: 10000 });

  // Click connect button
  await connectButton.click();

  // Wait for wallet to connect (address should appear)
  await page.waitForSelector('[data-testid="wallet-address"], .wallet-address', {
    timeout: 10000,
  });
}

/**
 * Verifies wallet is connected by checking for wallet address display
 *
 * @param page - Playwright page object
 * @returns True if wallet appears connected in UI
 */
export async function isWalletConnected(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector(
      '[data-testid="wallet-address"], .wallet-address',
      { timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Approves a transaction in the mock wallet
 * (In real Phantom, this would open approval dialog)
 *
 * @param page - Playwright page object
 */
export async function approveTransaction(page: Page) {
  // In mock implementation, transactions are auto-approved
  // This function is a placeholder for future Phantom integration testing
  // where we might need to click "Approve" in a wallet popup

  // For now, just wait a bit to simulate approval delay
  await page.waitForTimeout(1000);
}
