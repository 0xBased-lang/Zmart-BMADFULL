'use client';

/**
 * ProposalManagement Component
 * Admin interface for approving/rejecting market proposals
 *
 * Features:
 * - List proposals that have ended voting
 * - Show vote tallies and approval percentage
 * - Approve proposals (≥60% YES threshold)
 * - Reject proposals (<60% YES or no votes)
 * - Create market from approved proposal
 */

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import ProposalSystemIDL from '@/lib/solana/idl/proposal_system.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Proposal {
  id: number;
  proposal_id: string;
  creator_wallet: string;
  title: string;
  description: string;
  bond_amount: number;
  bond_tier: string;
  status: string;
  yes_votes: number;
  no_votes: number;
  total_voters: number;
  created_at: string;
  end_date: string;
  on_chain_address: string;
}

interface Market {
  market_id: number;
  proposal_id: string;
  title: string;
  description: string;
  status: string;
  yes_amount: number;
  no_amount: number;
  total_amount: number;
  resolution: string | null;
  resolved_at: string | null;
  market_end_time: string;
  created_at: string;
}

export function ProposalManagement() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolvingMarketId, setResolvingMarketId] = useState<number | null>(null);
  const { connection } = useConnection();
  const wallet = useWallet();

  // Fetch proposals that have ended voting and are still pending
  useEffect(() => {
    fetchProposals();

    // Real-time subscription
    const subscription = supabase
      .channel('proposals_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposals',
      }, () => {
        fetchProposals();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProposals() {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // Fetch proposals
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'PENDING')
        .lt('end_date', now) // Voting has ended
        .order('end_date', { ascending: false });

      if (proposalError) throw proposalError;

      // Fetch markets (active and those ready for resolution)
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .select('*')
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (marketError) throw marketError;

      setProposals(proposalData || []);
      setMarkets(marketData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(proposal: Proposal) {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate approval criteria
    const totalVotes = proposal.yes_votes + proposal.no_votes;
    if (totalVotes === 0) {
      toast.error('No votes cast on this proposal');
      return;
    }

    const yesPercentage = (proposal.yes_votes / totalVotes) * 100;
    if (yesPercentage < 60) {
      toast.error(`Insufficient approval: ${yesPercentage.toFixed(1)}% YES (need ≥60%)`);
      return;
    }

    setProcessingId(proposal.proposal_id);

    try {
      // Import the proposal-to-market service
      const { createMarketFromProposal } = await import('@/lib/solana/proposal-to-market');

      // Step 1: Show initial toast
      toast.loading('Step 1/3: Approving proposal on-chain...', { id: 'market-creation' });

      // Step 2: Execute complete workflow (approve + create market on-chain)
      const result = await createMarketFromProposal(
        {
          proposal_id: parseInt(proposal.proposal_id),
          title: proposal.title,
          description: proposal.description,
          end_date: proposal.end_date,
          creator_address: proposal.creator_wallet
        },
        wallet.publicKey
      );

      // Step 3: Handle errors
      if (!result.success) {
        toast.error(result.error || 'Failed to create market', { id: 'market-creation' });
        return;
      }

      // Step 4: Update toast for database sync
      toast.loading('Step 2/3: Creating market on-chain...', { id: 'market-creation' });
      toast.loading('Step 3/3: Syncing to database...', { id: 'market-creation' });

      // Step 5: Sync market to database
      const syncResponse = await fetch('/api/sync-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: parseInt(proposal.proposal_id),
          marketId: result.marketId,
          title: proposal.title,
          description: proposal.description,
          endDate: proposal.end_date,
          creatorAddress: proposal.creator_wallet,
          category: 'General',
          approvalTxHash: result.approvalTxHash,
          creationTxHash: result.creationTxHash,
          adminWallet: wallet.publicKey.toString()
        })
      });

      const syncData = await syncResponse.json();

      if (!syncData.success) {
        console.error('Database sync failed:', syncData.error);
        toast.error(
          `Market created on-chain but database sync failed: ${syncData.error}. Please contact admin.`,
          { id: 'market-creation', duration: 10000 }
        );
        return;
      }

      // Step 6: Success! Show final toast
      toast.success(
        `🎉 Market created successfully! Market ID: ${result.marketId}`,
        { id: 'market-creation', duration: 7000 }
      );

      // Step 7: Show transaction hashes for transparency
      console.log('✅ Approval Tx:', result.approvalTxHash);
      console.log('✅ Creation Tx:', result.creationTxHash);
      console.log('✅ Market synced to database');

      // Step 8: Refresh proposals to show updated status
      await fetchProposals();

    } catch (error: any) {
      console.error('Approve error:', error);

      let errorMessage = 'Failed to approve proposal';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('VotingNotEnded')) {
        errorMessage = 'Voting period has not ended yet';
      } else if (error.message?.includes('InsufficientApproval')) {
        errorMessage = 'Proposal does not have ≥60% YES votes';
      }

      toast.error(errorMessage, { id: 'market-creation' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(proposal: Proposal) {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    setProcessingId(proposal.proposal_id);

    try {
      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );

      // Initialize ProposalSystem program
      const programId = new PublicKey(ProposalSystemIDL.address);
      const program = new Program(ProposalSystemIDL as any, provider);

      // Derive proposal PDA
      const proposalId = new BN(proposal.proposal_id);
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), proposalId.toArrayLike(Buffer, 'le', 8)],
        programId
      );

      // Get creator public key
      const creator = new PublicKey(proposal.creator_wallet);

      // Build transaction
      const tx = await (program as any).methods
        .rejectProposal()
        .accounts({
          proposal: proposalPDA,
          creator: creator,
        })
        .transaction();

      // Sign and send
      const signature = await wallet.sendTransaction(tx, connection);

      toast.loading('Rejecting proposal...', { id: 'reject-tx' });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Proposal rejected. 50% bond refunded to creator.', {
        id: 'reject-tx',
        duration: 5000,
      });

      // Refresh proposals
      await fetchProposals();

    } catch (error: any) {
      console.error('Reject error:', error);

      let errorMessage = 'Failed to reject proposal';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('ProposalNotRejected')) {
        errorMessage = 'Proposal has ≥60% YES votes (cannot reject)';
      }

      toast.error(errorMessage, { id: 'reject-tx' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleResolveMarket(market: Market, outcome: 'yes' | 'no') {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    setResolvingMarketId(market.market_id);

    try {
      // Import the market resolution service
      const { resolveMarket } = await import('@/lib/solana/market-resolution');

      // Step 1: Show initial toast
      toast.loading('Step 1/2: Resolving market on-chain...', { id: 'market-resolution' });

      // Step 2: Get platform wallet from env (or use connected wallet as fallback)
      const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || wallet.publicKey.toString();

      // Step 3: Resolve market on-chain
      const result = await resolveMarket({
        marketId: market.market_id,
        outcome,
        creatorAddress: market.proposal_id, // Using proposal_id as creator for now
        platformWallet
      });

      // Step 4: Handle errors
      if (!result.success) {
        toast.error(result.error || 'Failed to resolve market', { id: 'market-resolution' });
        return;
      }

      // Step 5: Update toast for database sync
      toast.loading('Step 2/2: Syncing resolution to database...', { id: 'market-resolution' });

      // Step 6: Update database
      const { error } = await supabase
        .from('markets')
        .update({
          resolution: outcome,
          resolved_at: new Date().toISOString(),
          status: 'resolved'
        })
        .eq('market_id', market.market_id);

      if (error) {
        console.error('Database sync failed:', error);
        toast.error(
          `Market resolved on-chain but database sync failed: ${error.message}`,
          { id: 'market-resolution', duration: 10000 }
        );
        return;
      }

      // Step 7: Success! Show final toast
      toast.success(
        `🎉 Market resolved as ${outcome.toUpperCase()}! Users can now claim payouts.`,
        { id: 'market-resolution', duration: 7000 }
      );

      // Step 8: Show transaction hash for transparency
      console.log('✅ Resolution Tx:', result.txHash);
      console.log('✅ Market synced to database');

      // Step 9: Refresh data
      await fetchProposals();

    } catch (error: any) {
      console.error('Resolution error:', error);

      let errorMessage = 'Failed to resolve market';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('MarketNotEnded')) {
        errorMessage = 'Market has not ended yet';
      } else if (error.message?.includes('MarketAlreadyResolved')) {
        errorMessage = 'Market has already been resolved';
      }

      toast.error(errorMessage, { id: 'market-resolution' });
    } finally {
      setResolvingMarketId(null);
    }
  }

  function getApprovalPercentage(proposal: Proposal): number {
    const total = proposal.yes_votes + proposal.no_votes;
    if (total === 0) return 0;
    return (proposal.yes_votes / total) * 100;
  }

  function canApprove(proposal: Proposal): boolean {
    return getApprovalPercentage(proposal) >= 60 && proposal.total_voters > 0;
  }

  function isMarketReadyForResolution(market: Market): boolean {
    return market.status === 'active' && new Date(market.market_end_time) < new Date();
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Proposal Management</h2>
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Markets Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Market Resolution</h2>
            <p className="text-sm text-gray-400 mt-1">
              Resolve markets that have ended
            </p>
          </div>
          <button
            onClick={fetchProposals}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {markets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No markets found</p>
            <p className="text-sm">Markets will appear here when active</p>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => {
              const readyToResolve = isMarketReadyForResolution(market);
              const yesPercentage = market.total_amount > 0 ? (market.yes_amount / market.total_amount) * 100 : 50;

              return (
                <div
                  key={market.market_id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {market.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {market.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      market.status === 'resolved'
                        ? 'bg-blue-500/20 text-blue-400'
                        : readyToResolve
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {market.status === 'resolved' ? '✓ Resolved' : readyToResolve ? '⏰ Ready' : '🔄 Active'}
                    </span>
                  </div>

                  {/* Market Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-xs text-gray-400">YES Pool</p>
                      <p className="text-xl font-bold text-green-400">{market.yes_amount.toFixed(2)} SOL</p>
                      <p className="text-xs text-gray-400">{yesPercentage.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-xs text-gray-400">NO Pool</p>
                      <p className="text-xl font-bold text-red-400">{market.no_amount.toFixed(2)} SOL</p>
                      <p className="text-xs text-gray-400">{(100 - yesPercentage).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-xs text-gray-400">Total Volume</p>
                      <p className="text-xl font-bold text-white">{market.total_amount.toFixed(2)} SOL</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{ width: `${yesPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span className="text-green-400">YES</span>
                      <span className="text-red-400">NO</span>
                    </div>
                  </div>

                  {/* Resolution Info or Controls */}
                  {market.status === 'resolved' && market.resolution ? (
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-sm text-gray-400">
                        Resolved as <span className="text-blue-400 font-bold">{market.resolution.toUpperCase()}</span> on {new Date(market.resolved_at!).toLocaleDateString()}
                      </p>
                    </div>
                  ) : readyToResolve ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-4">
                      <p className="text-sm text-yellow-400 mb-3">
                        ⏰ Market ended on {new Date(market.market_end_time).toLocaleDateString()} - Ready for resolution
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResolveMarket(market, 'yes')}
                          disabled={resolvingMarketId === market.market_id}
                          className="flex-1 py-2 px-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {resolvingMarketId === market.market_id ? 'Resolving...' : '✓ Resolve YES'}
                        </button>
                        <button
                          onClick={() => handleResolveMarket(market, 'no')}
                          disabled={resolvingMarketId === market.market_id}
                          className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {resolvingMarketId === market.market_id ? 'Resolving...' : '✗ Resolve NO'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-sm text-gray-400">
                        Ends: {new Date(market.market_end_time).toLocaleDateString()} at {new Date(market.market_end_time).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proposals Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Proposal Management</h2>
            <p className="text-sm text-gray-400 mt-1">
              Approve or reject proposals that have ended voting
            </p>
          </div>
        </div>

        {proposals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No proposals awaiting decision</p>
          <p className="text-sm">Proposals will appear here after their voting period ends</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const approvalPct = getApprovalPercentage(proposal);
            const approved = canApprove(proposal);

            return (
              <div
                key={proposal.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {proposal.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {proposal.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    approved
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {approved ? '✓ Meets Threshold' : '✗ Below Threshold'}
                  </span>
                </div>

                {/* Vote Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">YES Votes</p>
                    <p className="text-xl font-bold text-green-400">{proposal.yes_votes}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">NO Votes</p>
                    <p className="text-xl font-bold text-red-400">{proposal.no_votes}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">Approval</p>
                    <p className="text-xl font-bold text-white">
                      {approvalPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400">Bond ({proposal.bond_tier})</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {(proposal.bond_amount / 1_000_000_000).toFixed(2)} SOL
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        approved ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${approvalPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span className="font-medium">60% threshold</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex gap-4 text-xs text-gray-400 mb-4">
                  <span>Creator: {proposal.creator_wallet.slice(0, 4)}...{proposal.creator_wallet.slice(-4)}</span>
                  <span>•</span>
                  <span>Ended: {new Date(proposal.end_date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>ID: {proposal.proposal_id}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(proposal)}
                    disabled={!approved || processingId === proposal.proposal_id}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      approved && processingId !== proposal.proposal_id
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {processingId === proposal.proposal_id ? 'Processing...' : '✓ Approve & Create Market'}
                  </button>
                  <button
                    onClick={() => handleReject(proposal)}
                    disabled={processingId === proposal.proposal_id}
                    className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingId === proposal.proposal_id ? 'Processing...' : '✗ Reject & Refund 50%'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
  );
}
