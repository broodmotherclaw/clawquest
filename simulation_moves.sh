#!/bin/bash

# Headers
HEADERS='-H "Content-Type: application/json" -H "X-OpenClaw-Bot: true" -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET"'
BASE_URL="http://localhost:3001/api"

echo "🎮 CLAWQUEST SIMULATION - 15 EXCITING MOVES 🎮"
echo "=============================================="
echo ""

# First, let me get the hex list to identify targets
echo "📊 Getting current hex map..."
HEX_DATA=$(curl -s "${BASE_URL}/hexes")
echo ""

# Get agent list
echo "🤖 Getting agents..."
AGENTS=$(curl -s "${BASE_URL}/agents")
echo ""

echo "🎬 STARTING THE SIMULATION! 🎬"
echo ""

# MOVE 1: Alpha-One claims a new hex (neutral territory expansion)
echo "⚔️  MOVE 1: Alpha-One claims new neutral hex at (2,3)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "d983b397-d182-4b62-8ade-69a5b22cb4c9",
    "q": 2,
    "r": 3,
    "question": "What is the powerhouse of the cell?",
    "answer": "Mitochondria"
  }' | jq -c '{success: .success, owner: .hex.owner.name, q: .hex.q, r: .hex.r} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 2: Gamma-Three CHALLENGES Alpha-One's hex (BATTLE!)
echo "⚔️  MOVE 2: 🔥 BATTLE! Gamma-Three challenges Alpha-One's hex at (3,0)! 🔥"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "b33a9f6f-b6d7-4391-855d-8b59dc952b4a",
    "hexId": "20bef525-3efe-4ed5-bd4d-f39192229842",
    "answer": "299792458 m/s"
  }' | jq -c '{success: .success, stolen: .success, validation: .validation.isValid, explanation: .validation.explanation} 2>/dev/null || cat'
echo ""

# MOVE 3: Beta-Two claims another hex
echo "⚔️  MOVE 3: Beta-Two claims neutral hex at (-5,2)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "0a7ff26c-5a14-4257-8fca-c8c8e8a8ec0c",
    "q": -5,
    "r": 2,
    "question": "What is the chemical formula for water?",
    "answer": "H2O"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 4: Delta-Four attempts to STEAL from Zeta-Six (FAILS - wrong answer)
echo "⚔️  MOVE 4: 💀 Delta-Four tries to steal from Zeta-Six at (0,5) but gives WRONG ANSWER!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "60c7bf81-b09d-4a47-9fe9-e0da6521d3f3",
    "hexId": "03386322-9bc1-454e-bae9-a017d11cf277",
    "answer": "Mount Kilimanjaro"
  }' | jq -c '{success: .success, error: .error, validation: .validation} 2>/dev/null || cat'
echo ""

# MOVE 5: Epsilon-Five claims new territory (Science category)
echo "⚔️  MOVE 5: Epsilon-Five claims hex at (4,2) with a Physics question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "c58f4f3d-8e3f-4c9e-b7f1-9a2b3c4d5e6f",
    "q": 4,
    "r": 2,
    "question": "Who developed the theory of relativity?",
    "answer": "Albert Einstein"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 6: Zeta-Six SUCCESSFULLY STEALS from Gamma-Three! (DRAMATIC!)
echo "⚔️  MOVE 6: 🔥🔥 DRAMATIC BATTLE! Zeta-Six steals Gamma-Three's hex! 🔥🔥"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "6900c6e7-d164-4336-84db-cdb689573b3d",
    "hexId": "046b5332-0973-45ce-bd48-9c06463f019e",
    "answer": "4"
  }' | jq -c '{success: .success, stolen: .success, newOwner: .hex.owner.name, validation: .validation.isValid} 2>/dev/null || cat'
echo ""

# MOVE 7: Eta-Seven claims with Art question
echo "⚔️  MOVE 7: Eta-Seven claims hex at (-2,-3) with Art trivia..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "f1a2b3c4-d5e6-4f7a-g8b9-h0i1j2k3l4m5",
    "q": -2,
    "r": -3,
    "question": "Who painted the Mona Lisa?",
    "answer": "Leonardo da Vinci"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 8: Theta-Eight CHALLENGES Beta-Two (Science battle)
echo "⚔️  MOVE 8: 🧪 Theta-Eight challenges Beta-Two on Astronomy question!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "n6o7p8q9-r0s1-4t2u-v3w4-x5y6z7a8b9c0",
    "hexId": "096dbab3-ba79-4952-8f48-2bfc994a8760",
    "answer": "Jupiter"
  }' | jq -c '{success: .success, stolen: .success, validation: .validation.isValid} 2>/dev/null || cat'
echo ""

# MOVE 9: Iota-Nine claims with History
echo "⚔️  MOVE 9: Iota-Nine claims hex at (1,-4) with History question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "d4e5f6g7-h8i9-4j0k-l1m2-n3o4p5q6r7s8",
    "q": 1,
    "r": -4,
    "question": "In which year did World War II end?",
    "answer": "1945"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 10: Kappa-Ten FAILS to steal from Delta-Four (wrong answer)
echo "⚔️  MOVE 10: 💀 Kappa-Ten attempts to steal from Delta-Four but FAILS!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "t8u9v0w1-x2y3-4z4a-b5c6-d7e8f9g0h1i2",
    "hexId": "0c7782c0-6e8b-43c7-ab68-ef3a541fabb5",
    "answer": "Kyoto"
  }' | jq -c '{success: .success, error: .error, validation: .validation} 2>/dev/null || cat'
echo ""

# MOVE 11: Alpha-One SUCCESSFULLY reclaims territory!
echo "⚔️  MOVE 11: 🔥 REVENGE! Alpha-One steals back from Gamma-Three!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "d983b397-d182-4b62-8ade-69a5b22cb4c9",
    "hexId": "046b5332-0973-45ce-bd48-9c06463f019e",
    "answer": "4"
  }' | jq -c '{success: .success, stolen: .success, validation: .validation.isValid} 2>/dev/null || cat'
echo ""

# MOVE 12: Gamma-Three claims new neutral territory
echo "⚔️  MOVE 12: Gamma-Three claims new hex at (3,-2)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "b33a9f6f-b6d7-4391-855d-8b59dc952b4a",
    "q": 3,
    "r": -2,
    "question": "What is the longest river in the world?",
    "answer": "Nile"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

# MOVE 13: Beta-Two FAILS challenge (wrong geography answer)
echo "⚔️  MOVE 13: 💀 Beta-Two fails to steal from Zeta-Six - Wrong geography!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "0a7ff26c-5a14-4257-8fca-c8c8e8a8ec0c",
    "hexId": "03386322-9bc1-454e-bae9-a017d11cf277",
    "answer": "K2"
  }' | jq -c '{success: .success, error: .error} 2>/dev/null || cat'
echo ""

# MOVE 14: Delta-Four SUCCESSFULLY steals from Zeta-Six! 
echo "⚔️  MOVE 14: 🔥 Delta-Four finally succeeds in stealing from Zeta-Six!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "60c7bf81-b09d-4a47-9fe9-e0da6521d3f3",
    "hexId": "046b5332-0973-45ce-bd48-9c06463f019e",
    "answer": "4"
  }' | jq -c '{success: .success, stolen: .success, validation: .validation.isValid} 2>/dev/null || cat'
echo ""

# MOVE 15: Epsilon-Five claims final territory with Literature
echo "⚔️  MOVE 15: Epsilon-Five claims hex at (-3,4) with Literature question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d '{
    "agentId": "c58f4f3d-8e3f-4c9e-b7f1-9a2b3c4d5e6f",
    "q": -3,
    "r": 4,
    "question": "Who wrote Romeo and Juliet?",
    "answer": "William Shakespeare"
  }' | jq -c '{success: .success, owner: .hex.owner.name} 2>/dev/null || echo "✅ Claimed!"'
echo ""

echo ""
echo "=============================================="
echo "🎬 SIMULATION COMPLETE! 🎬"
echo "=============================================="
