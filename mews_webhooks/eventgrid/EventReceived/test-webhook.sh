#!/bin/bash

# This script contains curl requests to test the Appmixer component.
# It sends CloudEvents-formatted webhook payloads to verify the EventReceived trigger functionality.

# Replace YOUR_WEBHOOK_URL with the actual webhook URL from AppMixer
WEBHOOK_URL="https://api.powerful-collie-1942.appmixer.cloud/flows/b0886af3-ea8a-4f4b-811a-96fc1f30f2cd/components/bb599f11-22f2-4883-a387-948212ca2101"

echo "=== Testing CloudEvents Handshake (OPTIONS) ==="
curl -X OPTIONS "$WEBHOOK_URL" \
  -H "webhook-request-origin: https://eventgrid.azure.net" \
  -v

# echo -e "\n\n=== Testing CloudEvents POST Request ==="
# curl -X POST "$WEBHOOK_URL" \
#   -H "Content-Type: application/json" \
#   -H "ce-specversion: 1.0" \
#   -d '[
#     {
#       "specversion": "1.0",
#       "type": "com.mews.reservation.created",
#       "source": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.EventGrid/domains/{domain-name}",
#       "id": "TEST-ID-123",
#       "time": "2024-01-15T10:00:00Z",
#       "subject": "reservations/666",
#       "data": {
#         "reservationId": "666",
#         "enterpriseId": "1234",
#         "status": "confirmed"
#       }
#     }
#   ]' \
#   -v

