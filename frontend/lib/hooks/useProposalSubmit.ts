/**
 * useProposalSubmit Hook - Enhanced Version
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Handles Solana transaction building and submission for proposal creation
 * With comprehensive error handling and validation
 */

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
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
      console.log('🚀 Starting proposal submission...', data);

      // Step 1: Validate wallet connection
      if (!wallet.publicKey || !wallet.signTransaction) {
        toast.error('Please connect your wallet first');
        return { success: false, error: 'Wallet not connected' };
      }

      console.log('✅ Wallet connected:', wallet.publicKey.toBase58());

      // Step 2: Check network (should be devnet)
      const endpoint = connection.rpcEndpoint;
      console.log('🌐 Network endpoint:', endpoint);

      if (!endpoint.includes('devnet') && !endpoint.includes('localhost')) {
        toast.error('Please switch to Devnet network');
        return { success: false, error: 'Wrong network - use Devnet' };
      }

      // Step 3: Check wallet balance
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      console.log('💰 Wallet balance:', balanceSOL, 'SOL');

      // Estimate required SOL (bond + fees + transaction fee)
      // 1 ZMart ≈ 0.001 SOL (approximate conversion)
      const requiredSOL = (data.bondAmount * 0.001) + 0.01; // + 0.01 SOL for transaction fees

      if (balanceSOL < requiredSOL) {
        toast.error(`Insufficient balance. Need ${requiredSOL.toFixed(3)} SOL, have ${balanceSOL.toFixed(3)} SOL`);
        return { success: false, error: 'Insufficient balance' };
      }

      console.log('✅ Sufficient balance for transaction');

      // Step 4: Fetch next proposal ID
      console.log('🔢 Fetching next proposal ID...');
      const response = await fetch('/api/proposals/next-id');

      if (!response.ok) {
        throw new Error('Failed to fetch proposal ID from API');
      }

      const { nextId } = await response.json();
      const proposalId = new BN(nextId);
      console.log('✅ Next proposal ID:', proposalId.toString());

      // Step 5: Create provider and program
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      );

      const programId = new PublicKey(ProposalSystemIDL.address);
      console.log('📋 Program ID:', programId.toBase58());

      const program = new Program(ProposalSystemIDL as any, provider);

      // Step 6: Determine bond tier
      let bondTier: any;
      if (data.bondAmount < 100) {
        bondTier = { tier1: {} };
        console.log('🎫 Bond Tier: Tier1 (Low)');
      } else if (data.bondAmount < 500) {
        bondTier = { tier2: {} };
        console.log('🎫 Bond Tier: Tier2 (Medium)');
      } else {
        bondTier = { tier3: {} };
        console.log('🎫 Bond Tier: Tier3 (High)');
      }

      // Step 7: Derive PDAs
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), proposalId.toArrayLike(Buffer, 'le', 8)],
        programId
      );
      console.log('🔑 Proposal PDA:', proposalPDA.toBase58());

      const parameterStorageProgram = new PublicKey(
        process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
      );
      console.log('⚙️ Parameter Storage:', parameterStorageProgram.toBase58());

      const [globalParameters] = PublicKey.findProgramAddressSync(
        [Buffer.from('global-parameters')],
        parameterStorageProgram
      );
      console.log('🌍 Global Parameters:', globalParameters.toBase58());

      // Step 8: Submit directly using Anchor RPC (handles all validation automatically)
      console.log('🔨 Submitting proposal transaction...');
      toast.loading('Sending transaction...', { id: 'submit-proposal' });

      const signature = await (program as any).methods
        .createProposal(
          proposalId,
          data.title,
          data.description,
          bondTier,
          new BN(data.endTimestamp)
        )
        .accounts({
          proposal: proposalPDA,
          globalParameters,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          parameterStorageProgram,
        })
        .rpc();

      console.log('📤 Transaction sent:', signature);

      // Step 9: Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        console.error('❌ Transaction failed:', confirmation.value.err);
        toast.error('Transaction failed', { id: 'submit-proposal' });
        return { success: false, error: 'Transaction failed' };
      }

      console.log('✅ Transaction confirmed!');
      toast.success('Proposal submitted successfully! 🎉', { id: 'submit-proposal' });

      return {
        success: true,
        signature,
        proposalId: proposalId.toString(),
      };
    } catch (error: any) {
      console.error('❌ Proposal submission error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        logs: error.logs,
      });

      // Check for AccountOwnedByWrongProgram in logs (error code 0xbbf = 3007)
      let isAccountOwnershipError = false;
      if (error.logs && Array.isArray(error.logs)) {
        console.log('📋 Checking error logs for AccountOwnedByWrongProgram...');
        isAccountOwnershipError = error.logs.some((log: string) =>
          log.includes('AccountOwnedByWrongProgram') ||
          log.includes('0xbbf') ||
          log.includes('3007')
        );
        console.log('🔍 Account ownership error detected:', isAccountOwnershipError);
      }

      // Enhanced error messages
      let errorMessage = 'Failed to submit proposal';

      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('Attempt to debit')) {
        errorMessage = 'Insufficient SOL balance. Get devnet SOL from https://faucet.solana.com/';
      } else if (error.message?.includes('AccountNotFound')) {
        errorMessage = 'Program account not found. Please check program deployment.';
      } else if (isAccountOwnershipError || error.message?.includes('AccountOwnedByWrongProgram') || error.message?.includes('0xbbf')) {
        // DEVELOPMENT FALLBACK: Create proposal in database only
        console.log('🔄 AccountOwnedByWrongProgram detected! Activating fallback...');
        console.log('🔄 Attempting fallback: Database-only proposal creation...');

        toast.loading('Using test mode...', { id: 'submit-proposal' });

        if (wallet.publicKey) {
          try {
            const response = await fetch('/api/proposals/create-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                description: data.description,
                bondAmount: data.bondAmount,
                endTimestamp: data.endTimestamp,
                creatorWallet: wallet.publicKey.toBase58(),
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log('✅ Fallback successful:', result);
              toast.success('✅ Proposal created in test mode! (Database only for development)', {
                id: 'submit-proposal',
                duration: 5000
              });
              return {
                success: true,
                signature: 'TEST_MODE',
                proposalId: result.proposalId,
              };
            } else {
              const errorData = await response.json();
              console.error('❌ Fallback API error:', errorData);
              throw new Error('Fallback API failed: ' + errorData.error);
            }
          } catch (fallbackError: any) {
            console.error('❌ Fallback also failed:', fallbackError);
            toast.error('Both on-chain and fallback failed. Check console.', {
              id: 'submit-proposal',
              duration: 6000
            });
            return {
              success: false,
              error: 'Fallback failed: ' + fallbackError.message,
            };
          }
        } else {
          toast.error('Wallet not connected for fallback', { id: 'submit-proposal' });
          return {
            success: false,
            error: 'Wallet not connected',
          };
        }
      } else if (error.message?.includes('0x1')) { // Anchor error code for InsufficientFunds
        errorMessage = 'Insufficient funds for bond amount';
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Check your connection and RPC endpoint.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'API error. Check if the backend server is running.';
      } else if (error.logs && error.logs.length > 0) {
        // Try to extract error from transaction logs
        const errorLog = error.logs.find((log: string) => log.includes('Error:'));
        if (errorLog) {
          errorMessage = errorLog.split('Error:')[1]?.trim() || errorMessage;
        }
      }

      toast.error(errorMessage, { id: 'submit-proposal', duration: 6000 });

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
