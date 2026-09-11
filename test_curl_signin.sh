#!/bin/bash
curl -i -X POST https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin \
  -H "Origin: https://tableau-jwt-embed-chat.vercel.app" \
  -H "Content-Type: application/json;charset=UTF-8" \
  -H "Referer: https://tableau-jwt-embed-chat.vercel.app/" \
  --data-binary @payload_signin.json
