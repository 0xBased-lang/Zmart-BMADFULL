'use client';

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '@/lib/solana/idl/parameter_storage.json';

const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
);

export interface GlobalParameters {
  authority: PublicKey;
  platformFeeBps: number;
  creatorFeeBps: number;
  minMarketDuration: number;
  maxMarketDuration: number;
  minBondAmount: number;
  votingPeriodDuration: number;
  disputePeriodDuration: number;
  cooldownPeriod: number;
  maxChangeBps: number;
  lastUpdate: number;
  bump: number;
}

export interface UseParametersResult {
  parameters: GlobalParameters | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch GlobalParameters from ParameterStorage program
 */
export function useParameters(): UseParametersResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [parameters, setParameters] = useState<GlobalParameters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Derive parameters PDA
      const [parametersPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('global-parameters')],
        PARAMETER_STORAGE_PROGRAM_ID
      );

      // Fetch account data
      const accountInfo = await connection.getAccountInfo(parametersPda);

      if (!accountInfo) {
        throw new Error('Parameters account not found');
      }

      // Create mock provider for read-only operations
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

      // Fetch and decode parameters
      const params = await program.account.globalParameters.fetch(parametersPda) as any;

      setParameters({
        authority: params.authority,
        platformFeeBps: params.platformFeeBps,
        creatorFeeBps: params.creatorFeeBps,
        minMarketDuration: params.minMarketDuration.toNumber(),
        maxMarketDuration: params.maxMarketDuration.toNumber(),
        minBondAmount: params.minBondAmount.toNumber(),
        votingPeriodDuration: params.votingPeriodDuration.toNumber(),
        disputePeriodDuration: params.disputePeriodDuration.toNumber(),
        cooldownPeriod: params.cooldownPeriod.toNumber(),
        maxChangeBps: params.maxChangeBps,
        lastUpdate: params.lastUpdate.toNumber(),
        bump: params.bump,
      });
    } catch (err) {
      console.error('Error fetching parameters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [connection, publicKey]);

  return {
    parameters,
    loading,
    error,
    refresh: fetchParameters,
  };
}
