#!/bin/bash
set -e

echo "Building client..."
npm --prefix client install
npm --prefix client run build

echo "Installing server dependencies..."
npm --prefix server install

cd server
echo "Generating Prisma client..."
npx prisma generate

# Use non-pooling URL for Prisma db push if using Vercel Postgres
export DATABASE_URL=${DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-$POSTGRES_URL}}

if [ -n "$DATABASE_URL" ]; then
  echo "External Database detected. Pushing schema..."
  npx prisma db push --accept-data-loss
  echo "Seeding database..."
  node prisma/seed.js
else
  echo "No external database configured. Skipping migration."
fi
