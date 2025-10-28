-- Temporary Test Schema for Story 3.9 Leaderboard Testing
-- Note: This is a minimal schema for testing purposes only
-- Full schema will be created in Epic 1, Story 1.8

-- Users table
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  activity_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  winning_outcome TEXT,
  creator_wallet TEXT REFERENCES users(wallet_address),
  total_volume NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_wallet TEXT REFERENCES users(wallet_address),
  market_id INTEGER REFERENCES markets(id),
  outcome TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  profit_loss NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test data for leaderboard testing
INSERT INTO users (wallet_address, activity_points) VALUES
  ('TestUser1WalletAddress123456789', 1000),
  ('TestUser2WalletAddress987654321', 850),
  ('TestUser3WalletAddress456789123', 720),
  ('TestUser4WalletAddress789123456', 650),
  ('TestUser5WalletAddress321654987', 500)
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert test markets
INSERT INTO markets (market_id, question, status, creator_wallet, total_volume) VALUES
  (1, 'Will BTC reach $100k by end of 2025?', 'active', 'TestUser1WalletAddress123456789', 5000),
  (2, 'Will ETH reach $5k by Q2 2025?', 'active', 'TestUser2WalletAddress987654321', 3500),
  (3, 'Will SOL reach $200 by Q1 2025?', 'resolved', 'TestUser1WalletAddress123456789', 2500)
ON CONFLICT DO NOTHING;

-- Insert test bets
INSERT INTO bets (user_wallet, market_id, outcome, amount, profit_loss) VALUES
  ('TestUser1WalletAddress123456789', 1, 'YES', 100, 50),
  ('TestUser1WalletAddress123456789', 2, 'NO', 200, -200),
  ('TestUser2WalletAddress987654321', 1, 'YES', 150, 75),
  ('TestUser2WalletAddress987654321', 3, 'YES', 300, 300),
  ('TestUser3WalletAddress456789123', 2, 'NO', 100, NULL),
  ('TestUser3WalletAddress456789123', 3, 'YES', 200, 200),
  ('TestUser4WalletAddress789123456', 1, 'NO', 50, -50),
  ('TestUser5WalletAddress321654987', 2, 'YES', 80, NULL)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Test schema created successfully for Story 3.9 leaderboard testing' AS status;
