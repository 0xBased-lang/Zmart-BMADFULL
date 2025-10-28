'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  adminWallet: string | null;
  connectedWallet: string | null;
}

/**
 * Hook to check if the connected wallet is the admin wallet
 * Admin wallet address is configured via NEXT_PUBLIC_ADMIN_WALLET environment variable
 *
 * @returns AdminAuthState object with authentication status
 *
 * @example
 * ```tsx
 * const { isAdmin, isLoading, adminWallet } = useAdminAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 * return <AdminDashboard />;
 * ```
 */
export function useAdminAuth(): AdminAuthState {
  const { publicKey, connected } = useWallet();

  const authState = useMemo(() => {
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    const connectedWallet = publicKey?.toBase58() || null;

    // Loading state: wallet is connecting
    if (!connected && !publicKey) {
      return {
        isAdmin: false,
        isLoading: true,
        adminWallet: adminWallet || null,
        connectedWallet: null,
      };
    }

    // Not connected or no admin wallet configured
    if (!connectedWallet || !adminWallet) {
      return {
        isAdmin: false,
        isLoading: false,
        adminWallet: adminWallet || null,
        connectedWallet,
      };
    }

    // Check if connected wallet matches admin wallet
    const isAdmin = connectedWallet === adminWallet;

    return {
      isAdmin,
      isLoading: false,
      adminWallet,
      connectedWallet,
    };
  }, [publicKey, connected]);

  return authState;
}
