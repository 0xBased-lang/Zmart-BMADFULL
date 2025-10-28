'use client';

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '@/lib/solana/idl/parameter_storage.json';

const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
);

export interface GlobalFeatureToggles {
  authority: PublicKey;
  marketCreationEnabled: boolean;
  bettingEnabled: boolean;
  votingEnabled: boolean;
  proposalsEnabled: boolean;
  emergencyPause: boolean;
  bump: number;
}

export interface UseTogglesResult {
  toggles: GlobalFeatureToggles | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useToggles(): UseTogglesResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [toggles, setToggles] = useState<GlobalFeatureToggles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      setError(null);

      const [togglesPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('global-toggles')],
        PARAMETER_STORAGE_PROGRAM_ID
      );

      const provider = new AnchorProvider(
        connection,
        {
          publicKey: publicKey || PublicKey.default,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        } as any,
        { commitment: 'confirmed' }
      );

      const program = new Program(idl as any, PARAMETER_STORAGE_PROGRAM_ID, provider);
      const data = await program.account.globalFeatureToggles.fetch(togglesPda) as any;

      setToggles({
        authority: data.authority,
        marketCreationEnabled: data.marketCreationEnabled,
        bettingEnabled: data.bettingEnabled,
        votingEnabled: data.votingEnabled,
        proposalsEnabled: data.proposalsEnabled,
        emergencyPause: data.emergencyPause,
        bump: data.bump,
      });
    } catch (err) {
      console.error('Error fetching toggles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch toggles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToggles();
  }, [connection, publicKey]);

  return { toggles, loading, error, refresh: fetchToggles };
}
