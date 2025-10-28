/**
 * Shared k6 Configuration for BMAD-Zmart Load Tests
 *
 * This file contains common configuration options, thresholds,
 * and utility functions used across all load tests.
 */

// Default test options
export const defaultOptions = {
  // Ramping VU schedule
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users
    { duration: '1m', target: 50 },   // Ramp to 50 users
    { duration: '3m', target: 100 },  // Hold at 100 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],

  // Performance thresholds (test fails if exceeded)
  thresholds: {
    // 95% of requests must complete within 100ms
    'http_req_duration': ['p(95)<100'],

    // 99% of requests must complete within 500ms
    'http_req_duration{type:api}': ['p(99)<500'],

    // Error rate must be less than 1%
    'http_req_failed': ['rate<0.01'],

    // Request rate should be at least 10/s
    'http_reqs': ['rate>10'],
  },

  // Tags for filtering metrics
  tags: {
    project: 'bmad-zmart',
    environment: 'staging',
  },
};

// High-load test options (for stress testing)
export const highLoadOptions = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Soak test options (sustained load)
export const soakTestOptions = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '1h', target: 100 },  // Sustained for 1 hour
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'http_req_failed': ['rate<0.01'],
  },
};

// Spike test options (sudden load increase)
export const spikeTestOptions = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 1000 },  // Sudden spike
    { duration: '3m', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.10'],  // Allow higher error rate during spike
  },
};

// Environment configuration
export const config = {
  // Supabase
  supabaseUrl: __ENV.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: __ENV.SUPABASE_ANON_KEY || 'your-anon-key',

  // Solana
  solanaRpcUrl: __ENV.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  solanaProgramId: __ENV.SOLANA_PROGRAM_ID || 'YourProgramId',

  // WebSocket
  wsUrl: __ENV.WS_URL || 'wss://your-project.supabase.co/realtime/v1',

  // Test configuration
  testDuration: __ENV.TEST_DURATION || '5m',
  virtualUsers: parseInt(__ENV.VIRTUAL_USERS) || 100,
  rampUpTime: __ENV.RAMP_UP_TIME || '30s',
};

// Custom metric constructors
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

export const customMetrics = {
  // Database metrics
  databaseQueryTime: new Trend('database_query_time', true),
  databaseErrors: new Counter('database_errors'),

  // Blockchain metrics
  transactionSuccessRate: new Rate('transaction_success_rate'),
  transactionConfirmTime: new Trend('transaction_confirm_time', true),
  transactionErrors: new Counter('transaction_errors'),

  // WebSocket metrics
  websocketLatency: new Trend('websocket_latency', true),
  websocketConnections: new Gauge('websocket_connections'),
  websocketErrors: new Counter('websocket_errors'),

  // Event listener metrics
  eventProcessingTime: new Trend('event_processing_time', true),
  eventSyncErrors: new Counter('event_sync_errors'),
};

// Common HTTP headers
export const commonHeaders = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseKey,
  'Authorization': `Bearer ${config.supabaseKey}`,
};

// Request timeout
export const requestTimeout = '30s';

// Sleep durations (in seconds)
export const sleepDurations = {
  short: 0.5,
  medium: 1,
  long: 2,
};

// Batch sizes
export const batchSizes = {
  small: 10,
  medium: 50,
  large: 100,
};

// Helper functions
export function logError(error, context) {
  console.error(`[${context}] Error: ${error.message}`);
}

export function logMetric(name, value) {
  console.log(`[METRIC] ${name}: ${value}`);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Check functions for assertions
import { check } from 'k6';

export function checkResponse(response, name) {
  return check(response, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: response time < 100ms`]: (r) => r.timings.duration < 100,
    [`${name}: has body`]: (r) => r.body.length > 0,
  });
}

export function checkDatabaseResponse(response, name) {
  const checks = checkResponse(response, name);

  // Additional database-specific checks
  check(response, {
    [`${name}: valid JSON`]: (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  });

  return checks;
}

export function checkTransactionResponse(response, name) {
  return check(response, {
    [`${name}: transaction succeeded`]: (r) => r.status === 200,
    [`${name}: has signature`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.signature && body.signature.length > 0;
      } catch (e) {
        return false;
      }
    },
  });
}

// Test lifecycle hooks
export function setupTest() {
  console.log('='.repeat(80));
  console.log('BMAD-Zmart Load Test Starting');
  console.log('='.repeat(80));
  console.log(`Environment: ${config.supabaseUrl}`);
  console.log(`Virtual Users: ${config.virtualUsers}`);
  console.log(`Duration: ${config.testDuration}`);
  console.log('='.repeat(80));
}

export function teardownTest() {
  console.log('='.repeat(80));
  console.log('BMAD-Zmart Load Test Complete');
  console.log('='.repeat(80));
}

// Export all for convenience
export default {
  defaultOptions,
  highLoadOptions,
  soakTestOptions,
  spikeTestOptions,
  config,
  customMetrics,
  commonHeaders,
  requestTimeout,
  sleepDurations,
  batchSizes,
  logError,
  logMetric,
  randomInt,
  randomElement,
  checkResponse,
  checkDatabaseResponse,
  checkTransactionResponse,
  setupTest,
  teardownTest,
};
