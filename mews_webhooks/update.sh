#!/bin/bash

# Script to update Mews Webhooks component in Appmixer
# This removes the old version, packs, and publishes the new version

set -e  # Exit on error

COMPONENT_NAME="appmixer.mews_webhooks_a"
COMPONENT_DIR="mews_webhooks_a"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPONENTS_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==========================================="
echo "Updating $COMPONENT_NAME"
echo "==========================================="
echo ""

cd "$COMPONENTS_ROOT"

# Step 1: Remove old version
echo "Step 1/3: Removing old version..."
npx appmixer remove "$COMPONENT_NAME" || echo "Component not found or already removed"
echo ""

# Step 2: Pack new version
echo "Step 2/3: Packing new version..."
npx appmixer pack "$COMPONENT_DIR"
echo ""

# Step 3: Publish new version
echo "Step 3/3: Publishing new version..."
npx appmixer publish "${COMPONENT_NAME}.zip"
echo ""

echo "==========================================="
echo "✅ Update complete!"
echo "==========================================="

