#!/bin/bash

# Test script for Azure Event Grid CloudEvents handshake handling
# This script tests the OPTIONS request handling that Azure Event Grid uses
# for webhook subscription validation (abuse protection).
#
# Azure Event Grid sends an HTTP OPTIONS request with:
# - Webhook-Request-Origin header (e.g., "eventgrid.azure.net")
# - Webhook-Request-Callback header (validation URL)
#
# The component must respond with:
# - HTTP 200 status code
# - WebHook-Allowed-Origin header set to the request origin
#
# Reference: https://learn.microsoft.com/en-us/azure/event-grid/end-point-validation-cloud-events-schema

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPONENT_DIR="$SCRIPT_DIR/EventReceived"

echo "=========================================="
echo "Testing Azure Event Grid CloudEvents Handshake"
echo "Component Directory: $COMPONENT_DIR"
echo "=========================================="
echo ""

# Test 1: Valid CloudEvents handshake with eventgrid.azure.net origin
echo "Test 1: Valid CloudEvents handshake (eventgrid.azure.net)"
echo "------------------------------------------------------------"
echo "Expected: HTTP 200 with WebHook-Allowed-Origin: eventgrid.azure.net"
echo ""

# Test input format: Provide the structure that Appmixer expects for webhook components
# Based on terminal output showing triple-nested content, Appmixer wraps the input multiple times
# We need to provide the structure that results in context.messages.webhook.content having method/headers/data
# Try providing just the method/headers directly without content wrapper
npx appmixer test component "$COMPONENT_DIR" \
  -i '{
    "webhook": {
      "method": "OPTIONS",
      "headers": {
        "webhook-request-origin": "eventgrid.azure.net",
        "webhook-request-callback": "https://rp-swedencentral.eventgrid.azure.net:553/eventsubscriptions/appmixer-sub/validate?id=265480EE-D09B-4A22-A241-7852B16156D1&t=2025-12-02T09:28:46.8109783Z&apiVersion=2025-04-01-preview&token=1nMUNXpfDAMVzZI72I7j5S5OqbCq3zxOUupQb73tPds%3d"
      }
    }
  }'

echo ""
echo "=========================================="
echo "Test suite completed"
echo "=========================================="

