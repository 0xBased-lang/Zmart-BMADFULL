#!/bin/bash
echo "🔍 Checking bets table schema..."

# Get the bets table structure
curl -s "https://nyfwfwgjhkabxtzaorpc.supabase.co/rest/v1/bets?select=*&limit=0" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" | jq .

echo ""
echo "🔍 Checking if column is bettor_wallet or user_wallet..."

# Try with bettor_wallet
echo "Testing bettor_wallet column:"
curl -s "https://nyfwfwgjhkabxtzaorpc.supabase.co/rest/v1/bets?select=bettor_wallet&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" 2>&1

echo ""
echo "Testing user_wallet column:"
curl -s "https://nyfwfwgjhkabxtzaorpc.supabase.co/rest/v1/bets?select=user_wallet&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" 2>&1

