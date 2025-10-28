/**
 * Vote Aggregation Load Test: Concurrent Vote Processing
 *
 * Tests vote aggregation performance under high concurrency
 * Target: Aggregate 10,000 votes in <10s, handle 100+ votes/second during aggregation
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { defaultOptions, config } from '../k6-config.js';
import { generateVote, generateWalletAddress } from '../utils/test-data.js';

// Custom metrics
const voteSubmitTime = new Trend('vote_submit_duration_ms', true);
const aggregationTime = new Trend('vote_aggregation_duration_ms', true);
const voteSuccessRate = new Rate('vote_success');
const aggregationSuccessRate = new Rate('aggregation_success');
const votesProcessed = new Counter('votes_processed');

// Test configuration
export const options = {
  ...defaultOptions,
  scenarios: {
    vote_submission_phase: {
      executor: 'constant-arrival-rate',
      rate: 200,                    // 200 votes per second during submission
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    aggregation_phase: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 50,               // Each VU runs 50 aggregations
      startTime: '3m',              // Start after vote submission phase
    },
  },
  thresholds: {
    'vote_success': ['rate>0.99'],                   // >99% vote submission success
    'aggregation_success': ['rate>0.95'],            // >95% aggregation success
    'vote_aggregation_duration_ms': ['p95<10000'],   // 95th percentile <10 seconds
  },
};

export default function () {
  // Phase 1: Vote submission
  if (__SCENARIO.name === 'vote_submission_phase') {
    group('Vote Submission', function () {
      const proposalId = `proposal_${Math.floor(Math.random() * 20) + 1}`;
      const vote = generateVote(proposalId);

      const submitStart = Date.now();
      const submitResponse = http.post(
        `${config.baseUrl}/api/vote`,
        JSON.stringify(vote),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          tags: { name: 'vote_submit' },
          timeout: '5s',
        }
      );

      const submitDuration = Date.now() - submitStart;
      voteSubmitTime.add(submitDuration);
      votesProcessed.add(1);

      const submitSuccess = check(submitResponse, {
        'vote submitted successfully': (r) => r.status === 200 || r.status === 201,
        'vote has ID': (r) => r.json('voteId') || r.json('id'),
        'submission time <500ms': () => submitDuration < 500,
      });

      voteSuccessRate.add(submitSuccess);

      if (!submitSuccess) {
        console.log(`❌ Vote submission failed: ${submitResponse.status} - ${submitResponse.body}`);
      }
    });
  }

  // Phase 2: Vote aggregation
  if (__SCENARIO.name === 'aggregation_phase') {
    group('Vote Aggregation', function () {
      const proposalId = `proposal_${Math.floor(Math.random() * 20) + 1}`;

      // Trigger aggregation
      const aggregationStart = Date.now();
      const aggregationResponse = http.post(
        `${config.baseUrl}/api/votes/aggregate`,
        JSON.stringify({
          proposalId: proposalId,
          minVotes: 100,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          tags: { name: 'vote_aggregation' },
          timeout: '30s',
        }
      );

      const aggregationDuration = Date.now() - aggregationStart;
      aggregationTime.add(aggregationDuration);

      const aggregationSuccess = check(aggregationResponse, {
        'aggregation completed': (r) => r.status === 200,
        'result contains outcome': (r) => r.json('outcome') !== null,
        'result contains vote counts': (r) => r.json('yesCount') && r.json('noCount'),
        'aggregation time <10s': () => aggregationDuration < 10000,
        'all votes counted': (r) => {
          const result = r.json();
          return result.totalVotes === (result.yesCount + result.noCount);
        },
      });

      aggregationSuccessRate.add(aggregationSuccess);

      if (!aggregationSuccess) {
        console.log(`⚠️ Aggregation issue for ${proposalId}: ${aggregationResponse.body}`);
      }

      // Verify aggregation result accuracy
      if (aggregationSuccess) {
        sleep(0.1);

        const verifyResponse = http.get(
          `${config.baseUrl}/api/votes/result/${proposalId}`,
          {
            tags: { name: 'aggregation_verify' },
          }
        );

        check(verifyResponse, {
          'result persisted': (r) => r.status === 200,
          'result matches aggregation': (r) => {
            const aggregatedResult = aggregationResponse.json();
            const persistedResult = r.json();
            return (
              persistedResult.yesCount === aggregatedResult.yesCount &&
              persistedResult.noCount === aggregatedResult.noCount
            );
          },
        });
      }
    });
  }

  sleep(Math.random() * 0.5);
}

export function setup() {
  console.log('🚀 Starting Vote Aggregation Load Test');
  console.log(`Phase 1: Submit 12,000 votes at 200/second`);
  console.log(`Phase 2: Aggregate votes concurrently (target <10s per aggregation)`);
  console.log(`Target: >99% vote success, >95% aggregation success`);
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('✅ Vote Aggregation Load Test Complete');
  console.log(`Total votes submitted: ${votesProcessed.value}`);
  console.log(`Test started: ${data.startTime}`);
  console.log(`Test ended: ${new Date().toISOString()}`);
}
