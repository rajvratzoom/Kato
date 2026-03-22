#!/bin/bash
cd "$(dirname "$0")"

# Kill any existing Kato server
pkill -f "tsx src/index.ts" 2>/dev/null || true
sleep 1

# Rebuild client if needed
if [ ! -d "client/dist" ] || [ "$(find client/src -newer client/dist/index.html 2>/dev/null | head -1)" ]; then
  echo "📦 Building client..."
  cd client && npx vite build && cd ..
fi

# Start server (serves both API + built client)
echo "🤖 Starting Kato on port 3001..."
cd server && npx tsx src/index.ts
