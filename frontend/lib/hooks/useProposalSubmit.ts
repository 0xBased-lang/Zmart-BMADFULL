/**
 * useProposalSubmit Hook
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Handles Solana transaction building and submission for proposal creation
 * Pattern based on betting.ts from Story 3.4
 */

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@project-serum/anchor';
import toast from 'react-hot-toast';

// Import ProposalSystem IDL
import ProposalSystemIDL from '../solana/idl/proposal_system.json';

export interface ProposalSubmitData {
  title: string;
  description: string;
  bondAmount: number; // in ZMart (will convert to lamports)
  endTimestamp: number; // Unix timestamp
}

export interface ProposalSubmitResult {
  success: boolean;
  signature?: string;
  proposalId?: string;
  error?: string;
}

export function useProposalSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connection } = useConnection();
  const wallet = useWallet();

  const submitProposal = async (
    data: ProposalSubmitData
  ): Promise<ProposalSubmitResult> => {
    setIsSubmitting(true);

    try {
      // Validate wallet connection
      if (!wallet.publicKey || !wallet.signTransaction) {
        toast.error('Please connect your wallet');
        return { success: false, error: 'Wallet not connected' };
      }

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );

      // Initialize ProposalSystem program
      const programId = new PublicKey(ProposalSystemIDL.address);
      const program = new Program(ProposalSystemIDL as any, programId, provider);

      // Generate proposal ID (in real implementation, fetch last proposal ID + 1)
      // For now, use timestamp as a simple unique ID
      const proposalId = new BN(Date.now());

      // Determine bond tier based on amount
      // Tier thresholds (in ZMart):
      // - Tier1 (Low): 50-99 ZMart → 2% creator fee
      // - Tier2 (Medium): 100-499 ZMart → 1% creator fee
      // - Tier3 (High): 500+ ZMart → 0.5% creator fee
      let bondTier: any;
      if (data.bondAmount < 100) {
        bondTier = { tier1: {} };
      } else if (data.bondAmount < 500) {
        bondTier = { tier2: {} };
      } else {
        bondTier = { tier3: {} };
      }

      // Derive proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), proposalId.toArrayLike(Buffer, 'le', 8)],
        programId
      );

      // Parameter Storage program address (from environment)
      const parameterStorageProgram = new PublicKey(
        process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
      );

      // Derive GlobalParameters PDA from ParameterStorage
      const [globalParameters] = PublicKey.findProgramAddressSync(
        [Buffer.from('global-parameters')],
        parameterStorageProgram
      );

      // Build transaction
      // Per IDL: create_proposal(proposal_id, title, description, bond_tier, end_date)
      const tx = await program.methods
        .createProposal(
          proposalId,
          data.title,
          data.description,
          bondTier,                    // ✅ FIXED: Pass tier enum instead of amount
          new BN(data.endTimestamp)
        )
        .accounts({
          proposal: proposalPDA,
          globalParameters,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          parameterStorageProgram,   // ✅ FIXED: Added missing account
        })
        .transaction();

      // Sign and send transaction
      const signature = await wallet.sendTransaction(tx, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Proposal submitted successfully!');

      return {
        success: true,
        signature,
        proposalId: proposalId.toString(),
      };
    } catch (error: any) {
      console.error('Proposal submission error:', error);

      let errorMessage = 'Failed to submit proposal';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitProposal,
    isSubmitting,
  };
}
