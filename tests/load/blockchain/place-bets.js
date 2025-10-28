/**
 * Blockchain Load Test: Transaction Throughput
 *
 * Tests Solana transaction throughput for bet placement
 * Target: 100+ bets/minute, >99% success rate, <5s confirmation time
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { defaultOptions, config } from '../k6-config.js';
import { generateTransaction, generateSignature } from '../utils/test-data.js';

// Custom metrics
const txSuccessRate = new Rate('blockchain_tx_success');
const txConfirmationTime = new Trend('blockchain_confirmation_ms', true);
const txThroughput = new Counter('blockchain_tx_count');

// Test configuration
export const options = {
  ...defaultOptions,
  scenarios: {
    sustained_throughput: {
      executor: 'constant-arrival-rate',
      rate: 100,                    // 100 transactions per second (6,000 per minute)
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    burst_throughput: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 500 },   // Ramp up to 500 tx/s
        { duration: '2m', target: 500 },   // Hold at peak
        { duration: '1m', target: 100 },   // Ramp down
      ],
      preAllocatedVUs: 100,
      maxVUs: 500,
      startTime: '6m',
    },
  },
  thresholds: {
    'blockchain_tx_success': ['rate>0.99'],              // >99% success rate
    'blockchain_confirmation_ms': ['p95<5000'],         // 95th percentile <5 seconds
    'http_req_duration': ['p95<3000', 'p99<10000'],     // HTTP request times
  },
};

export default function () {
  // Generate Solana transaction
  const marketId = `market_${Math.floor(Math.random() * 100) + 1}`;
  const tx = generateTransaction('place_bet', {
    market: marketId,
    amount: Math.floor(Math.random() * 5000) + 100,   // 100-5100 lamports
    outcome: Math.random() > 0.5 ? 'YES' : 'NO',
  });

  const signature = generateSignature();

  // Submit transaction to RPC endpoint
  const startTime = Date.now();
  const submitResponse = http.post(
    `${config.blockchain.rpcUrl}`,
    JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random(),
      method: 'sendTransaction',
      params: [tx.serialized],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'blockchain_submit_tx' },
      timeout: '30s',
    }
  );

  const submitDuration = Date.now() - startTime;
  txThroughput.add(1);

  // Check submission success
  const txHash = submitResponse.json('result');
  const submitSuccess = check(submitResponse, {
    'transaction submitted successfully': (r) => r.status === 200 && r.json('result'),
    'no RPC errors': (r) => !r.json('error'),
    'submission time <3s': () => submitDuration < 3000,
  });

  txSuccessRate.add(submitSuccess);

  if (submitSuccess) {
    // Poll for confirmation
    const maxWaitTime = 30000; // 30 seconds max
    let confirmed = false;
    let confirmationTime = 0;

    const confirmStartTime = Date.now();

    // Check confirmation status (simplified - in production would use proper polling)
    for (let attempt = 0; attempt < 60; attempt++) {
      sleep(0.5); // Check every 500ms

      const confirmResponse = http.post(
        `${config.blockchain.rpcUrl}`,
        JSON.stringify({
          jsonrpc: '2.0',
          id: Math.random(),
          method: 'getSignatureStatus',
          params: [[txHash]],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          tags: { name: 'blockchain_check_status' },
        }
      );

      const status = confirmResponse.json('result[0].confirmationStatus');

      if (status === 'finalized' || status === 'confirmed') {
        confirmed = true;
        confirmationTime = Date.now() - confirmStartTime;
        break;
      }

      const elapsed = Date.now() - confirmStartTime;
      if (elapsed > maxWaitTime) {
        console.log(`⏱️ Transaction ${txHash.substring(0, 8)} confirmation timeout`);
        break;
      }
    }

    check(confirmResponse, {
      'transaction confirmed': () => confirmed,
      'confirmation time <5s': () => confirmationTime < 5000,
      'confirmation time recorded': () => confirmationTime > 0,
    });

    if (confirmed) {
      txConfirmationTime.add(confirmationTime);
    }
  }

  // Small random think time
  sleep(Math.random() * 0.2);
}

export function setup() {
  console.log('🚀 Starting Blockchain Transaction Throughput Load Test');
  console.log(`Target: 100+ transactions/minute, p95 confirmation <5s`);
  console.log(`RPC Endpoint: ${config.blockchain.rpcUrl}`);
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('✅ Blockchain Transaction Load Test Complete');
  console.log(`Test duration: ${new Date().toISOString() - data.startTime}`);
}
