#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')
echo "Token: $TOKEN"
echo ""
curl -s -X POST http://localhost:3000/resume/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_resume.txt" | jq .
