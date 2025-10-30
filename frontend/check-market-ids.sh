#!/bin/bash

echo "🔍 Checking what market IDs exist in database..."

curl -s "https://nyfwfwgjhkabxtzaorpc.supabase.co/rest/v1/markets?select=market_id,question&order=market_id.asc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" | jq -r '.[] | "\(.market_id): \(.question)"'

echo ""
echo "✅ Testing market detail pages..."
for id in $(curl -s "https://nyfwfwgjhkabxtzaorpc.supabase.co/rest/v1/markets?select=market_id&order=market_id.asc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zndmd2dqaGthYnh0emFvcnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NjI3NDUsImV4cCI6MjA0NTQzODc0NX0.lxTqCFvLyP5aTwbzwXYe2w-1-X3k2YL0n7fPqJ-IbVw" | jq -r '.[].market_id'); do
  echo "Testing market ID: $id"
done

