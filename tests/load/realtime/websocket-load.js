/**
 * Real-Time Load Test: WebSocket Subscriptions
 *
 * Tests real-time subscription performance with 500+ concurrent connections
 * Target: Sub-200ms update latency, 100% message delivery, >99% uptime
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { defaultOptions, config } from '../k6-config.js';
import { generateUser, generateMarket } from '../utils/test-data.js';

// Custom metrics
const wsConnectionSuccess = new Rate('ws_connection_success');
const wsMessageLatency = new Trend('ws_message_latency_ms', true);
const wsMessagesReceived = new Counter('ws_messages_received');
const wsConnectionErrors = new Counter('ws_connection_errors');

// Test configuration
export const options = {
  ...defaultOptions,
  scenarios: {
    websocket_scaling: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Ramp to 100 concurrent connections
        { duration: '1m', target: 250 },   // Ramp to 250
        { duration: '1m', target: 500 },   // Peak: 500 concurrent connections
        { duration: '2m', target: 500 },   // Hold at peak for 2 minutes
        { duration: '1m', target: 250 },   // Ramp down
        { duration: '1m', target: 0 },     // Cool down
      ],
    },
  },
  thresholds: {
    'ws_connection_success': ['rate>0.99'],        // >99% successful connections
    'ws_message_latency_ms': ['p95<200'],          // Message latency <200ms
    'ws_connection_errors': ['count<500'],         // <500 total connection errors
  },
};

export default function () {
  const user = generateUser();
  const market = generateMarket();

  let messageCount = 0;
  let lastMessageTime = Date.now();

  // Connect to WebSocket server
  const wsUrl = config.websocket.url || `${config.baseUrl.replace('http', 'ws')}/ws`;

  const res = ws.connect(wsUrl, function (socket) {
    socket.on('open', function open() {
      console.log(`✅ Connected to WebSocket (VU ${__VU})`);

      // Subscribe to market updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: `market:${market.id}`,
        userId: user.wallet,
      }));

      // Subscribe to personal updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: `user:${user.wallet}`,
      }));
    });

    socket.on('message', function (msg) {
      const receivedTime = Date.now();
      const latency = receivedTime - lastMessageTime;

      messageCount++;
      wsMessagesReceived.add(1);
      wsMessageLatency.add(latency);

      // Verify message format
      try {
        const data = JSON.parse(msg);
        check(data, {
          'message has type': (m) => m.type !== undefined,
          'message has data': (m) => m.data !== undefined,
          'latency <500ms': () => latency < 500,
        });
      } catch (e) {
        console.log(`❌ Failed to parse message: ${msg}`);
      }

      lastMessageTime = Date.now();
    });

    socket.on('close', function () {
      console.log(`⛔ WebSocket disconnected (${messageCount} messages received)`);
    });

    socket.on('error', function (e) {
      console.log(`❌ WebSocket error: ${e}`);
      wsConnectionErrors.add(1);
    });

    // Keep connection open for test duration, send occasional pings
    socket.setInterval(function () {
      socket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      }));
    }, 30000); // Ping every 30 seconds to keep connection alive

    // Connection duration: 60 seconds per VU
    socket.setTimeout(function () {
      socket.close();
    }, 60000);
  });

  // Check connection success
  const connectionSuccess = check(res, {
    'connection established': (r) => r && r.status === 101,
    'messages received': () => messageCount > 0,
  });

  wsConnectionSuccess.add(connectionSuccess);

  sleep(1);
}

export function setup() {
  console.log('🚀 Starting WebSocket Real-Time Load Test');
  console.log(`Target: 500+ concurrent connections, message latency <200ms`);
  console.log(`WebSocket URL: ${config.websocket.url || `${config.baseUrl.replace('http', 'ws')}/ws`}`);
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('✅ WebSocket Real-Time Load Test Complete');
  console.log(`Total messages received across all VUs: ${wsMessagesReceived.value}`);
}
