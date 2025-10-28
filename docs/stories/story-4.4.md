# Story 4.4: Implement Load Testing and Performance Benchmarking

Status: Framework Complete - Awaiting Infrastructure Deployment

## Story

As a platform operator,
I want to validate the system performs well under load,
So that we can handle 1,000+ concurrent users.

## Acceptance Criteria

1. Load testing suite using k6 or Artillery
2. Database load test: 1,000+ concurrent queries, verify <100ms response times
3. Transaction throughput test: simulate 100 bets/minute, measure success rate (target >99%)
4. Real-time subscription test: 500+ concurrent WebSocket connections, measure update latency
5. Event listener stress test: 1,000 events/minute, verify sync accuracy and latency
6. Vote aggregation test: aggregate 10,000 votes, measure processing time (target <10s)
7. Performance benchmarks documented with baseline metrics
8. Bottlenecks identified and optimized (indexing, caching, query optimization)

## Tasks / Subtasks

- [x] Task 1: Set Up Load Testing Infrastructure (AC: #1)
  - [x] Install and configure k6 for load testing
  - [x] Create load testing script templates for each component
  - [x] Set up test data generation scripts
  - [x] Configure test environments (staging/devnet)
  - [x] Set up performance metrics collection and visualization

- [ ] Task 2: Database Load Testing (AC: #2)
  - [ ] Create Supabase query load test scenarios
  - [ ] Test: 1,000+ concurrent SELECT queries on markets table
  - [ ] Test: Concurrent INSERT operations (bet placement simulation)
  - [ ] Test: Complex JOIN queries (user dashboard data)
  - [ ] Measure query response times (<100ms target)
  - [ ] Identify slow queries and create indexes

- [ ] Task 3: Transaction Throughput Testing (AC: #3)
  - [ ] Simulate 100 bets/minute on Solana devnet
  - [ ] Measure transaction success rate (>99% target)
  - [ ] Test concurrent market creation transactions
  - [ ] Test vote submission throughput
  - [ ] Measure transaction confirmation times
  - [ ] Document RPC endpoint performance

- [ ] Task 4: WebSocket Real-Time Subscription Testing (AC: #4)
  - [ ] Test 500+ concurrent WebSocket connections
  - [ ] Measure real-time update latency (market odds changes)
  - [ ] Test subscription scalability (adding/removing clients)
  - [ ] Verify message delivery reliability
  - [ ] Test reconnection handling under load
  - [ ] Document WebSocket server performance limits

- [ ] Task 5: Event Listener Stress Testing (AC: #5)
  - [ ] Simulate 1,000 Solana events/minute
  - [ ] Measure event processing latency
  - [ ] Verify sync accuracy (events → database consistency)
  - [ ] Test event queue handling under backlog
  - [ ] Measure database write throughput
  - [ ] Identify and fix event processing bottlenecks

- [ ] Task 6: Vote Aggregation Performance Testing (AC: #6)
  - [ ] Test aggregating 10,000 votes for proposal resolution
  - [ ] Measure processing time (<10s target)
  - [ ] Test vote aggregation for market resolution
  - [ ] Optimize aggregation algorithms if needed
  - [ ] Test concurrent vote submissions during aggregation
  - [ ] Document vote processing limits

- [ ] Task 7: Performance Benchmarking and Documentation (AC: #7)
  - [ ] Run full load test suite on staging environment
  - [ ] Document baseline performance metrics for all components
  - [ ] Create performance benchmark report with graphs
  - [ ] Set up continuous performance monitoring
  - [ ] Define performance SLAs and alerting thresholds

- [ ] Task 8: Bottleneck Identification and Optimization (AC: #8)
  - [ ] Analyze load test results to identify bottlenecks
  - [ ] Database optimization: add missing indexes, optimize queries
  - [ ] Implement caching layer (Redis/in-memory) where beneficial
  - [ ] Optimize event listener batch processing
  - [ ] Frontend optimization: lazy loading, code splitting
  - [ ] Re-run load tests to verify optimizations
  - [ ] Document all performance improvements

## Dev Notes

### Testing Strategy

**Load Testing Tool: k6**
- Modern, scriptable load testing tool with JavaScript API
- Better Solana/Web3 support than Artillery
- Built-in metrics visualization and thresholds
- Can run distributed load tests if needed

**Test Organization:**
```
tests/load/
  ├── k6-config.js           # k6 configuration and thresholds
  ├── database/
  │   ├── markets-query.js   # Market listing queries
  │   ├── bets-insert.js     # Concurrent bet insertions
  │   └── dashboard.js       # Complex JOIN queries
  ├── blockchain/
  │   ├── place-bets.js      # Transaction throughput test
  │   ├── create-markets.js  # Market creation load
  │   └── vote-submission.js # Voting throughput
  ├── realtime/
  │   ├── websocket-load.js  # WebSocket connection scaling
  │   └── subscription.js    # Real-time update latency
  ├── eventlistener/
  │   ├── event-stress.js    # Event processing under load
  │   └── sync-accuracy.js   # Database consistency checks
  └── utils/
      ├── test-data.js       # Test data generators
      └── metrics.js         # Custom metrics collection
```

### Performance Targets

**Database Performance:**
- Query response time: <100ms (95th percentile)
- Concurrent queries: 1,000+ simultaneous
- Write throughput: 500+ inserts/second
- Read throughput: 5,000+ queries/second

**Blockchain Performance:**
- Transaction success rate: >99%
- Transaction throughput: 100+ transactions/minute
- Confirmation time: <5 seconds average
- RPC endpoint availability: >99.9%

**Real-Time Performance:**
- WebSocket connections: 500+ concurrent
- Update latency: <200ms end-to-end
- Message delivery: 100% reliability
- Connection stability: >99% uptime

**Event Listener Performance:**
- Event processing rate: 1,000+ events/minute
- Processing latency: <1 second average
- Sync accuracy: 100% consistency
- Backlog recovery: <5 minutes for 1,000 event backlog

**Vote Aggregation:**
- Processing time: <10 seconds for 10,000 votes
- Concurrent submissions: Handle 100+ votes/second during aggregation
- Result accuracy: 100% mathematical correctness

### Key Load Test Scenarios

**Scenario 1: Peak User Load (1,000 concurrent users)**
- 500 users browsing markets
- 300 users placing bets
- 150 users voting on proposals/resolutions
- 50 users creating markets/proposals

**Scenario 2: Event Flood (Major Market Resolution)**
- 10,000 votes cast in 10-minute window
- 5,000+ bet claims after resolution
- Real-time updates to all subscribed clients
- Database updates for all affected records

**Scenario 3: Market Creation Spike**
- 50 proposal approvals simultaneously
- 50 markets created within 5 minutes
- Event listener processing market creation events
- Frontend updates reflecting new markets

**Scenario 4: Sustained Load (Typical Day)**
- 100 users active continuously for 1 hour
- 50 bets/minute sustained
- 20 votes/minute on active proposals
- 5 new markets/hour

### Performance Monitoring Stack

**k6 Dashboard:**
- Real-time metrics during load tests
- HTTP requests, response times, error rates
- Custom metrics for blockchain transactions

**Grafana + Prometheus:**
- Long-term performance monitoring
- Database query performance
- Event listener throughput
- API endpoint latency

**Supabase Dashboard:**
- Database connection pool usage
- Query performance insights
- Real-time subscription metrics

**Solana Explorer:**
- Transaction success rates
- Network congestion impact
- Program execution metrics

### Optimization Strategies

**Database Optimization:**
1. Add indexes on frequently queried columns (market_id, user_id, status)
2. Implement materialized views for complex dashboard queries
3. Use database connection pooling (already configured in Supabase)
4. Consider read replicas for heavy read workloads
5. Optimize JOIN queries with proper indexing

**Caching Strategy:**
1. In-memory cache for static data (parameters, market metadata)
2. Redis cache for frequently accessed data (leaderboard, active markets)
3. Client-side caching with SWR (stale-while-revalidate)
4. Edge caching for static assets (CDN)

**Event Listener Optimization:**
1. Batch database writes (insert multiple events per transaction)
2. Parallel event processing for independent events
3. Implement event queue with priority handling
4. Use database COPY for bulk inserts
5. Implement circuit breaker for database overload

**Frontend Optimization:**
1. Code splitting and lazy loading
2. Image optimization and lazy loading
3. Virtual scrolling for long lists
4. Debounce real-time updates
5. Service worker for offline capability

### Integration with Previous Stories

**Dependencies on Story 4.1-4.3:**
- Unit and integration tests provide baseline for regression testing
- E2E tests validate functionality remains correct after optimization
- Load tests build on existing test infrastructure

**Testing Infrastructure from Story 4.1-4.3:**
- Anchor test framework for blockchain tests
- Playwright for E2E validation
- Test data generation utilities

### Alignment with Architecture

**Architecture Performance Requirements:**
- System must handle 1,000+ concurrent users (validated by load tests)
- Database queries <100ms response time (measured by load tests)
- Real-time updates with minimal latency (WebSocket load tests)
- Scalable event processing (event listener stress tests)

**Technology Stack from Architecture:**
- k6 for load testing (modern, scriptable)
- Supabase PostgreSQL (performance metrics available)
- Next.js frontend (performance profiling tools)
- Solana blockchain (RPC endpoint performance)

### Performance Test Execution

**Running Load Tests:**
```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Run database load tests
k6 run tests/load/database/markets-query.js

# Run blockchain throughput tests
k6 run tests/load/blockchain/place-bets.js

# Run WebSocket load tests
k6 run tests/load/realtime/websocket-load.js

# Run full load test suite
./scripts/run-load-tests.sh

# Generate performance report
./scripts/generate-perf-report.sh
```

**Performance Baselines:**
- Establish baseline metrics on clean test environment
- Re-run after each optimization to measure improvement
- Track performance trends over time
- Alert on performance regressions

### Expected Bottlenecks and Mitigations

**Potential Bottleneck 1: Database Queries**
- Symptom: Slow market listing, dashboard loading
- Mitigation: Add indexes, optimize queries, implement caching
- Target: <100ms for 95% of queries

**Potential Bottleneck 2: Event Listener Processing**
- Symptom: Delayed database updates, sync lag
- Mitigation: Batch writes, parallel processing, queue optimization
- Target: Process 1,000 events/minute with <1s latency

**Potential Bottleneck 3: WebSocket Scalability**
- Symptom: Connection drops, delayed updates
- Mitigation: Horizontal scaling, connection pooling, message batching
- Target: Support 500+ concurrent connections

**Potential Bottleneck 4: RPC Endpoint Rate Limits**
- Symptom: Transaction failures, timeouts
- Mitigation: Multiple RPC endpoints, request throttling, retry logic
- Target: >99% transaction success rate

### References

- [Source: docs/epics.md#Story-4.4] - Acceptance criteria and user story
- [Source: docs/PRD.md] - Performance requirements and user experience expectations
- [Source: docs/architecture.md] - System architecture and scalability requirements
- [Source: Story 4.1-4.3] - Test infrastructure and baseline functionality
- [External: k6.io] - Load testing tool documentation
- [External: Supabase Performance] - Database optimization guidance

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.4.xml (generated 2025-10-28)

### Agent Model Used

Claude Code - claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

**Task 1 Implementation Complete (2025-10-28):**

Successfully implemented comprehensive k6 load testing framework:

**Infrastructure Created:**
1. `tests/load/README.md` - Complete installation and usage documentation
2. `tests/load/k6-config.js` - Shared configuration with 4 test profiles (default, high-load, soak, spike)
3. `tests/load/utils/test-data.js` - Test data generators for all entities
4. `tests/load/database/markets-query.js` - Sample database load test
5. `tests/load/run-all-tests.sh` - Test suite runner script

**Features Implemented:**
- k6 installation documentation for macOS, Linux, Windows, Docker
- Performance thresholds: p95 < 100ms, success rate > 99%
- Custom metrics for database, blockchain, WebSocket, event processing
- Test data generators: markets, bets, votes, proposals, users, events
- Multiple test profiles for different scenarios
- CI/CD integration examples
- Results collection and reporting framework

**Remaining Tasks (Tasks 2-8) - Implementation Framework:**

The infrastructure is now ready for implementing the actual load tests. Each remaining task follows this pattern:

1. Create k6 test script in appropriate directory
2. Use shared config and test data generators
3. Define component-specific thresholds
4. Implement test scenarios from Dev Notes
5. Run tests and document results

**Example implementations needed:**
- `tests/load/database/bets-insert.js` - Concurrent INSERT load test
- `tests/load/blockchain/place-bets.js` - Transaction throughput test
- `tests/load/realtime/websocket-load.js` - WebSocket scaling test
- `tests/load/eventlistener/event-stress.js` - Event processing stress test

**Note on Actual Testing:**
Actual load test execution requires:
- Deployed Supabase database (staging environment)
- Solana devnet with deployed programs
- WebSocket server for real-time subscriptions
- Event listener infrastructure running

The framework is complete and ready for test implementation when infrastructure is deployed.

### File List

**Load Testing Infrastructure:**
- tests/load/README.md (new)
- tests/load/k6-config.js (new)
- tests/load/run-all-tests.sh (new, executable)
- tests/load/utils/test-data.js (new)
- tests/load/database/markets-query.js (new)
- tests/load/database/ (directory created)
- tests/load/blockchain/ (directory created)
- tests/load/realtime/ (directory created)
- tests/load/eventlistener/ (directory created)
- tests/load/utils/ (directory created)

**Story Documentation:**
- docs/stories/story-4.4.md (modified - Task 1 complete)
- docs/stories/story-context-4.4.xml (exists)
- docs/sprint-status.yaml (modified - in-progress)
