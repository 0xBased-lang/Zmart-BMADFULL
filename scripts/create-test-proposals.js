/**
 * Create Test Proposals for Devnet Testing
 * Populates proposals table with sample market creation proposals
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function createTestProposals() {
  console.log('🚀 Creating test proposals for devnet...\n')

  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const testProposals = [
    {
      proposal_id: 1001,
      proposer_wallet: '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA', // Devnet deployer
      proposal_type: 'create_market',
      title: 'Create Market: Will AI pass the Turing Test in 2025?',
      description: 'A prediction market to gauge community sentiment on whether an AI system will pass the Turing Test by the end of 2025.',
      market_question: 'Will any AI system pass the Turing Test by December 31, 2025?',
      market_description: 'This market resolves YES if a credible AI system passes the Turing Test (as judged by a panel of experts) before the end of 2025. The test must follow standard Turing Test protocols.',
      market_end_time: twoMonthsFromNow.toISOString(),
      status: 'active',
      voting_ends_at: oneWeekFromNow.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      proposal_id: 1002,
      proposer_wallet: '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA',
      proposal_type: 'create_market',
      title: 'Create Market: Will Ethereum complete the merge to PoS?',
      description: 'Prediction market for Ethereum\'s transition to Proof of Stake consensus.',
      market_question: 'Will Ethereum successfully complete the merge to Proof of Stake?',
      market_description: 'This market resolves YES when Ethereum mainnet successfully transitions to Proof of Stake consensus mechanism.',
      market_end_time: twoMonthsFromNow.toISOString(),
      status: 'pending',
      voting_ends_at: oneWeekFromNow.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      proposal_id: 1003,
      proposer_wallet: '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA',
      proposal_type: 'create_market',
      title: 'Create Market: SpaceX Mars Mission Success',
      description: 'Will SpaceX successfully land humans on Mars?',
      market_question: 'Will SpaceX land humans on Mars before 2030?',
      market_description: 'This market resolves YES if SpaceX successfully lands a crewed mission on Mars and safely returns astronauts to Earth before January 1, 2030.',
      market_end_time: twoMonthsFromNow.toISOString(),
      status: 'active',
      voting_ends_at: oneWeekFromNow.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      proposal_id: 1004,
      proposer_wallet: '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA',
      proposal_type: 'create_market',
      title: 'Create Market: Next US Presidential Election',
      description: 'Prediction market for the next US presidential election outcome.',
      market_question: 'Who will win the next US Presidential election?',
      market_description: 'This market will resolve based on the official results of the next United States presidential election.',
      market_end_time: twoMonthsFromNow.toISOString(),
      status: 'active',
      voting_ends_at: oneWeekFromNow.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      proposal_id: 1005,
      proposer_wallet: '4MkybTASDtmzQnfUWztHmfgyHgBREw74eTKipVADqQLA',
      proposal_type: 'create_market',
      title: 'Create Market: Global Climate Action',
      description: 'Will global carbon emissions decrease by 2025?',
      market_question: 'Will global carbon emissions decrease by 10% compared to 2020 levels by end of 2025?',
      market_description: 'This market resolves YES if verified data shows global carbon emissions have decreased by at least 10% compared to 2020 baseline by December 31, 2025.',
      market_end_time: twoMonthsFromNow.toISOString(),
      status: 'active',
      voting_ends_at: oneWeekFromNow.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ]

  console.log(`📝 Inserting ${testProposals.length} test proposals...\n`)

  for (const proposal of testProposals) {
    console.log(`  Creating: ${proposal.title}`)
    console.log(`    - Proposal ID: ${proposal.proposal_id}`)
    console.log(`    - Status: ${proposal.status}`)
    console.log(`    - Type: ${proposal.proposal_type}`)

    const { data, error } = await supabase
      .from('proposals')
      .insert(proposal)
      .select()
      .single()

    if (error) {
      console.error(`    ❌ Error: ${error.message}`)
    } else {
      console.log(`    ✅ Created successfully (ID: ${data.id})`)
    }
    console.log('')
  }

  // Verify count
  const { count, error: countError } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error counting proposals:', countError)
  } else {
    console.log(`\n✅ Total proposals in database: ${count}`)
  }

  console.log('\n🎉 Test proposals created successfully!')
  console.log('\n📍 Next steps:')
  console.log('  1. Visit http://localhost:3000/proposals')
  console.log('  2. View and vote on proposals')
  console.log('  3. Once approved, markets will be created')
}

createTestProposals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
