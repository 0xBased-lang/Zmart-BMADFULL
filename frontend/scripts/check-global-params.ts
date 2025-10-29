/**
 * Diagnostic Script: Check GlobalParameters Account
 * Verifies if the GlobalParameters PDA exists and is properly initialized
 */

import { Connection, PublicKey } from '@solana/web3.js';

async function checkGlobalParameters() {
  console.log('🔍 Checking GlobalParameters account on Devnet...\n');

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Parameter Storage Program ID
  const parameterStorageProgram = new PublicKey('J63ypBPAjWEMrwyFxWTP6vG8tGF58gH8w9G6yjDFqumD');

  // Derive GlobalParameters PDA
  const [globalParametersPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('global-parameters')],
    parameterStorageProgram
  );

  console.log('📋 Account Information:');
  console.log('   Parameter Storage Program:', parameterStorageProgram.toBase58());
  console.log('   GlobalParameters PDA:', globalParametersPDA.toBase58());
  console.log('   PDA Bump:', bump);
  console.log();

  try {
    // Check if account exists
    const accountInfo = await connection.getAccountInfo(globalParametersPDA);

    if (!accountInfo) {
      console.log('❌ ISSUE FOUND: GlobalParameters account does NOT exist!');
      console.log();
      console.log('📝 This account needs to be initialized before creating proposals.');
      console.log();
      console.log('🔧 SOLUTION OPTIONS:');
      console.log();
      console.log('Option 1: Initialize the account (Recommended)');
      console.log('   Run the parameter storage initialization script:');
      console.log('   $ anchor run initialize-parameters');
      console.log();
      console.log('Option 2: Deploy programs with initialization');
      console.log('   $ cd programs');
      console.log('   $ anchor build');
      console.log('   $ anchor deploy');
      console.log('   $ anchor run initialize');
      console.log();
      console.log('Option 3: Use a test environment');
      console.log('   Configure .env.local to use a test environment where');
      console.log('   GlobalParameters is already initialized.');
      return;
    }

    console.log('✅ GlobalParameters account EXISTS!');
    console.log();
    console.log('📊 Account Details:');
    console.log('   Owner:', accountInfo.owner.toBase58());
    console.log('   Lamports:', accountInfo.lamports);
    console.log('   Data Length:', accountInfo.data.length, 'bytes');
    console.log('   Executable:', accountInfo.executable);
    console.log();

    // Check if owned by correct program
    if (!accountInfo.owner.equals(parameterStorageProgram)) {
      console.log('❌ ISSUE FOUND: Account is owned by WRONG program!');
      console.log('   Expected:', parameterStorageProgram.toBase58());
      console.log('   Actual:', accountInfo.owner.toBase58());
      console.log();
      console.log('🔧 SOLUTION:');
      console.log('   The account was initialized by a different program.');
      console.log('   You need to either:');
      console.log('   1. Use the correct Parameter Storage Program ID');
      console.log('   2. Re-initialize with the current program');
      console.log('   3. Update NEXT_PUBLIC_PARAMETER_STORAGE_ID in .env.local');
      return;
    }

    console.log('✅ Account is owned by CORRECT program!');
    console.log();
    console.log('🎉 GlobalParameters is properly configured!');
    console.log('   Proposals should work correctly.');
  } catch (error: any) {
    console.error('❌ Error checking account:', error.message);
  }
}

checkGlobalParameters().then(() => {
  console.log('\n✅ Diagnostic complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
