# BMAD-Zmart Load Testing Suite

Comprehensive load testing and performance benchmarking suite using k6.

## Installation

### macOS
```bash
brew install k6
```

### Linux
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```bash
choco install k6
```

### Docker
```bash
docker pull grafana/k6:latest
```

## Quick Start

1. **Install k6** (see above)

2. **Configure environment variables**:
```bash
cp .env.example .env.load-test
# Edit .env.load-test with your test environment settings
```

3. **Run a simple test**:
```bash
k6 run tests/load/database/markets-query.js
```

4. **Run with custom options**:
```bash
k6 run --vus 100 --duration 5m tests/load/database/markets-query.js
```

5. **Run full test suite**:
```bash
./tests/load/run-all-tests.sh
```

## Test Organization

```
tests/load/
├── README.md              # This file
├── k6-config.js          # Shared k6 configuration
├── run-all-tests.sh      # Script to run full test suite
├── database/             # Database load tests
│   ├── markets-query.js  # Market listing queries
│   ├── bets-insert.js    # Bet insertion load
│   └── dashboard.js      # Complex JOIN queries
├── blockchain/           # Blockchain transaction tests
│   ├── place-bets.js     # Bet transaction throughput
│   ├── create-markets.js # Market creation load
│   └── vote-submission.js # Voting throughput
├── realtime/             # WebSocket tests
│   ├── websocket-load.js # Connection scaling
│   └── subscription.js   # Update latency
├── eventlistener/        # Event processing tests
│   ├── event-stress.js   # Event flood test
│   └── sync-accuracy.js  # Consistency validation
└── utils/                # Shared utilities
    ├── test-data.js      # Test data generators
    ├── metrics.js        # Custom metrics
    └── helpers.js        # Common helper functions
```

## Performance Targets

### Database Performance
- Query response time: <100ms (95th percentile)
- Concurrent queries: 1,000+ simultaneous
- Write throughput: 500+ inserts/second

### Blockchain Performance
- Transaction success rate: >99%
- Transaction throughput: 100+ transactions/minute
- Confirmation time: <5 seconds average

### Real-Time Performance
- WebSocket connections: 500+ concurrent
- Update latency: <200ms end-to-end
- Message delivery: 100% reliability

### Event Listener Performance
- Event processing rate: 1,000+ events/minute
- Processing latency: <1 second average
- Sync accuracy: 100% consistency

## Test Scenarios

### Database Load Test
```bash
k6 run tests/load/database/markets-query.js
```
Simulates 1,000+ concurrent users querying market data.

### Blockchain Throughput Test
```bash
k6 run tests/load/blockchain/place-bets.js
```
Simulates 100 bets/minute on Solana devnet.

### WebSocket Load Test
```bash
k6 run tests/load/realtime/websocket-load.js
```
Tests 500+ concurrent WebSocket connections.

### Event Listener Stress Test
```bash
k6 run tests/load/eventlistener/event-stress.js
```
Simulates 1,000 events/minute processing.

## Configuration

### Environment Variables

Create `.env.load-test` with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=YourProgramId

# WebSocket Configuration
WS_URL=wss://your-project.supabase.co/realtime/v1

# Test Configuration
TEST_DURATION=5m
VIRTUAL_USERS=100
RAMP_UP_TIME=30s
```

### k6 Options

Default options in `k6-config.js`:
- Virtual Users (VUs): 100
- Duration: 5 minutes
- Ramp-up time: 30 seconds
- Thresholds: Response time p95 < 100ms, success rate > 99%

Override with CLI flags:
```bash
k6 run --vus 500 --duration 10m tests/load/database/markets-query.js
```

## Metrics and Reporting

### Built-in Metrics
- `http_reqs`: Total HTTP requests
- `http_req_duration`: Request duration (avg, min, max, p95, p99)
- `http_req_failed`: Failed requests rate
- `vus`: Current virtual users
- `iterations`: Total iterations completed

### Custom Metrics
- `database_query_time`: Database-specific query timing
- `transaction_success_rate`: Blockchain transaction success
- `websocket_latency`: Real-time update latency
- `event_processing_time`: Event listener processing time

### Output Formats

**Console (default)**:
```bash
k6 run tests/load/database/markets-query.js
```

**JSON**:
```bash
k6 run --out json=results.json tests/load/database/markets-query.js
```

**InfluxDB + Grafana**:
```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/database/markets-query.js
```

## Troubleshooting

### k6 not found
Ensure k6 is installed and in your PATH. Run `k6 version` to verify.

### Connection refused
Check that test environment (Supabase, Solana RPC) is accessible and environment variables are set.

### Rate limiting
If hitting rate limits, reduce VUs or add delays between requests using `sleep()`.

### Memory issues
For large-scale tests, consider using k6 cloud or distributed execution.

## Best Practices

1. **Start small**: Begin with low VU count and short duration
2. **Ramp up gradually**: Use ramp-up stages to avoid overwhelming the system
3. **Monitor resource usage**: Watch CPU, memory, and network on test and target systems
4. **Use thresholds**: Define pass/fail criteria in test scripts
5. **Test in isolation**: Run one test at a time to isolate bottlenecks
6. **Document results**: Save metrics and analysis for comparison

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Install k6
  run: |
    curl https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz -L | tar xvz
    sudo cp k6-v0.46.0-linux-amd64/k6 /usr/bin/

- name: Run load tests
  run: k6 run tests/load/database/markets-query.js
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Grafana k6](https://grafana.com/docs/k6/latest/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [Solana RPC Performance](https://docs.solana.com/cluster/rpc-endpoints)
