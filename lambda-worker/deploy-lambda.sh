#!/bin/bash
set -euo pipefail

FUNCTION_NAME="${1:?Usage: deploy-lambda.sh <function-name>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_DIR="$SCRIPT_DIR/../../sdk-node"

# Build TypeScript
cd "$SCRIPT_DIR"
pnpm build

# Bundle workflows
pnpm build:workflow-bundle

# Create packaging directory
rm -rf "$SCRIPT_DIR/package"
mkdir -p "$SCRIPT_DIR/package"

# Copy compiled JS to package root (so index.js is at zip root for the default handler)
cp "$SCRIPT_DIR/lib/"*.js "$SCRIPT_DIR/package/"

# Copy workflow bundle alongside the handler
cp "$SCRIPT_DIR/workflow-bundle.js" "$SCRIPT_DIR/package/"

# Install production dependencies.
# TODO: Once @temporalio/lambda-worker is published, remove the sed and the
# manual copy below — npm install will handle everything.
cd "$SCRIPT_DIR/package"
sed '/@temporalio\/lambda-worker/d' "$SCRIPT_DIR/package.json" > package.json
npm install --omit=dev --ignore-scripts

# Strip native binaries for platforms other than Lambda's (linux x86_64)
find node_modules/@temporalio/core-bridge/releases -mindepth 1 -maxdepth 1 \
    ! -name 'x86_64-unknown-linux-gnu' -exec rm -rf {} +

# Manually place the local lambda-worker package (not yet published)
mkdir -p node_modules/@temporalio/lambda-worker
cp "$SDK_DIR/packages/lambda-worker/package.json" node_modules/@temporalio/lambda-worker/
cp -r "$SDK_DIR/packages/lambda-worker/lib" node_modules/@temporalio/lambda-worker/

# Copy config files and certs
cp "$SCRIPT_DIR/temporal.toml" "$SCRIPT_DIR/otel-collector-config.yaml" \
   "$SCRIPT_DIR/client.pem" "$SCRIPT_DIR/client.key" "$SCRIPT_DIR/package/"

# Create zip
cd "$SCRIPT_DIR/package"
zip -r "$SCRIPT_DIR/function.zip" .

# Deploy
aws lambda update-function-code --function-name "$FUNCTION_NAME" \
  --zip-file fileb://"$SCRIPT_DIR/function.zip"

# Cleanup
rm -rf "$SCRIPT_DIR/package" "$SCRIPT_DIR/function.zip"
