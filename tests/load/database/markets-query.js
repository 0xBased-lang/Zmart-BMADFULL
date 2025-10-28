/**
 * Database Load Test: Markets Query
 *
 * Tests database performance with 1,000+ concurrent queries
 * Target: <100ms response time at 95th percentile
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultOptions, config, commonHeaders, customMetrics, checkDatabaseResponse } from '../k6-config.js';
import { generateQueryParams } from '../utils/test-data.js';

// Test configuration
export const options = {
  ...defaultOptions,
  thresholds: {
    'http_req_duration': ['p(95)<100', 'p(99)<200'],
    'http_req_failed': ['rate<0.01'],
    'database_query_time': ['p(95)<100'],
  },
};

// Test setup
export function setup() {
  console.log('='.repeat(80));
  console.log('Database Load Test: Markets Query');
  console.log('='.repeat(80));
  console.log(`Target: ${config.supabaseUrl}`);
  console.log(`Threshold: p95 < 100ms`);
  console.log('='.repeat(80));
}

// Main test function
export default function () {
  const params = generateQueryParams();

  // Query markets endpoint
  const url = `${config.supabaseUrl}/rest/v1/markets?limit=${params.limit}&offset=${params.offset}&status=eq.${params.status}&order=${params.sort}.${params.order}`;

  const response = http.get(url, {
    headers: commonHeaders,
    tags: { name: 'markets_query', type: 'database' },
  });

  // Check response
  const success = checkDatabaseResponse(response, 'Markets Query');

  // Record custom metrics
  customMetrics.databaseQueryTime.add(response.timings.duration);

  if (!success) {
    customMetrics.databaseErrors.add(1);
  }

  // Verify response structure
  if (response.status === 200) {
    try {
      const markets = JSON.parse(response.body);
      check(markets, {
        'is array': (m) => Array.isArray(m),
        'has items': (m) => m.length > 0,
        'items have required fields': (m) =>
          m.length === 0 || (m[0].market_id && m[0].title),
      });
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      customMetrics.databaseErrors.add(1);
    }
  }

  // Think time between requests
  sleep(0.5);
}

// Test teardown
export function teardown(data) {
  console.log('='.repeat(80));
  console.log('Database Load Test Complete');
  console.log('='.repeat(80));
}
