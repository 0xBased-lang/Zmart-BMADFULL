import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import idl from '@/lib/solana/idl/parameter_storage.json';

const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
);

export interface UpdateParameterParams {
  parameterName: string;
  newValue: number;
  publicKey: PublicKey;
  connection: Connection;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

export interface UpdateParameterResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Update a global parameter value
 *
 * @param params - Update parameters
 * @returns Result with transaction hash or error
 */
export async function updateParameter(
  params: UpdateParameterParams
): Promise<UpdateParameterResult> {
  const { parameterName, newValue, publicKey, connection, signTransaction } = params;

  try {
    // Validate inputs
    if (!parameterName || parameterName.trim() === '') {
      return { success: false, error: 'Parameter name is required' };
    }

    if (newValue < 0) {
      return { success: false, error: 'Parameter value must be non-negative' };
    }

    // Create provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) => {
          return Promise.all(txs.map((tx) => signTransaction(tx)));
        },
      } as any,
      { commitment: 'confirmed' }
    );

    // Initialize program
    const program = new Program(idl as any, provider);

    // Derive parameters PDA
    const [parametersPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global-parameters')],
      PARAMETER_STORAGE_PROGRAM_ID
    );

    // Fetch current parameters to validate changes
    const currentParams = await (program.account as any).globalParameters.fetch(parametersPda) as any;
    const maxChangeBps = currentParams.maxChangeBps;
    const cooldownPeriod = currentParams.cooldownPeriod.toNumber();
    const lastUpdate = currentParams.lastUpdate.toNumber();

    // Check cooldown period
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastUpdate = now - lastUpdate;
    if (timeSinceLastUpdate < cooldownPeriod) {
      const remainingTime = cooldownPeriod - timeSinceLastUpdate;
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      return {
        success: false,
        error: `Cooldown period not elapsed. Wait ${hours}h ${minutes}m before next update.`,
      };
    }

    // Validate max change percentage
    let currentValue = 0;
    switch (parameterName) {
      case 'platformFeeBps':
        currentValue = currentParams.platformFeeBps;
        break;
      case 'creatorFeeBps':
        currentValue = currentParams.creatorFeeBps;
        break;
      case 'minMarketDuration':
        currentValue = currentParams.minMarketDuration.toNumber();
        break;
      case 'maxMarketDuration':
        currentValue = currentParams.maxMarketDuration.toNumber();
        break;
      case 'minBondAmount':
        currentValue = currentParams.minBondAmount.toNumber();
        break;
      case 'votingPeriodDuration':
        currentValue = currentParams.votingPeriodDuration.toNumber();
        break;
      case 'disputePeriodDuration':
        currentValue = currentParams.disputePeriodDuration.toNumber();
        break;
      default:
        return { success: false, error: `Unknown parameter: ${parameterName}` };
    }

    // Calculate percentage change
    const change = Math.abs(newValue - currentValue);
    const changePercent = (change / currentValue) * 10000; // in basis points

    if (changePercent > maxChangeBps) {
      const maxChangePercent = (maxChangeBps / 100).toFixed(1);
      return {
        success: false,
        error: `Change exceeds maximum allowed (${maxChangePercent}%). Current: ${currentValue}, New: ${newValue}`,
      };
    }

    // Convert value to BN if needed
    let valueToSend: number | BN = newValue;
    if (['minMarketDuration', 'maxMarketDuration', 'minBondAmount', 'votingPeriodDuration', 'disputePeriodDuration'].includes(parameterName)) {
      valueToSend = new BN(newValue);
    }

    // Call update_parameter instruction
    const tx = await (program as any).methods
      .updateParameter(parameterName, valueToSend)
      .accounts({
        parameters: parametersPda,
        authority: publicKey,
      })
      .rpc();

    return {
      success: true,
      txHash: tx,
    };
  } catch (err) {
    console.error('Error updating parameter:', err);
    let errorMessage = 'Failed to update parameter';

    if (err instanceof Error) {
      if (err.message.includes('Unauthorized')) {
        errorMessage = 'Unauthorized: Only admin can update parameters';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL for transaction fees';
      } else {
        errorMessage = err.message;
      }
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Calculate the maximum allowed value change for a parameter
 */
export function calculateMaxChange(currentValue: number, maxChangeBps: number): { min: number; max: number } {
  const maxChangeAmount = (currentValue * maxChangeBps) / 10000;
  return {
    min: Math.max(0, currentValue - maxChangeAmount),
    max: currentValue + maxChangeAmount,
  };
}
