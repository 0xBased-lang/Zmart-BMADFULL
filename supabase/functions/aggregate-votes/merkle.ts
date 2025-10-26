// BMAD-Zmart Merkle Tree Generation
// Story 2.3: Vote Aggregation - Merkle Root for Vote Verification
// Purpose: Generate cryptographic proof of all votes for trustless verification

import { keccak256 } from "https://esm.sh/js-sha3@0.9.3";

// ============================================================================
// Types
// ============================================================================

export interface Vote {
  voter_wallet: string;
  vote_choice: 'YES' | 'NO';
  vote_weight: number;
  timestamp: string; // ISO 8601
  signature: string; // Base58 encoded
}

export interface MerkleTreeResult {
  root: string; // Hex-encoded 32-byte hash
  leafCount: number;
  leaves: string[]; // Hex-encoded leaf hashes (for verification)
}

// ============================================================================
// Merkle Root Generation (Simplified for MVP)
// ============================================================================

/**
 * Generate Merkle root from votes
 *
 * Simplified implementation for MVP:
 * - Deterministic sorting (timestamp, then wallet)
 * - keccak256 hash of each vote
 * - Simple concatenation and hash (not full tree for now)
 *
 * For production: Upgrade to full Merkle tree with proof generation
 *
 * @param votes Array of votes from PostgreSQL
 * @returns Merkle root as hex string (32 bytes)
 */
export function generateMerkleRoot(votes: Vote[]): MerkleTreeResult {
  if (votes.length === 0) {
    // No votes: return hash of empty string
    const emptyHash = keccak256('');
    return {
      root: emptyHash,
      leafCount: 0,
      leaves: [],
    };
  }

  // Step 1: Sort votes deterministically
  const sortedVotes = sortVotesDeterministically(votes);

  // Step 2: Generate leaf hashes
  const leaves = sortedVotes.map(vote => hashVote(vote));

  // Step 3: Build Merkle tree (simplified: hash all leaves together)
  const root = buildSimpleMerkleRoot(leaves);

  return {
    root,
    leafCount: leaves.length,
    leaves,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sort votes deterministically
 *
 * Sorting rules:
 * 1. By timestamp (ascending) - older votes first
 * 2. If timestamps equal, by wallet address (alphabetical)
 *
 * Ensures same votes always produce same Merkle root.
 */
function sortVotesDeterministically(votes: Vote[]): Vote[] {
  return [...votes].sort((a, b) => {
    // Sort by timestamp first
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // If timestamps equal, sort by wallet address
    return a.voter_wallet.localeCompare(b.voter_wallet);
  });
}

/**
 * Hash a single vote
 *
 * Creates deterministic hash of vote data:
 * keccak256(wallet|choice|weight|timestamp|signature)
 *
 * @param vote Vote to hash
 * @returns Hex-encoded hash (32 bytes)
 */
function hashVote(vote: Vote): string {
  // Concatenate vote data with | separator for clarity
  const voteData = [
    vote.voter_wallet,
    vote.vote_choice,
    vote.vote_weight.toString(),
    vote.timestamp,
    vote.signature,
  ].join('|');

  return keccak256(voteData);
}

/**
 * Build Merkle root from leaf hashes
 *
 * Simplified implementation for MVP:
 * - Concatenate all leaf hashes
 * - Hash the concatenation
 *
 * For production: Implement full binary Merkle tree
 *
 * @param leaves Array of hex-encoded leaf hashes
 * @returns Merkle root as hex string
 */
function buildSimpleMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return keccak256('');
  }

  if (leaves.length === 1) {
    return leaves[0];
  }

  // Concatenate all leaves and hash
  const concatenated = leaves.join('');
  return keccak256(concatenated);
}

// ============================================================================
// Binary Merkle Tree (Future Enhancement - Commented Out)
// ============================================================================

/**
 * Build full binary Merkle tree with proof generation
 *
 * Commented out for MVP - use simple concatenation instead.
 * Uncomment for production to enable trustless dispute resolution.
 */
/*
function buildFullMerkleTree(leaves: string[]): string {
  if (leaves.length === 0) return keccak256('');
  if (leaves.length === 1) return leaves[0];

  // Build tree level by level
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate if odd number

      // Hash pair
      const combined = left + right;
      const parentHash = keccak256(combined);
      nextLevel.push(parentHash);
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}
*/

// ============================================================================
// Merkle Proof Generation (Future Enhancement - Commented Out)
// ============================================================================

/**
 * Generate Merkle proof for a specific vote
 *
 * Enables trustless verification that a vote was included in result.
 * Commented out for MVP - implement for production dispute resolution.
 */
/*
export interface MerkleProof {
  leaf: string; // Hash of the vote
  siblings: string[]; // Sibling hashes up the tree
  root: string; // Merkle root
}

export function generateMerkleProof(votes: Vote[], voteIndex: number): MerkleProof {
  // Implementation for production
  throw new Error('Merkle proof generation not implemented yet');
}

export function verifyMerkleProof(proof: MerkleProof): boolean {
  // Implementation for production
  throw new Error('Merkle proof verification not implemented yet');
}
*/

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate Merkle root format
 *
 * @param root Hex-encoded string
 * @returns true if valid keccak256 hash (64 hex characters)
 */
export function isValidMerkleRoot(root: string): boolean {
  return /^[0-9a-f]{64}$/.test(root);
}

/**
 * Verify votes produce expected Merkle root
 *
 * Used for testing and verification.
 *
 * @param votes Array of votes
 * @param expectedRoot Expected Merkle root
 * @returns true if votes hash to expected root
 */
export function verifyVotesMatchRoot(votes: Vote[], expectedRoot: string): boolean {
  const result = generateMerkleRoot(votes);
  return result.root === expectedRoot;
}

// ============================================================================
// Example Usage (for testing)
// ============================================================================

/**
 * Example usage and test
 */
export function exampleUsage() {
  const exampleVotes: Vote[] = [
    {
      voter_wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      vote_choice: 'YES',
      vote_weight: 100,
      timestamp: '2025-10-26T12:00:00Z',
      signature: 'base58sig1...',
    },
    {
      voter_wallet: '4vMcMJMM5q5o5TmJHuPdAJhBQkLMF7rMxHH2E5LkKrpJ',
      vote_choice: 'NO',
      vote_weight: 50,
      timestamp: '2025-10-26T12:05:00Z',
      signature: 'base58sig2...',
    },
  ];

  const result = generateMerkleRoot(exampleVotes);

  console.log('Merkle Tree Result:');
  console.log('Root:', result.root);
  console.log('Leaf count:', result.leafCount);
  console.log('Leaves:', result.leaves);

  // Verify determinism: same votes → same root
  const result2 = generateMerkleRoot(exampleVotes);
  console.log('Deterministic?', result.root === result2.root); // Should be true

  return result;
}
