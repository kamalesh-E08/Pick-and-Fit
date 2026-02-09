#!/bin/bash
# Test the fit prediction API

API_URL="http://localhost:3000/api/fit-predict"

echo "🧪 Testing Fit Prediction API"
echo "=============================="

# Test 1: Get product sizes
echo -e "\n1️⃣  GET /api/fit-predict?productId=1"
echo "   (Get available sizes for a product)"
curl -s "$API_URL?productId=1" | jq '.'

# Test 2: Predict size for small person
echo -e "\n\n2️⃣  POST /api/fit-predict (Small person: 160cm, 55kg)"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"height": 160, "weight": 55, "productId": "1"}' | jq '.'

# Test 3: Predict size for tall person
echo -e "\n\n3️⃣  POST /api/fit-predict (Tall person: 185cm, 80kg)"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"height": 185, "weight": 80, "productId": "1"}' | jq '.'

# Test 4: Predict with past size
echo -e "\n\n4️⃣  POST /api/fit-predict (With past size: M)"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"height": 172, "weight": 70, "productId": "1", "pastSize": "M"}' | jq '.'

echo -e "\n\n✅ Tests complete!"
