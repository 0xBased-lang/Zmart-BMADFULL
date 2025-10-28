/**
 * Event Listener Load Test: Stress Testing Event Processing
 *
 * Tests event listener throughput and database sync accuracy
 * Target: 1,000 events/minute, <1s processing latency, 100% sync accuracy
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { defaultOptions, config } from '../k6-config.js';
import { generateEvent } from '../utils/test-data.js';

// Custom metrics
const eventProcessingTime = new Trend('event_processing_ms', true);
const eventSuccessRate = new Rate('event_success');
const eventThroughput = new Counter('events_processed');
const syncAccuracyRate = new Rate('sync_accuracy');

// Test configuration
export const options = {
  ...defaultOptions,
  scenarios: {
    event_sustained: {
      executor: 'constant-arrival-rate',
      rate: 1000,                   // 1,000 events per second (60,000 per minute)
      duration: '3m',
      preAllocatedVUs: 100,
      maxVUs: 300,
    },
    event_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 500,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 2000 },   // Burst to 2,000 events/s
        { duration: '2m', target: 2000 },   // Hold at peak
        { duration: '1m', target: 500 },    // Ramp down
      ],
      preAllocatedVUs: 150,
      maxVUs: 400,
      startTime: '4m',
    },
  },
  thresholds: {
    'event_success': ['rate>0.99'],              // >99% event processing success
    'event_processing_ms': ['p95<1000'],         // 95th percentile <1s
    'sync_accuracy': ['rate>0.99'],              // >99% database sync accuracy
  },
};

export default function () {
  const eventType = ['MarketCreated', 'BetPlaced', 'VoteCast', 'ResolutionSubmitted'][
    Math.floor(Math.random() * 4)
  ];

  const event = generateEvent(eventType);

  // Submit event to listener API
  const startTime = Date.now();

  group('Event Processing', function () {
    const submitResponse = http.post(
      `${config.baseUrl}/api/events/process`,
      JSON.stringify(event),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { name: 'event_submit' },
        timeout: '10s',
      }
    );

    const processingTime = Date.now() - startTime;
    eventProcessingTime.add(processingTime);
    eventThroughput.add(1);

    // Check processing success
    const success = check(submitResponse, {
      'event processed successfully': (r) => r.status === 200 || r.status === 201,
      'processing time <1s': () => processingTime < 1000,
      'no processing errors': (r) => !r.json('error'),
    });

    eventSuccessRate.add(success);

    if (success) {
      sleep(0.01); // Small delay before verification

      // Verify database sync - check that the event was reflected in the database
      const verifyResponse = http.get(
        `${config.baseUrl}/api/events/${event.transactionHash}`,
        {
          tags: { name: 'event_verify_sync' },
        }
      );

      const syncAccurate = check(verifyResponse, {
        'event exists in database': (r) => r.status === 200,
        'event data matches': (r) => {
          const dbEvent = r.json('event');
          return (
            dbEvent.type === event.type &&
            dbEvent.transactionHash === event.transactionHash
          );
        },
        'sync confirmed': (r) => r.json('synced') === true,
      });

      syncAccuracyRate.add(syncAccurate);

      if (!syncAccurate) {
        console.log(`⚠️ Sync mismatch for event ${event.transactionHash}: ${verifyResponse.body}`);
      }
    }
  });

  sleep(Math.random() * 0.05); // Random minimal think time
}

export function setup() {
  console.log('🚀 Starting Event Listener Stress Test');
  console.log(`Target: 1,000+ events/minute, p95 processing <1s, 100% sync accuracy`);
  console.log(`Event Processor URL: ${config.baseUrl}/api/events/process`);
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('✅ Event Listener Stress Test Complete');
  console.log(`Total events processed: ${eventThroughput.value}`);
  console.log(`Test duration: ${new Date().toISOString() - data.startTime}`);
}
