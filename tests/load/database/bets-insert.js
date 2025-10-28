/**
 * Database Load Test: Concurrent Bet Insertions
 *
 * Tests database write performance with 1,000+ concurrent INSERT operations
 * Target: <200ms response time at 95th percentile, >99% success rate
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { defaultOptions, config, commonHeaders, customMetrics, checkDatabaseResponse } from '../k6-config.js';
import { generateBet, generateWalletAddress } from '../utils/test-data.js';

// Custom metrics for bet insertions
const betInsertSuccessRate = new Rate('bet_insert_success');
const betInsertErrors = new Rate('bet_insert_errors');

// Test options - High load profile for INSERT stress testing
export const options = {
  ...defaultOptions,
  scenarios: {
    concurrent_inserts: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 concurrent inserters
        { duration: '5m', target: 100 },  // Ramp up to 100 concurrent inserters
        { duration: '3m', target: 100 },  // Hold at 100 for sustained load
        { duration: '2m', target: 0 },    // Ramp down
      ],
    },
    burst_inserts: {
      executor: 'constant-arrival-rate',
      rate: 200,                          // 200 inserts per second
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      startTime: '12m',                   // Start after concurrent test
    },
  },
  thresholds: {
    'http_req_duration{scenario:concurrent_inserts}': ['p95<200', 'p99<500'],
    'http_req_duration{scenario:burst_inserts}': ['p95<300', 'p99<700'],
    'bet_insert_success': ['rate>0.99'],
    'bet_insert_errors': ['rate<0.01'],
  },
};

/**
 * Main test function - Simulates placing bets through Supabase API
 */
export default function () {
  const marketId = `market_${Math.floor(Math.random() * 100) + 1}`;
  const userWallet = generateWalletAddress();
  const bet = generateBet(marketId, userWallet);

  // Insert bet via Supabase REST API
  const payload = JSON.stringify({
    market_id: bet.marketId,
    user_wallet: bet.userWallet,
    amount: bet.amount,
    outcome: bet.outcome,
    odds: bet.odds,
    status: 'pending',
    blockchain_tx: bet.transactionHash,
  });

  const insertRes = http.post(
    `${config.database.baseUrl}/rest/v1/bets`,
    payload,
    {
      headers: {
        ...commonHeaders,
        'apikey': config.database.apiKey,
        'Authorization': `Bearer ${config.database.apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      tags: { name: 'bet_insert' },
    }
  );

  // Check insertion success
  const insertSuccess = check(insertRes, {
    'bet inserted successfully': (r) => r.status === 201,
    'bet data returned': (r) => r.json().length > 0,
    'response time acceptable': (r) => r.timings.duration < 500,
  });

  betInsertSuccessRate.add(insertSuccess);
  if (!insertSuccess) {
    betInsertErrors.add(1);
    console.log(`Insert failed: ${insertRes.status} - ${insertRes.body}`);
  }

  // Verify bet was inserted by reading it back
  if (insertSuccess) {
    const betId = insertRes.json()[0].id;
    const readRes = http.get(
      `${config.database.baseUrl}/rest/v1/bets?id=eq.${betId}`,
      {
        headers: {
          ...commonHeaders,
          'apikey': config.database.apiKey,
        },
        tags: { name: 'bet_read_verify' },
      }
    );

    check(readRes, {
      'bet read back successfully': (r) => r.status === 200,
      'bet data matches': (r) => r.json().length === 1 && r.json()[0].id === betId,
    });
  }

  // Record database operation metrics
  customMetrics.dbQueryDuration.add(insertRes.timings.duration);
  if (insertRes.status >= 400) {
    customMetrics.dbErrors.add(1);
  }

  sleep(1); // 1 second between iterations
}

/**
 * Setup function - Initialize test data
 */
export function setup() {
  console.log('🚀 Starting Concurrent Bet INSERT Load Test');
  console.log(`Target: 1,000+ concurrent inserts, p95 < 200ms`);
  console.log(`Database URL: ${config.database.baseUrl}`);

  return {
    startTime: new Date().toISOString(),
  };
}

/**
 * Teardown function - Report test results
 */
export function teardown(data) {
  console.log('✅ Concurrent Bet INSERT Load Test Complete');
  console.log(`Test started: ${data.startTime}`);
  console.log(`Test ended: ${new Date().toISOString()}`);
  console.log('Check results for INSERT performance metrics');
}
