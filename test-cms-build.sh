#!/bin/bash
set -e

echo "1. Running turbo prune for testing..."
npx turbo prune @project-aurora/website-builder-web --docker

echo "2. Simulating Docker builder stage..."
rm -rf mock-builder
mkdir mock-builder
cd mock-builder

# Stage 2 Simulation
cp -r ../out/json/* .
cp ../out/pnpm-lock.yaml ./
cp ../out/pnpm-workspace.yaml ./

echo "Installing dependencies..."
pnpm install --prefer-offline

cp -r ../out/full/* .

echo "3. Generating Database Client..."
cp -r ../out/full/packages/database/prisma ./packages/database/prisma
pnpm --filter @project-aurora/database run db:generate

echo "4. Building CMS..."
pnpm turbo build --filter=@project-aurora/website-builder-web...

echo "Done! The CMS build succeeded."
