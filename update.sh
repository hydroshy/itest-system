#!/bin/bash
set -e

echo "🚀 [1/3] Pulling latest commits from Git..."
git pull origin main

if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🐳 [2/3] Detected Docker Compose. Rebuilding container 'app' with newest code..."
    docker compose up -d --build app
    echo "✅ [3/3] Update completed successfully! App container is running latest code."
else
    echo "📦 [2/3] Building NestJS application..."
    npm install
    npm run build
    if command -v pm2 &> /dev/null; then
        echo "🔄 [3/3] Restarting PM2 process..."
        pm2 restart all || pm2 start dist/main.js --name dvt
        echo "✅ [3/3] PM2 restarted successfully!"
    else
        echo "✅ [3/3] Build completed. Run 'npm run start:prod' or restart your service."
    fi
fi
