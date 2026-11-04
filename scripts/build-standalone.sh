#!/bin/sh
set -e

echo "Installing standalone dependencies..."
npm install @nestjs/jwt@^10 @nestjs/serve-static@^4 postgres @vitejs/plugin-react@^5 --legacy-peer-deps
npm install -D drizzle-kit --legacy-peer-deps

echo "Building frontend..."
npx vite build --config vite.standalone.config.ts

echo "Building backend..."
npx nest build -c nest-cli.standalone.json

echo "Build complete!"
