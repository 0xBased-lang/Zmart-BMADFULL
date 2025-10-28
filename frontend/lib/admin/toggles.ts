import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import idl from '@/lib/solana/idl/parameter_storage.json';

const PARAMETER_STORAGE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PARAMETER_STORAGE_ID || 'J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD'
);

export interface UpdateToggleParams {
  toggleName: string;
  enabled: boolean;
  publicKey: PublicKey;
  connection: Connection;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

export interface UpdateToggleResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function updateToggle(params: UpdateToggleParams): Promise<UpdateToggleResult> {
  const { toggleName, enabled, publicKey, connection, signTransaction } = params;

  try {
    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) => Promise.all(txs.map((tx) => signTransaction(tx))),
      } as any,
      { commitment: 'confirmed' }
    );

    const program = new Program(idl as any, PARAMETER_STORAGE_PROGRAM_ID, provider);
    const [togglesPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global-toggles')],
      PARAMETER_STORAGE_PROGRAM_ID
    );

    const tx = await program.methods
      .updateToggle(toggleName, enabled)
      .accounts({
        toggles: togglesPda,
        authority: publicKey,
      })
      .rpc();

    return { success: true, txHash: tx };
  } catch (err) {
    console.error('Error updating toggle:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update toggle',
    };
  }
}
